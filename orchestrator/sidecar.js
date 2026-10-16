// orchestrator/sidecar.js
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { MaestroOrchestrator } from './maestro.js';
import { BlackboardManager } from './blackboard.js';
import { WorktreeManager } from './worktree-manager.js';
import { DualEngineAdapter } from './term.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const blackboard = new BlackboardManager(projectRoot);
const worktrees = new WorktreeManager(projectRoot);
const llmAdapter = new DualEngineAdapter({ projectRoot });

const maestro = new MaestroOrchestrator({
  repoRoot: projectRoot,
  blackboard,
  worktreeManager: worktrees,
  llmAdapter
});

// Envia eventos para o stdout em formato NDJSON para o Tauri ler
blackboard.on('workflow:update', (runSnapshot) => {
  console.log(JSON.stringify({ type: 'workflow-update', data: runSnapshot }));
});

blackboard.on('system:notification', (notification) => {
  console.log(JSON.stringify({ type: 'system-notification', data: notification }));
});

blackboard.on('improvement:update', (task) => {
  console.log(JSON.stringify({ type: 'improvement-update', data: task }));
});

llmAdapter.on('agent:stream', (streamEvent) => {
  console.log(JSON.stringify({ type: 'agent-stream', data: streamEvent }));
});

llmAdapter.on('agent:telemetry', (evt) => {
  for (const [runId, run] of blackboard.runs.entries()) {
    if (run.status === 'running' && evt.agentId) {
      blackboard.appendAgentTelemetry(runId, evt.agentId, evt);
    }
  }
  console.log(JSON.stringify({ type: 'agent-telemetry', data: evt }));
});

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--detect') {
    const prompt = args[1] || '';
    const effort = args[2] || 'high';
    blackboard.sessionEffort = effort;
    const result = maestro.detectUltracodeTrigger(prompt, { isHumanInput: true });
    console.log(JSON.stringify({ type: 'detect-result', data: result }));
    process.exit(0);
  }

  if (command === '--plan') {
    const prompt = args[1] || '';
    const effort = args[2] || 'xhigh';
    const provider = args[3] || 'hybrid';
    llmAdapter.defaultProvider = provider;
    const script = await maestro.planDynamicWorkflow(prompt, effort);
    console.log(JSON.stringify({ type: 'plan-result', data: { script } }));
    process.exit(0);
  }

  if (command === '--run') {
    const runId = args[1];
    const script = args[2];
    const argsJson = args[3] ? JSON.parse(args[3]) : {};
    const maxTokens = Number(args[4]) || 0;

    let run = blackboard.getRun(runId);
    if (!run) {
      run = blackboard.createRun({
        id: runId,
        prompt: argsJson.prompt || 'Workflow Run',
        script,
        meta: { name: runId, description: 'Workflow Run', phases: [] },
        maxTokensPerRun: maxTokens
      });
    } else {
      if (script) run.script = script;
      if (maxTokens) run.maxTokensPerRun = maxTokens;
    }

    try {
      const result = await maestro.executeWorkflowRun(runId, {
        args: argsJson,
        maxTokensPerRun: maxTokens
      });
      console.log(JSON.stringify({ type: 'run-result', data: { runId, result } }));
      process.exit(0);
    } catch (err) {
      console.error(JSON.stringify({ type: 'run-error', error: err.message }));
      process.exit(1);
    }
  }

  // Interativo via stdin
  process.stdin.on('data', async (chunk) => {
    try {
      const line = chunk.toString().trim();
      if (!line) return;
      const msg = JSON.parse(line);

      if (msg.cmd === 'submit-prompt') {
        const detection = maestro.detectUltracodeTrigger(msg.prompt, msg.options || {});
        if (!detection.shouldRunWorkflow) {
          const direct = await llmAdapter.runAgent({
            prompt: msg.prompt,
            cwd: projectRoot,
            provider: msg.options?.provider,
            effort: detection.effort
          });
          console.log(JSON.stringify({ id: msg.id, type: 'prompt-response', data: { mode: 'single_turn', result: direct } }));
        } else {
          const runState = await maestro.prepareWorkflowRun(msg.prompt, msg.options || {});
          console.log(JSON.stringify({ id: msg.id, type: 'prompt-response', data: { mode: 'workflow', run: runState } }));
        }
      } else if (msg.cmd === 'approve-run') {
        const { runId, editedScript, args: runArgs, maxTokensPerRun } = msg;
        const run = blackboard.getRun(runId);
        if (run) {
          if (editedScript) run.script = editedScript;
          if (maxTokensPerRun) run.maxTokensPerRun = Number(maxTokensPerRun) || 0;
        }
        maestro.executeWorkflowRun(runId, { args: runArgs, maxTokensPerRun });
        console.log(JSON.stringify({ id: msg.id, type: 'approve-response', data: { started: true, runId } }));
      } else if (msg.cmd === 'trigger-self-improvement') {
        const { notification, goal, engineOverride, targetFiles } = msg;
        const notif = notification || {
          code: `HCS-IMP-${Date.now().toString().slice(-4)}`,
          kind: 'improvement',
          title: 'Manual Improvement Trigger',
          message: goal || 'Melhoria disparada manualmente',
          sourceTrace: { targetFiles }
        };
        const task = await maestro.triggerContinuousSelfImprovement(notif);
        console.log(JSON.stringify({ id: msg.id, type: 'trigger-improvement-response', data: task }));
      }
    } catch (err) {
      console.log(JSON.stringify({ type: 'error', error: err.message }));
    }
  });
}

main().catch((err) => {
  console.error(JSON.stringify({ type: 'fatal-error', error: err.message }));
  process.exit(1);
});
