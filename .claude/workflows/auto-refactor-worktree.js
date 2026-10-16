// .claude/workflows/auto-refactor-worktree.js
// Refatoração automatizada em worktree isolado com verificação determinística de testes e linting
phase("1. Análise de Oportunidades de Refatoração");

const refactorTarget = args || "Modularização de componentes e otimização de imports";

const plan = await agent(`Analise a estrutura do projeto e proponha refatorações seguras para: ${refactorTarget}. Retorne os arquivos afetados e passos.`, {
  provider: "antigravity",
  effort: "high",
  acceptEdits: false
});

phase("2. Aplicação das Refatorações em Worktree Isolado");
const refactorResult = await agent(`Aplique as refatorações propostas com preservação estrita de comportamento: ${JSON.stringify(plan)}`, {
  provider: "claude",
  effort: "high",
  isolation: "worktree",
  acceptEdits: true
});

phase("3. Quality Gate Determinístico");
const testVerification = await verifyCmd("npm test");

if (!testVerification.ok) {
  phase("4. Auto-Correção de Regressão");
  await agent(`O comando de teste falhou após a refatoração. Erro:\n${testVerification.stderr || testVerification.stdout}\nCorrija as regressões imediatamente.`, {
    provider: "claude",
    effort: "high",
    acceptEdits: true
  });
}

const finalCheck = await verifyCmd("npm test");
memory.set("refactorStatus", finalCheck.ok ? "SUCCESS" : "NEEDS_REVIEW");

return {
  ok: finalCheck.ok,
  output: refactorResult
};
