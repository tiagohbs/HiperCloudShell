import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import os from 'node:os';

let pty = null;
try {
  const ptyImport = await import('node-pty');
  pty = ptyImport.default || ptyImport;
} catch (_) {
  // Graceful fallback caso node-pty ainda não esteja instalado no ambiente local
}

// Expressao regular para limpeza de codigos ANSI (cores, cursores, TUI)
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;

// Padroes classicos de prompt interativo que travam agentes em CLI
const INTERACTIVE_PROMPT_REGEX = /(\[y\/n\]|\[Y\/n\]|\(y\/n\)|Continue\?|Do you want to proceed\?|Press Enter)/i;

export function stripAnsi(raw) {
  if (typeof raw !== 'string') return '';
  return raw.replace(ANSI_REGEX, '');
}

/**
 * Gestor de Terminais Interativos (PTY) para a interface do HiperCloudShell
 */
export class TerminalManager extends EventEmitter {
  constructor(mainWindow = null, cloudShellProvider = null) {
    super();
    this.mainWindow = mainWindow;
    this.cloudShellProvider = cloudShellProvider;
    this.sessions = new Map(); // Map<paneId, SessionObject>
  }

  /**
   * Monta o comando nao-interativo ideal para cada CLI de Agente
   */
  buildAgentLaunchCommand(cli, specRelativePath = '.maestro/TASK_SPEC.md') {
    const adapters = {
      gemini: `gemini --prompt-file "${specRelativePath}"`,
      claude: `claude -p "Execute estritamente a especificacao em ${specRelativePath} e imprima <<MAESTRO_TASK_DONE>> ao finalizar."`,
      opencode: `opencode run --file "${specRelativePath}"`,
      codex: `codex --approval-mode full-auto "Siga ${specRelativePath} e imprima <<MAESTRO_TASK_DONE>>"`,
      aider: `aider --yes-always --message-file "${specRelativePath}"`
    };
    return adapters[cli] || `${cli} "${specRelativePath}"`;
  }

  /**
   * Cria sessao interativa direta para terminal do usuário (PTY ou fallback child_process)
   */
  createSession(termId, { cwd = process.cwd(), shell, env = {} } = {}) {
    const defaultShell = shell || (os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash');
    const mergedEnv = { ...process.env, ...env, TERM: 'xterm-256color' };

    if (pty) {
      const ptyProcess = pty.spawn(defaultShell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 34,
        cwd,
        env: mergedEnv
      });

      ptyProcess.onData((data) => {
        this.emit('term:data', { termId, data });
      });

      ptyProcess.onExit(({ exitCode }) => {
        this.emit('term:exit', { termId, exitCode });
        this.sessions.delete(termId);
      });

      this.sessions.set(termId, { type: 'pty', proc: ptyProcess, cwd });
      return { termId, mode: 'node-pty' };
    }

    // Fallback com child_process caso node-pty não esteja ativo
    const proc = spawn(defaultShell, [], { cwd, env: mergedEnv, shell: true });
    proc.stdout?.on('data', (chunk) => this.emit('term:data', { termId, data: chunk.toString() }));
    proc.stderr?.on('data', (chunk) => this.emit('term:data', { termId, data: chunk.toString() }));
    proc.on('close', (exitCode) => {
      this.emit('term:exit', { termId, exitCode });
      this.sessions.delete(termId);
    });

    this.sessions.set(termId, { type: 'spawn', proc, cwd });
    return { termId, mode: 'child_process' };
  }

  write(termId, input) {
    const session = this.sessions.get(termId);
    if (!session) return;
    if (session.type === 'pty' || (session.proc && typeof session.proc.write === 'function')) {
      session.proc.write(input);
    } else if (session.proc?.stdin?.writable) {
      session.proc.stdin.write(input);
    }
  }

  resize(termId, cols, rows) {
    const session = this.sessions.get(termId);
    if (session && typeof session.proc?.resize === 'function') {
      session.proc.resize(cols, rows);
    }
  }

  kill(termId) {
    const session = this.sessions.get(termId);
    if (!session) return;
    if (session.silenceTimer) clearTimeout(session.silenceTimer);
    try {
      session.proc.kill('SIGKILL');
    } catch (_) {
      try {
        session.proc.kill();
      } catch (_) {}
    }
    this.sessions.delete(termId);
  }

