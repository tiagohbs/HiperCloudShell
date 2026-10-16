// .claude/workflows/cross-security-audit.js
// Auditoria de segurança adversarial cruzada entre Claude e Antigravity com consenso e plano de mitigação
phase("1. Auditoria de Segurança Cruzada Multi-Motor");

const targetScope = args || "Varredura completa de segurança OWASP, injeções, dependências e privilégios";

const consensusAudit = await consensus({
  prompt: `Execute uma auditoria de segurança aprofundada focada em: ${targetScope}. Liste vulnerabilidades com severidade (Baixa, Média, Alta, Crítica), arquivo:linha e prova de conceito ou risco.`,
  providerA: "claude",
  providerB: "antigravity",
  arbitratorProvider: "claude",
  effort: "xhigh",
  schema: {
    type: "object",
    properties: {
      vulnerabilities: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            severity: { type: "string" },
            file: { type: "string" },
            mitigation: { type: "string" }
          },
          required: ["title", "severity", "mitigation"]
        }
      },
      summary: { type: "string" }
    },
    required: ["vulnerabilities", "summary"]
  }
});

phase("2. Verificação de Integridade e Testes");
const check = await verifyCmd("npm test");

phase("3. Registro de Relatório no Blackboard");
memory.set("securityAuditReport", consensusAudit.arbitrated);
memory.set("verificationStatus", check.ok ? "PASSED" : "FAILED");

return {
  audit: consensusAudit.arbitrated,
  testsPass: check.ok
};
