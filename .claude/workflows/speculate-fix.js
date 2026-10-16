// .claude/workflows/speculate-fix.js
// Executa duas estratégias de correção concorrentes em worktrees isoladas e seleciona a vencedora que passar nos testes determinísticos.
phase("Execução Especulativa de Correção");

const issueDescription = args || "Investigar falhas de testes e corrigir regressões";

const result = await speculate({
  strategyA: async (ctx) => {
    return await agent(`[Estratégia A: Correção Cirúrgica Direta] Analise e corrija o seguinte problema com o menor delta de código possível: ${issueDescription}`, {
      provider: "claude",
      effort: "high",
      acceptEdits: true
    });
  },
  strategyB: async (ctx) => {
    return await agent(`[Estratégia B: Abordagem Defensiva Robusta] Refatore a implementação para prevenir falhas de borda relacionadas a: ${issueDescription}`, {
      provider: "antigravity",
      effort: "high",
      acceptEdits: true
    });
  },
  testCmd: "npm test"
});

phase("Resultado da Especulação");
memory.set("winningStrategy", result.winner);
memory.set("speculationDetails", result);

return {
  status: "completed",
  winner: result.winner,
  details: result
};
