import { spawn } from 'node:child_process';
import { EventEmitter } from 'node:events';
import os from 'node:os';
import { UltracodeGates } from './gates.js';

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
    this.sessions = new Map(); // termId -> { type, proc, cwd, meta }
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
  createSession(termId, { cwd = process.cwd(), shell, env = {}, command = null, args = [], meta = {} } = {}) {
    if (this.sessions.has(termId)) {
      this.kill(termId);
    }

    const defaultShell = command || shell || (os.platform() === 'win32' ? 'powershell.exe' : process.env.SHELL || 'bash');
    const mergedEnv = { ...process.env, ...env, TERM: 'xterm-256color' };

    if (pty) {
      const ptyProcess = pty.spawn(defaultShell, args, {
        name: 'xterm-256color',
        cols: 120,
        rows: 36,
        cwd,
        env: mergedEnv
      });

      ptyProcess.onData((data) => {
        this.emit('term:data', { termId, data, meta });
        this.sendIpc('ultracode:term-data', { termId, data, meta });
      });

      ptyProcess.onExit(({ exitCode, signal }) => {
        this.emit('term:exit', { termId, exitCode, signal, meta });
        this.sessions.delete(termId);
      });

      this.sessions.set(termId, { type: 'pty', proc: ptyProcess, cwd, meta });
      return { termId, mode: 'node-pty', cwd, meta };
    }

    // Fallback com child_process caso node-pty não esteja ativo
    const proc = spawn(defaultShell, args, {
      cwd,
      env: mergedEnv,
      shell: !command
    });

    proc.stdout?.on('data', (chunk) => {
      const data = chunk.toString();
      this.emit('term:data', { termId, data, meta });
      this.sendIpc('ultracode:term-data', { termId, data, meta });
    });
    proc.stderr?.on('data', (chunk) => {
      const data = chunk.toString();
      this.emit('term:data', { termId, data, meta });
      this.sendIpc('ultracode:term-data', { termId, data, meta });
    });
    proc.on('close', (exitCode) => {
      this.emit('term:exit', { termId, exitCode, meta });
      this.sessions.delete(termId);
    });

    this.sessions.set(termId, { type: 'spawn', proc, cwd, meta });
    return { termId, mode: 'child_process', cwd, meta };
  }

  /**
   * Hot-Takeover: Abre um terminal PTY interativo conectado à sessão e ao diretório
   * (ou Git Worktree) de um subagente Claude ou Antigravity específico.
   */
  spawnInteractiveTakeover(termId, {
    provider = 'claude',
    conversationId = null,
    cwd = process.cwd(),
    claudeBin = process.env.CLAUDE_BIN || 'claude',
    antigravityBin = process.env.AGY_BIN || 'agy'
  } = {}) {
    const isAntigravity = provider === 'antigravity';
    const binary = isAntigravity ? antigravityBin : claudeBin;

    let args = [];
    if (conversationId) {
      args = isAntigravity
        ? ['--conversation-id', conversationId]
        : ['--resume', conversationId];
    }

    return this.createSession(termId, {
      cwd,
      command: binary,
      args,
      meta: { provider, conversationId, takeover: true }
    });
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
    defaultProvider = 'hybrid', // 'claude' | 'antigravity' | 'hybrid'
    claudeBin = process.env.CLAUDE_BIN || 'claude',
    antigravityBin = process.env.AGY_BIN || 'agy',
    projectRoot = process.cwd(),
    providerMaxEffort = null
  } = {}) {
    super();
    this.defaultProvider = defaultProvider;
    this.claudeBin = claudeBin;
    this.antigravityBin = antigravityBin;
    this.projectRoot = projectRoot;

    const defaults = UltracodeGates.getRuntimeLimits().defaultProviderCaps || {
      claude: 'xhigh',
      antigravity: 'xhigh'
    };
    this.providerMaxEffort = {
      claude: providerMaxEffort?.claude || defaults.claude,
      antigravity: providerMaxEffort?.antigravity || defaults.antigravity
    };
  }

  setProviderMaxEffort(provider, maxEffort) {
    if (provider === 'claude' || provider === 'antigravity') {
      this.providerMaxEffort[provider] = maxEffort;
    }
    return { ...this.providerMaxEffort };
  }

  getEffectiveEffort(provider, requestedEffort = 'high') {
    const cap = this.providerMaxEffort[provider] || 'high';
    return UltracodeGates.clampEffort(requestedEffort, cap);
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
  buildClaudeArgs({ prompt, model, effort, acceptEdits, schema, stream = false, resumeId = null }) {
    const effectiveEffort = this.getEffectiveEffort('claude', effort);
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
    if (resumeId) {
      args.push('--resume', resumeId);
    }
    args.push('--effort', effectiveEffort);

    if (schema) {
      args.push('--json-schema', JSON.stringify(schema));
    }

    // Suporta tanto desestruturação { args, effectiveEffort } quanto array direto
    args.args = args;
    args.effectiveEffort = effectiveEffort;
    return args;
  }

  /**
   * Monta os argumentos de linha de comando específicos para o Google Antigravity CLI (`agy`)
   */
  buildAntigravityArgs({ prompt, model, effort, acceptEdits, schema, boost = false, stream = false, resumeId = null }) {
    const effectiveEffort = this.getEffectiveEffort('antigravity', effort);
    const effectivePrompt =
      (boost || effectiveEffort === 'xhigh' || effort === 'ultracode') && !prompt.startsWith('/boost')
        ? `/boost ${prompt}`
        : prompt;

    const args = ['-p', effectivePrompt, '--output-format', stream ? 'stream-json' : 'json'];

    if (acceptEdits) {
      args.push('--mode', 'accept-edits');
    }
    if (model) {
      args.push('--model', model);
    }
    if (resumeId) {
      args.push('--conversation-id', resumeId);
    }
    args.push('--effort', effectiveEffort);

    if (schema) {
      args.push('--json-schema', JSON.stringify(schema));
    }

    args.args = args;
    args.effectiveEffort = effectiveEffort;
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
      acceptEdits: false,
      stream: false
    });

    return this.stripMarkdownCodeFences(typeof res.output === 'string' ? res.output : JSON.stringify(res.output));
  }

  /**
   * 2ª Fase do Ultracode: Executa um subagente isolado via processo CLI com telemetria NDJSON ao vivo
   */
  async runAgent({
    agentId = null,
    prompt,
    cwd = this.projectRoot,
    provider,
    model,
    effort = 'high',
    acceptEdits = true,
    schema = null,
    signal = null,
    label = 'subagent',
    phase = '',
    stream = true,
    resumeId = null
  }) {
    const resolvedProvider = this.resolveProvider({ provider, model, phase });
    const binary = resolvedProvider === 'antigravity' ? this.antigravityBin : this.claudeBin;

    const claudeOrAgyArgs =
      resolvedProvider === 'antigravity'
        ? this.buildAntigravityArgs({ prompt, model, effort, acceptEdits, schema, stream, resumeId })
        : this.buildClaudeArgs({ prompt, model, effort, acceptEdits, schema, stream, resumeId });

    const args = claudeOrAgyArgs.args || claudeOrAgyArgs;
    const effectiveEffort = claudeOrAgyArgs.effectiveEffort || effort;

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
      let lineBuffer = '';
      let liveConversationId = resumeId;
      let liveTokens = 0;

      const onAbort = () => {
        child.kill('SIGTERM');
        setTimeout(() => {
          if (!child.killed) child.kill('SIGKILL');
        }, 1200);
        reject(new Error('WORKFLOW_PAUSED'));
      };

      if (signal) {
        signal.addEventListener('abort', onAbort, { once: true });
      }

      child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        stdout += text;
        lineBuffer += text;

        this.emit('agent:stream', { label, provider: resolvedProvider, chunk: text });

        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() || '';

        for (const line of lines) {
          const telemetry = this.parseLiveStreamEvent(line, resolvedProvider);
          if (telemetry.conversationId) liveConversationId = telemetry.conversationId;
          if (telemetry.tokensDelta) liveTokens += telemetry.tokensDelta;

          this.emit('agent:telemetry', {
            agentId,
            label,
            provider: resolvedProvider,
            effectiveEffort,
            cwd,
            ...telemetry
          });
        }
      });

      child.stderr?.on('data', (chunk) => {
        const errText = chunk.toString();
        stderr += errText;
        this.emit('agent:telemetry', {
          agentId,
          label,
          provider: resolvedProvider,
          effectiveEffort,
          type: 'stderr',
          text: errText
        });
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
          effectiveEffort,
          output: parsed.output,
          tokens: parsed.tokens || liveTokens || 400,
          conversationId: parsed.conversationId || liveConversationId,
          cwd
        });
      });
    });
  }

  /**
   * Extrai eventos em tempo real (chamadas de ferramenta, pensamentos, textos parciais) do stream-json
   */
  parseLiveStreamEvent(line, provider) {
    const trimmed = line.trim();
    if (!trimmed) return { type: 'empty', text: '' };

    try {
      const evt = JSON.parse(trimmed);
      const conversationId = evt.session_id || evt.conversation_id || null;
      const tokensDelta = (evt.usage?.input_tokens || 0) + (evt.usage?.output_tokens || 0);

      // Deteta invocação de ferramentas (Bash, Edit, Read, etc.)
      if (evt.type === 'tool_use' || evt.tool_name || evt.message?.content?.[0]?.type === 'tool_use') {
        const toolBlock = evt.message?.content?.find((c) => c.type === 'tool_use') || evt;
        return {
          type: 'tool_use',
          toolName: toolBlock.name || evt.tool_name || 'tool',
          text: `[Tool: ${toolBlock.name || evt.tool_name}] ${JSON.stringify(toolBlock.input || {}).slice(0, 120)}`,
          conversationId,
          tokensDelta
        };
      }

      // Deteta blocos de raciocínio (Extended Thinking / Boost Thinking)
      if (evt.type === 'thinking' || evt.message?.content?.[0]?.type === 'thinking') {
        const thinkBlock = evt.message?.content?.find((c) => c.type === 'thinking') || evt;
        return {
          type: 'thinking',
          text: thinkBlock.thinking || thinkBlock.text || 'A raciocinar...',
          conversationId,
          tokensDelta
        };
      }

      // Texto de resposta ou resultado final
      const textContent =
        evt.delta?.text ||
        evt.message?.content?.find((c) => c.type === 'text')?.text ||
        evt.response ||
        evt.result ||
        trimmed;

      return {
        type: evt.type || 'text',
        text: typeof textContent === 'string' ? textContent : JSON.stringify(textContent),
        conversationId,
        tokensDelta
      };
    } catch (_) {
      return { type: 'raw', text: trimmed };
    }
  }

  /**
   * Normaliza o envelope JSON tanto do Claude CLI quanto do Antigravity CLI (`agy`)
   */
  parseCliJsonEnvelope(rawStdout, provider) {
    const trimmed = (rawStdout || '').trim();
    if (!trimmed) {
      return { output: '', tokens: 0, conversationId: null };
    }

    const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
    let totalTokens = 0;
    let lastConversationId = null;

    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        const evt = JSON.parse(lines[i]);
        if (evt.session_id || evt.conversation_id) {
          lastConversationId = evt.session_id || evt.conversation_id;
        }
        const usageTokens =
          evt.usage?.total_tokens ||
          (evt.usage?.input_tokens || 0) + (evt.usage?.output_tokens || 0) ||
          evt.total_tokens ||
          0;
        if (usageTokens > totalTokens) totalTokens = usageTokens;

        if (evt.structured_output !== undefined || evt.result !== undefined || evt.response !== undefined) {
          return {
            output: evt.structured_output ?? evt.result ?? evt.response,
            tokens: totalTokens || 420,
            conversationId: lastConversationId
          };
        }
      } catch (_) {}
    }

    return { output: trimmed, tokens: totalTokens || 350, conversationId: lastConversationId };
  }

  /**
   * Executa um comando determinístico (ex: `npm test`, `eslint`, `tsc --noEmit`) dentro de uma worktree
   */
  async runDeterministicCommand(commandStr, { cwd = this.projectRoot, timeoutMs = 60000, signal = null } = {}) {
    return await new Promise((resolve) => {
      const child = spawn(commandStr, {
        cwd,
        shell: true,
        env: { ...process.env, CI: 'true', FORCE_COLOR: '0' }
      });

      let stdout = '';
      let stderr = '';
      const timer = setTimeout(() => {
        child.kill('SIGTERM');
      }, timeoutMs);

      const onAbort = () => {
        clearTimeout(timer);
        child.kill('SIGTERM');
      };

      if (signal) signal.addEventListener('abort', onAbort, { once: true });

      child.stdout?.on('data', (d) => {
        stdout += d.toString();
      });
      child.stderr?.on('data', (d) => {
        stderr += d.toString();
      });

      child.on('close', (exitCode) => {
        clearTimeout(timer);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve({
          ok: exitCode === 0,
          exitCode: exitCode ?? 1,
          stdout: stdout.trim(),
          stderr: stderr.trim()
        });
      });
    });
  }

  stripMarkdownCodeFences(text) {
    if (typeof text !== 'string') return String(text);
    const match = text.match(/```(?:javascript|js)?\s*([\s\S]*?)```/);
    return match ? match[1].trim() : text.trim();
  }
}