  /**
   * Cria uma sessao de terminal isolada (Local via node-pty ou Remota via CloudShellProvider)
   */
  spawnAgentPane({
    paneId,
    taskId,
    roleId,
    cli = 'gemini',
    provider = 'local',
    cwd,
    env = {},
    silenceTimeoutMs = 45000,
    autoApprovePrompts = false
  }) {
    if (this.sessions.has(paneId)) {
      this.killPane(paneId);
    }

    const shell = os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash';
    const isCloud = provider === 'cloudshell' && this.cloudShellProvider;

    if (!isCloud && !pty) {
      throw new Error(
        "Módulo nativo 'node-pty' não carregado. Execute 'npm install' para inicializar terminais locais."
      );
    }

    const proc = isCloud
      ? this.cloudShellProvider.spawnSession({ paneId, cwd, env })
      : pty.spawn(shell, [], {
          name: 'xterm-256color',
          cols: 120,
          rows: 36,
          cwd,
          env: { ...process.env, ...env, FORCE_COLOR: '1' }
        });

    const session = {
      paneId,
      taskId,
      roleId,
      cli,
      provider,
      cwd,
      proc,
      cleanBuffer: '',
      silenceTimer: null,
      completionResolvers: [],
      lastCompletionPayload: null,
      status: 'RUNNING'
    };

    const resetWatchdog = () => {
      if (session.silenceTimer) clearTimeout(session.silenceTimer);
      session.silenceTimer = setTimeout(() => {
        const tail = session.cleanBuffer.slice(-350);
        const isWaitingPrompt = INTERACTIVE_PROMPT_REGEX.test(tail);

        if (isWaitingPrompt && autoApprovePrompts) {
          // Auto-resposta segura dentro do worktree isolado
          this.writeToPane(paneId, 'y\r');
          this.sendIpc('maestro:agent-auto-approved', { paneId, taskId, tail });
          return;
        }

        this.emit('pane-stuck', { paneId, taskId, isWaitingPrompt, tail });
        this.sendIpc('maestro:pane-stuck', { paneId, taskId, isWaitingPrompt, tail });
      }, silenceTimeoutMs);
    };

    proc.onData((rawData) => {
      const cleanChunk = stripAnsi(rawData);
      session.cleanBuffer += cleanChunk;

      // Mantem janela deslizante de 50KB no buffer limpo para nao vazar memoria
      if (session.cleanBuffer.length > 50000) {
        session.cleanBuffer = session.cleanBuffer.slice(-40000);
      }

      // Estimativa rapida de tokens (aprox. 4 caracteres por token emitido)
      const estimatedTokens = Math.max(1, Math.ceil(cleanChunk.length / 4));
      this.emit('tokens-delta', { paneId, taskId, tokens: estimatedTokens });

      // Envia stream bruto para o xterm.js no Grid React
      this.sendIpc('term:data', { paneId, taskId, data: rawData });

      resetWatchdog();

      // Verifica se o agente imprimiu o marcador oficial de conclusao da tarefa
      if (session.cleanBuffer.includes('<<MAESTRO_TASK_DONE>>')) {
        if (session.silenceTimer) clearTimeout(session.silenceTimer);
        // Remove o marcador do buffer ativo para permitir novos ciclos caso o Gate reprove
        session.cleanBuffer = session.cleanBuffer.replaceAll('<<MAESTRO_TASK_DONE>>', '[DONE_ACK]');

        const payload = {
          paneId,
          taskId,
          reason: 'MARKER_DETECTED',
          tail: session.cleanBuffer.slice(-1000)
        };

        session.lastCompletionPayload = payload;
        this.emit('task-turn-complete', payload);

        for (const resolve of session.completionResolvers.splice(0)) {
          resolve(payload);
        }
      }
    });

    proc.onExit(({ exitCode, signal }) => {
      if (session.silenceTimer) clearTimeout(session.silenceTimer);
      session.status = 'EXITED';
      const payload = { paneId, taskId, reason: 'PROCESS_EXIT', exitCode, signal };
      session.lastCompletionPayload = payload;

      this.sendIpc('term:exit', payload);
      this.emit('pane-exit', payload);

      for (const resolve of session.completionResolvers.splice(0)) {
        resolve(payload);
      }
    });

    this.sessions.set(paneId, session);
    resetWatchdog();

    // Dispara o CLI do agente apontando para o Context Pack local do worktree
    const launchCmd = this.buildAgentLaunchCommand(cli);
    this.writeToPane(paneId, `${launchCmd}\r`);

    return session;
  }

  /**
   * Aguarda ate que o agente sinalize <<MAESTRO_TASK_DONE>> ou encerre o processo
   */
  waitForTurnCompletion(paneId, timeoutMs = 300000) {
    const session = this.sessions.get(paneId);
    if (!session) return Promise.reject(new Error(`Sessao PTY nao encontrada: ${paneId}`));

    // Se a conclusao ou saida ja tiver ocorrido antes do wait, resolve imediatamente (anti-race)
    if (session.lastCompletionPayload) {
      const payload = session.lastCompletionPayload;
      session.lastCompletionPayload = null;
      return Promise.resolve(payload);
    }

    if (session.status === 'EXITED') {
      return Promise.resolve({
        paneId,
        taskId: session.taskId,
        reason: 'PROCESS_EXIT_PREVIOUS',
        exitCode: 1
      });
    }

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Timeout de ${timeoutMs / 1000}s excedido aguardando agente no painel ${paneId}`));
      }, timeoutMs);

      session.completionResolvers.push((result) => {
        clearTimeout(timer);
        resolve(result);
      });
    });
  }

  writeToPane(paneId, text) {
    const session = this.sessions.get(paneId);
    if (!session) return false;
    session.proc.write(text);
    return true;
  }

  resizePane(paneId, cols, rows) {
    const session = this.sessions.get(paneId);
    if (session && typeof session.proc.resize === 'function') {
      session.proc.resize(cols, rows);
    }
  }

  killPane(paneId) {
    const session = this.sessions.get(paneId);
    if (!session) return;
    if (session.silenceTimer) clearTimeout(session.silenceTimer);
    try {
      session.proc.kill('SIGKILL');
    } catch (_) {
      try {
        session.proc.kill();
      } catch (_) {}
    }
    this.sessions.delete(paneId);
  }

  sendIpc(channel, payload) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, payload);
    }
  }
}

/**
 * DualEngineAdapter: Conecta o Maestro (Ultracode) aos CLIs reais:
 * - Claude Code CLI (`claude`)
 * - Google Antigravity CLI (`agy`)
 */
export class DualEngineAdapter extends EventEmitter {
  constructor({
    defaultProvider = 'claude', // 'claude' | 'antigravity' | 'hybrid'
    claudeBin = process.env.CLAUDE_BIN || 'claude',
    antigravityBin = process.env.AGY_BIN || 'agy',
    projectRoot = process.cwd()
  } = {}) {
    super();
    this.defaultProvider = defaultProvider;
    this.claudeBin = claudeBin;
    this.antigravityBin = antigravityBin;
    this.projectRoot = projectRoot;
  }

  /**
   * Seleciona qual motor executará o subagente:
   * - Se o script definir `provider: 'antigravity'` ou `provider: 'claude'`, respeita.
   * - No modo `'hybrid'`, usa Antigravity para descoberta/fan-out rápido e alterna os motores
   *   na verificação adversarial para que um audite o outro.
   */
  resolveProvider(options = {}) {
    if (options.provider === 'claude' || options.provider === 'antigravity') {
      return options.provider;
    }
    if (options.model) {
      if (/gemini|agy/i.test(options.model)) return 'antigravity';
      if (/claude|sonnet|opus|haiku/i.test(options.model)) return 'claude';
    }
    if (this.defaultProvider === 'hybrid') {
      const phase = (options.phase || '').toLowerCase();
      if (phase.includes('descoberta') || phase.includes('leque') || phase.includes('fan-out')) {
        return 'antigravity';
      }
      if (phase.includes('adversarial') || phase.includes('síntese') || phase.includes('sintese')) {
        return 'claude';
      }
    }
    return this.defaultProvider === 'hybrid' ? 'claude' : this.defaultProvider;
  }

  /**
   * Monta os argumentos de linha de comando específicos para o Claude CLI (`claude`)
   */
  buildClaudeArgs({ prompt, model, effort, acceptEdits, schema, stream = false }) {
    const args = ['-p', prompt, '--output-format', stream ? 'stream-json' : 'json'];

    if (stream) {
      args.push('--verbose');
    }
    if (acceptEdits) {
      args.push('--permission-mode', 'acceptEdits');
    }
    if (model) {
      args.push('--model', model);
    }
    if (effort) {
      const normalizedEffort = effort === 'ultracode' ? 'xhigh' : effort;
      args.push('--effort', normalizedEffort);
    }
    if (schema) {
      args.push('--json-schema', JSON.stringify(schema));
    }
    return args;
  }

  /**
   * Monta os argumentos de linha de comando específicos para o Google Antigravity CLI (`agy`)
   */
  buildAntigravityArgs({ prompt, model, effort, acceptEdits, schema, boost = false, stream = false }) {
    const effectivePrompt =
      (boost || effort === 'xhigh' || effort === 'ultracode') && !prompt.startsWith('/boost')
        ? `/boost ${prompt}`
        : prompt;

    const args = ['-p', effectivePrompt, '--output-format', stream ? 'stream-json' : 'json'];

    if (acceptEdits) {
      args.push('--mode', 'accept-edits');
    }
    if (model) {
      args.push('--model', model);
    }
    if (schema) {
      args.push('--json-schema', JSON.stringify(schema));
    }
    return args;
  }

  /**
   * 1ª Fase do Ultracode: Gera o script JavaScript de Dynamic Workflow usando Claude ou Antigravity
   */
  async generateWorkflowScript({ prompt, systemPrompt, effort = 'xhigh', provider }) {
    const targetProvider = provider || (this.defaultProvider === 'antigravity' ? 'antigravity' : 'claude');
    const fullPrompt = `${systemPrompt}\n\nTAREFA DO UTILIZADOR:\n${prompt}`;

    const res = await this.runAgent({
      prompt: fullPrompt,
      cwd: this.projectRoot,
      provider: targetProvider,
      effort,
      acceptEdits: false
    });

    return this.stripMarkdownCodeences(typeof res.output === 'string' ? res.output : JSON.stringify(res.output));
  }

  /**
   * 2ª Fase do Ultracode: Executa um subagente isolado via processo CLI (`claude` ou `agy`)
   */
  async runAgent({
    prompt,
    cwd = this.projectRoot,
    provider,
    model,
    effort = 'high',
    acceptEdits = true,
    schema = null,
    signal = null,
    label = 'subagent',
    phase = ''
  }) {
    const resolvedProvider = this.resolveProvider({ provider, model, phase });
    const binary = resolvedProvider === 'antigravity' ? this.antigravityBin : this.claudeBin;

    const args =
      resolvedProvider === 'antigravity'
        ? this.buildAntigravityArgs({ prompt, model, effort, acceptEdits, schema })
        : this.buildClaudeArgs({ prompt, model, effort, acceptEdits, schema });

    return await new Promise((resolve, reject) => {
      if (signal?.aborted) {
        return reject(new Error('WORKFLOW_PAUSED'));
      }

      const child = spawn(binary, args, {
        cwd,
        env: { ...process.env, FORCE_COLOR: '0' },
        shell: os.platform() === 'win32'
      });

      let stdout = '';
      let stderr = '';

      const onAbort = () => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL');
        }, 1500);
        reject(new Error('WORKFLOW_PAUSED'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        this.emit('agent:stream', { label, provider: resolvedProvider, chunk: text });
      });

      child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (err) => {
        if (signal) signal.removeEventListener('abort', onAbort);
        reject(new Error(`Falha ao iniciar o binário "${binary}" (${resolvedProvider}): ${err.message}`));
      });

      child.on('close', (code) => {
        if (signal) signal.removeEventListener('abort', onAbort);
        if (signal?.aborted) return;

        if (code !== 0 && !stdout.trim()) {
          return reject(
            new Error(`[${resolvedProvider}] Processo encerrou com código ${code}: ${stderr.trim()}`)
          );
        }

        const parsed = this.parseCliJsonEnvelope(stdout, resolvedProvider);
        resolve({
          provider: resolvedProvider,
          output: parsed.output,
          tokens: parsed.tokens,
          conversationId: parsed.conversationId
        });
      });
    });
  }

  /**
   * Normaliza o envelope JSON tanto do Claude CLI quanto do Antigravity CLI (`agy`)
   */
  parseCliJsonEnvelope(rawStdout, provider) {
    const trimmed = (rawStdout || '').trim();
    if (!trimmed) {
      return { output: '', tokens: 0, conversationId: null };
    }

    try {
      const json = JSON.parse(trimmed);

      if (provider === 'antigravity') {
        const output =
          json.structured_output !== undefined
            ? json.structured_output
            : (json.response ?? json.result ?? trimmed);

        const tokens =
          json.usage?.total_tokens ||
          (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0) ||
          400;

        return {
          output,
          tokens,
          conversationId: json.conversation_id || null
        };
      }

      const output =
        json.structured_output !== undefined
          ? json.structured_output
          : (json.result ?? json.response ?? trimmed);

      const tokens =
        (json.usage?.input_tokens || 0) + (json.usage?.output_tokens || 0) ||
        json.total_tokens ||
        450;

      return {
        output,
        tokens,
        conversationId: json.session_id || null
      };
    } catch (_) {
      // Caso o CLI devolva NDJSON ou texto plano, extrai a última linha JSON válida ou retorna o texto
      const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
      for (let i = lines.length - 1; i >= 0; i--) {
        try {
          const evt = JSON.parse(lines[i]);
          if (evt.structured_output !== undefined || evt.response || evt.result) {
            return {
              output: evt.structured_output !== undefined ? evt.structured_output : (evt.response || evt.result),
              tokens: evt.usage?.total_tokens || 350,
              conversationId: evt.conversation_id || evt.session_id || null
            };
          }
        } catch (_) {}
      }
      return { output: trimmed, tokens: 300, conversationId: null };
    }
  }

  stripMarkdownCodeences(text) {
    if (typeof text !== 'string') return String(text);
    const match = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
