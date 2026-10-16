use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedEffort {
    pub claude: String,
    pub antigravity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SquadTemplate {
    pub slug: String,
    pub category: String,
    pub title: String,
    pub description: String,
    pub command: String,
    pub recommended_effort: RecommendedEffort,
    pub script: String,
}

pub fn get_builtin_squad_templates() -> Vec<SquadTemplate> {
    vec![
        // 1. Mutation Testing Hunter
        SquadTemplate {
            slug: "qa-mutation-hunter".to_string(),
            category: "Qualidade & Testes".to_string(),
            title: "🧬 Mutation Testing Hunter".to_string(),
            description: "Injeta mutações semânticas em worktrees isoladas, descobre falhas que a suite atual deixa passar e escreve testes que matam os mutantes sobreviventes.".to_string(),
            command: "/qa-mutation-hunter".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "medium".to_string(),
            },
            script: r#"const meta = {
  name: "qa-mutation-hunter",
  description: "Engenharia de Teste de Mutação Híbrida (Antigravity Mutator + Claude Test Killer)",
  phases: [
    { title: "Mapeamento de Alvos", detail: "Identifica lógica crítica com baixa cobertura semântica" },
    { title: "Geração & Execução de Mutantes", detail: "Cria mutações cirúrgicas em Git Worktrees e corre npm test" },
    { title: "Extermínio de Sobreviventes", detail: "Escreve novos testes unitários para matar mutantes sobreviventes" }
  ]
};

const mutatorBot = harness({
  role: "Semantic Mutation Engineer",
  provider: "antigravity",
  effort: "medium",
  skills: ["boundary-negation", "arithmetic-inversion", "dead-branch-injection"]
});

const testKillerBot = harness({
  role: "Senior QA Architect",
  provider: "claude",
  effort: "high",
  skills: ["assertion-hardening", "edge-case-synthesis"]
});

phase("Mapeamento de Alvos");
const targetScan = await mutatorBot(
  "Liste até 4 módulos críticos do projeto onde bugs de fronteira ou condições invertidas seriam fatais.",
  {
    label: "scan-mutation-targets",
    schema: {
      type: "object",
      properties: {
        files: {
          type: "array",
          items: {
            type: "object",
            properties: { file: { type: "string" }, targetFunction: { type: "string" }, mutationIdea: { type: "string" } },
            required: ["file", "targetFunction", "mutationIdea"]
          }
        }
      },
      required: ["files"]
    }
  }
);

phase("Geração & Execução de Mutantes");
const mutationResults = await pipeline(targetScan.files || [], async (item, idx) => {
  return await mutatorBot(
    `No arquivo "${item.file}" (função "${item.targetFunction}"), aplique mentalmente ou na worktree a mutação: "${item.mutationIdea}". Verifique se os testes atuais em tests/ detectariam essa mudança.`,
    {
      label: `mutate:${item.file}`,
      isolation: "worktree",
      schema: {
        type: "object",
        properties: {
          file: { type: "string" },
          mutantSurvived: { type: "boolean" },
          weaknessExplanation: { type: "string" }
        },
        required: ["file", "mutantSurvived", "weaknessExplanation"]
      }
    }
  );
});

const survivors = mutationResults.filter(r => r && r.mutantSurvived);

phase("Extermínio de Sobreviventes");
const newTests = await pipeline(survivors, async (survivor) => {
  return await testKillerBot(
    `O mutante em "${survivor.file}" SOBREVIVEU aos testes atuais porque: ${survivor.weaknessExplanation}. Escreva o código completo do teste que mata este mutante e falha imediatamente se a lógica for corrompida.`,
    { label: `kill-mutant:${survivor.file}` }
  );
});

const testGate = await verifyCmd("npm test");
return {
  totalMutantsTested: mutationResults.length,
  survivorsFound: survivors.length,
  testsGenerated: newTests,
  suiteStatusAfterKill: testGate.ok ? "PASSED (Mutants Killed)" : "NEEDS_REVIEW"
};"#.trim().to_string(),
        },

        // 2. QA E2E Playwright Auto-Healer
        SquadTemplate {
            slug: "qa-e2e-visual-healer".to_string(),
            category: "Qualidade & Testes".to_string(),
            title: "🎭 E2E Playwright + Auto-Healer".to_string(),
            description: "Mapeia fluxos críticos de UI, gera testes E2E resilientes, valida regressão visual e auto-corrige seletores quebrados.".to_string(),
            command: "/qa-e2e-visual-healer".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "low".to_string(),
            },
            script: r#"const meta = {
  name: "qa-e2e-visual-healer",
  description: "Geração e Auto-Cura de Testes End-to-End com Gate Determinístico",
  phases: [
    { title: "Extração de Jornadas (UI)", detail: "Mapeia interações, estados e seletores em src/" },
    { title: "Geração E2E Paralela", detail: "Cria specs E2E para cada fluxo crítico" },
    { title: "Execução & Auto-Healing Gate", detail: "Roda a suite e corrige falhas de timing/seletores" }
  ]
};

const journeyMapper = harness({
  role: "UX Flow Mapper",
  provider: "antigravity",
  effort: "low",
  skills: ["dom-accessibility-tree", "user-journey-extraction"]
});

const e2eEngineer = harness({
  role: "Playwright Automation Specialist",
  provider: "claude",
  effort: "high",
  skills: ["playwright-best-practices", "zero-flakiness-locators"]
});

phase("Extração de Jornadas (UI)");
const map = await journeyMapper(
  "Analise a interface em src/App.jsx e extraia as 3 jornadas de utilizador mais importantes (ex: armar HiperCode, trocar teto de esforço por motor, assumir PTY).",
  {
    label: "extract-ui-journeys",
    schema: {
      type: "object",
      properties: {
        journeys: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string" }, steps: { type: "string" }, assertions: { type: "string" } },
            required: ["name", "steps", "assertions"]
          }
        }
      },
      required: ["journeys"]
    }
  }
);

phase("Geração E2E Paralela");
const specs = await pipeline(map.journeys || [], async (j) => {
  return await e2eEngineer(
    `Escreva um teste End-to-End completo e sem flakiness para a jornada "${j.name}". Passos: ${j.steps}. Asserções obrigatórias: ${j.assertions}. Use seletores semânticos (getByRole, getByText).`,
    { label: `e2e-spec:${j.name}` }
  );
});

phase("Execução & Auto-Healing Gate");
const runCheck = await verifyCmd("npm test");
if (!runCheck.ok) {
  const healed = await e2eEngineer(
    `A suite falhou com o erro:\n${runCheck.stderr || runCheck.stdout}\nDiagnostique a causa raiz e forneça a correção exata.`,
    { label: "auto-heal-e2e" }
  );
  return { status: "AUTO_HEALED", specs, healingPatch: healed };
}

return { status: "GREEN_SUITE", specs };"#.trim().to_string(),
        },

        // 3. QA Chaos Fuzzer
        SquadTemplate {
            slug: "qa-chaos-fuzzer".to_string(),
            category: "Qualidade & Testes".to_string(),
            title: "🌪️ Chaos & Property-Based Fuzzer".to_string(),
            description: "Ataca funções e canais IPC com invariantes matemáticos, inputs malformados, race conditions e cancelamentos abruptos.".to_string(),
            command: "/qa-chaos-fuzzer".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "medium".to_string(),
                antigravity: "high".to_string(),
            },
            script: r#"const meta = {
  name: "qa-chaos-fuzzer",
  description: "Property-Based Testing (fast-check) e Chaos Injection",
  phases: [
    { title: "Descoberta de Invariantes", detail: "Identifica contratos que nunca podem quebrar sob qualquer input" },
    { title: "Bombardeio de Propriedades", detail: "Gera geradores de fuzzing e concorrência extrema" }
  ]
};

phase("Descoberta de Invariantes");
const inv = await agent(
  "Identifique os invariantes críticos do orquestrador (ex: nunca passar de 16 agentes concorrentes, nunca exceder o teto de esforço do motor, nunca executar import() na sandbox).",
  {
    label: "discover-invariants",
    provider: "antigravity",
    schema: {
      type: "object",
      properties: { invariants: { type: "array", items: { type: "string" } } },
      required: ["invariants"]
    }
  }
);

phase("Bombardeio de Propriedades");
const fuzzSuite = await pipeline(inv.invariants || [], async (rule, i) => {
  return await agent(
    `Crie um teste de propriedade (Property-Based Test / Chaos Test) que gera 500 entradas aleatórias/adversariais para tentar violar a regra: "${rule}".`,
    { label: `chaos-fuzz-${i + 1}`, provider: "claude" }
  );
});

return fuzzSuite;"#.trim().to_string(),
        },

        // 4. Cinema Frontend
        SquadTemplate {
            slug: "squad-frontend-cinema".to_string(),
            category: "Frontend & UX".to_string(),
            title: "🎬 Cinema Frontend Squad".to_string(),
            description: "Extrai DNA visual de referência, constrói seções em paralelo com animações fluidas, copy de alta conversão e valida acessibilidade WCAG.".to_string(),
            command: "/squad-frontend-cinema".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "medium".to_string(),
            },
            script: r#"const meta = {
  name: "squad-frontend-cinema",
  description: "Squad de Design System & Alta Fidelidade: DNA Visual + Copy + Componentes em Paralelo + Gate WCAG",
  phases: [
    { title: "Extração de DNA Visual", detail: "Define paleta, tipografia, grid, micro-interações e tokens Tailwind" },
    { title: "Produção Paralela de Panes", detail: "Constrói seções e animações simultaneamente" },
    { title: "Gate de Qualidade Visual & WCAG", detail: "Audita responsividade, contraste e performance de renderização" }
  ]
};

const artDirector = harness({
  role: "Design Director & Motion Architect",
  provider: "antigravity",
  effort: "medium",
  skills: ["tailwind-design-tokens", "framer-motion-choreography", "glassmorphism-dark-ui"]
});

const uiCrafter = harness({
  role: "Principal React UI Engineer",
  provider: "claude",
  effort: "high",
  skills: ["react-18-concurrent", "zero-cls-layout", "accessible-primitives"]
});

phase("Extração de DNA Visual");
const dna = await artDirector(
  `Extraia o DNA visual completo e divida a interface pedida em 3 seções/componentes independentes de alto impacto para: ${args.prompt || "Cockpit Multiagente Dark Mode"}`,
  {
    label: "extract-design-dna",
    schema: {
      type: "object",
      properties: {
        designTokens: { type: "string" },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: { id: { type: "string" }, title: { type: "string" }, spec: { type: "string" } },
            required: ["id", "title", "spec"]
          }
        }
      },
      required: ["designTokens", "sections"]
    }
  }
);

phase("Produção Paralela de Panes");
const builtSections = await pipeline(dna.sections || [], async (sec) => {
  return await uiCrafter(
    `Construa o componente React + Tailwind completo para a seção "${sec.title}". Especificação: ${sec.spec}. Respeite os tokens: ${dna.designTokens}`,
    { label: `pane-build:${sec.id}` }
  );
});

phase("Gate de Qualidade Visual & WCAG");
return await consensus(
  `Unifique as seções construídas num layout coeso, corrigindo qualquer falha de contraste WCAG AA ou quebra em ecrãs menores:\n${JSON.stringify(builtSections)}`,
  { label: "cinema-final-gate" }
);"#.trim().to_string(),
        },

        // 5. Backend Fortress
        SquadTemplate {
            slug: "squad-backend-fortress".to_string(),
            category: "Backend & Infra".to_string(),
            title: "⚙️ Backend Fortress & Race-Condition Killer".to_string(),
            description: "Projeta APIs/IPC de baixa latência, compete duas implementações em worktrees isoladas via speculate() e escolhe a mais rápida nos testes.".to_string(),
            command: "/squad-backend-fortress".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "medium".to_string(),
            },
            script: r#"const meta = {
  name: "squad-backend-fortress",
  description: "Arquitetura Backend com Execução Especulativa Competitiva (Claude vs Antigravity)",
  phases: [
    { title: "Contrato & Modelagem", detail: "Define schemas estritos, idempotência e backpressure" },
    { title: "Corrida Especulativa (Worktrees)", detail: "Claude e Antigravity implementam em paralelo; a que passar no benchmark vence" }
  ]
};

phase("Contrato & Modelagem");
const spec = await agent(
  "Defina o contrato técnico, tratamento de erros e garantias de concorrência para os canais IPC e processos em electron/.",
  { label: "backend-contract", provider: "claude" }
);

phase("Corrida Especulativa (Worktrees)");
const race = await speculate([
  {
    label: "claude-stream-architecture",
    provider: "claude",
    prompt: `Implemente ou otimize a camada de backend seguindo o contrato: ${spec}. Foque em segurança de memória e clean code.`
  },
  {
    label: "antigravity-zero-copy-architecture",
    provider: "antigravity",
    prompt: `Implemente ou otimize a camada de backend seguindo o contrato: ${spec}. Foque em throughput máximo e menor latência de I/O.`
  }
], { testCommand: "npm test" });

return race;"#.trim().to_string(),
        },

        // 6. 3D & Shader Studio
        SquadTemplate {
            slug: "squad-3d-shader-studio".to_string(),
            category: "3D, Shaders & WebGL".to_string(),
            title: "🧊 3D WebGL & GLSL Shader Studio".to_string(),
            description: "Cria cenas Three.js / React Three Fiber com Vertex/Fragment Shaders GLSL customizados, física e Gate de 60 FPS (zero memory leaks de GPU).".to_string(),
            command: "/squad-3d-shader-studio".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "high".to_string(),
            },
            script: r#"const meta = {
  name: "squad-3d-shader-studio",
  description: "Pipeline 3D Especializado: Matemática GLSL + Geometria Instanciada + Auditoria de GPU Memory",
  phases: [
    { title: "Shader Math & GLSL", detail: "Escreve Vertex e Fragment Shaders customizados (SDF, ruído simplex, iluminação)" },
    { title: "Scene Graph & Instancing", detail: "Monta o grafo Three.js / R3F com InstancedMesh e pós-processamento" },
    { title: "Gate 60FPS & GPU Dispose", detail: "Audita draw calls, uniforms e libertação de buffers de VRAM" }
  ]
};

const shaderMathematician = harness({
  role: "GLSL & Computational Geometry Specialist",
  provider: "claude",
  effort: "high",
  skills: ["glsl-fragment-shaders", "signed-distance-fields", "quaternion-math"]
});

const sceneArchitect = harness({
  role: "Three.js & React Three Fiber Lead",
  provider: "antigravity",
  effort: "high",
  skills: ["instanced-mesh-optimization", "pbr-lighting", "postprocessing-bloom"]
});

phase("Shader Math & GLSL");
const [shaders, sceneLayout] = await parallel([
  () => shaderMathematician(
    `Escreva os Vertex e Fragment Shaders GLSL (com uniforms de tempo, interação de rato e paleta neon/violeta) para: ${args.prompt || "Visualizador 3D de Rede Neural de Subagentes em Tempo Real"}.`,
    { label: "glsl-shader-author" }
  ),
  () => sceneArchitect(
    `Estruture a cena 3D (câmara, controlos Orbit, InstancedMesh para 1.000 nós de agentes e feixes de partículas entre nós ativos).`,
    { label: "r3f-scene-builder" }
  )
]);

phase("Gate 60FPS & GPU Dispose");
return await shaderMathematician(
  `Integre os Shaders GLSL na cena 3D e passe pelo Gate de 60 FPS: garanta que todas as geometrias, materiais e renderTargets chamam .dispose() no unmount e que não há alocação de objetos (new THREE.Vector3) dentro do loop useFrame/requestAnimationFrame.\n\nSHADERS:\n${shaders}\n\nSCENE:\n${sceneLayout}`,
  { label: "gpu-60fps-gate" }
);"#.trim().to_string(),
        },

        // 7. CyberSec Purple Team
        SquadTemplate {
            slug: "squad-cybersec-purple-team".to_string(),
            category: "Cyber Segurança".to_string(),
            title: "🛡️ CyberSec Purple Team (Exploit & Patch)".to_string(),
            description: "Antigravity mapeia superfícies de ataque, Claude Red Team tenta provar o exploit e o Blue Team aplica o patch validado.".to_string(),
            command: "/squad-cybersec-purple-team".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "high".to_string(),
            },
            script: r#"const meta = {
  name: "squad-cybersec-purple-team",
  description: "Auditoria Ofensiva e Defensiva Cruzada (OWASP / Electron Security / Command Injection)",
  phases: [
    { title: "Recon & Threat Modeling (SAST)", detail: "Mapeia vetores em IPC, child_process, vm sandbox e dependências" },
    { title: "Red Team: Prova de Exploit", detail: "Tenta construir um payload real para eliminar falsos positivos" },
    { title: "Blue Team: Blindagem & Remediação", detail: "Gera o patch defensivo e verifica se o payload foi neutralizado" }
  ]
};

const reconScanner = harness({
  role: "Offensive Security Researcher (SAST)",
  provider: "antigravity",
  effort: "medium",
  skills: ["electron-context-isolation", "vm-escape-vectors", "command-injection-audit"]
});

const redTeamExploiter = harness({
  role: "Red Team Exploit Developer",
  provider: "claude",
  effort: "high",
  skills: ["poc-verification", "zero-false-positives"]
});

const blueTeamDefender = harness({
  role: "Principal Security Architect (Blue Team)",
  provider: "claude",
  effort: "high",
  skills: ["defense-in-depth", "strict-input-sanitization"]
});

phase("Recon & Threat Modeling (SAST)");
const recon = await reconScanner(
  "Audite o repositório em busca de vetores de RCE, Command Injection, Prototype Pollution ou Sandbox Escape.",
  {
    label: "cyber-recon-scan",
    schema: {
      type: "object",
      properties: {
        vulns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              file: { type: "string" },
              cwe: { type: "string" },
              vector: { type: "string" },
              severity: { type: "string" }
            },
            required: ["file", "cwe", "vector", "severity"]
          }
        }
      },
      required: ["vulns"]
    }
  }
);

phase("Red Team: Prova de Exploit");
const verifiedExploits = await pipeline(recon.vulns || [], async (v) => {
  const check = await redTeamExploiter(
    `Tente construir uma Prova de Conceito (PoC) para o vetor "${v.vector}" em "${v.file}" (${v.cwe}). Se houver mitigação existente que impeça o ataque, marque exploitable como false.`,
    {
      label: `redteam-poc:${v.file}`,
      schema: {
        type: "object",
        properties: {
          exploitable: { type: "boolean" },
          pocPayload: { type: "string" },
          impact: { type: "string" }
        },
        required: ["exploitable", "pocPayload", "impact"]
      }
    }
  );
  return check?.exploitable ? { ...v, ...check } : null;
});

const realThreats = verifiedExploits.filter(Boolean);

phase("Blue Team: Blindagem & Remediação");
const patches = await pipeline(realThreats, async (threat) => {
  return await blueTeamDefender(
    `Vulnerabilidade CONFIRMADA em "${threat.file}" (${threat.cwe}). Payload do Red Team: ${threat.pocPayload}. Escreva o patch defensivo exato e um teste de regressão de segurança que bloqueia este payload.`,
    { label: `blueteam-patch:${threat.file}` }
  );
});

return {
  scannedVectors: (recon.vulns || []).length,
  confirmedExploitable: realThreats.length,
  securityPatches: patches
};"#.trim().to_string(),
        },
        // 8. Pixel Forge 3D -> Pixel Art (Capybound Pipeline)
        SquadTemplate {
            slug: "squad-pixel-forge-3d".to_string(),
            category: "3D & Game Assets".to_string(),
            title: "🎨 Pixel Forge 3D -> Pixel Art".to_string(),
            description: "Modela itens 3D procedurais no Blender headless (bpy/bmesh) separados por índice de peça/objeto, renderiza mapas EXR multicamadas, aplica perfis de iluminação/paleta via pintor.py, gera prancha comparativa com 3 variantes numeradas e instala no jogo com verificação visual na bolsa via Playwright.".to_string(),
            command: "/squad-pixel-forge-3d".to_string(),
            recommended_effort: RecommendedEffort {
                claude: "high".to_string(),
                antigravity: "medium".to_string(),
            },
            script: r#"const meta = {
  name: "squad-pixel-forge-3d",
  description: "Pipeline Blender Headless (bpy/bmesh) -> EXR Multicamadas -> Pintor Palette -> 3 Variantes Paralelas -> Verificação Playwright na Bolsa",
  phases: [
    { title: "Modelagem 3D & Perfil de Paleta", detail: "Claude constrói script bpy e perfis/<item>.json com opções CLI" },
    { title: "Renderização Paralela das 3 Variantes", detail: "Maestro executa parallel() gerando 3 variantes EXR e Pixel Art em 512px" },
    { title: "Prancha Comparativa & Aprovação", detail: "Gera folha comparativa lado a lado (3D + Pixel Art 2x + 1x) para escolha humana" },
    { title: "Export 1024px & Validação Playwright", detail: "Render final, export 5x Nearest, receita no lote e print da bolsa do jogo" }
  ]
};

const bmeshArchitect = harness({
  role: "Modelador 3D Procedural Blender (bpy/bmesh) & Designer de Paletas Pixel Art",
  provider: "claude",
  effort: "high",
  skills: ["bmesh-procedural-modeling", "material-index-segmentation", "color-ramp-design"]
});

const variantRunner = harness({
  role: "Operador de Renderização EXR Multicamadas, PIL Sheet Composer & Playwright QA",
  provider: "antigravity",
  effort: "medium",
  skills: ["exr-multichannel-render", "pil-sheet-composition", "playwright-bag-qa"]
});

phase("Modelagem 3D & Perfil de Paleta");
const designSpec = await agent(
  `Construa o script 3D procedural em "tools/icones/${args.itemId || "espada_bambu"}.py" e o perfil em "tools/icones/perfis/${args.itemId || "espada_bambu"}.json". Estilo: ${args.styleBrief || "pixel art 16-bit com sombra fria, luz quente e contorno tingido"}. Separe cada cor em material próprio M[i], use objetos separados para tiras/adornos e exponha opções CLI via op(). Converta escalares numpy com float().`,
  {
    label: "design-3d-and-profile",
    schema: {
      type: "object",
      properties: {
        scriptPath: { type: "string" },
        profilePath: { type: "string" },
        variantsArgs: { type: "array", minItems: 3, maxItems: 3, items: { type: "string" } }
      },
      required: ["scriptPath", "profilePath", "variantsArgs"]
    }
  }
);

phase("Renderização Paralela das 3 Variantes");
const variants = await parallel(
  (designSpec.variantsArgs || ["--opcao=1", "--opcao=2", "--opcao=3"]).map((cliArgs, idx) => async () => {
    const vNum = idx + 1;
    const exrOut = `/tmp/${args.itemId || "item"}_v${vNum}.exr`;
    const pngOut = `/tmp/${args.itemId || "item"}_v${vNum}_px.png`;
    await verifyCmd(`blend/bin/python -I ${designSpec.scriptPath} -- ${exrOut} 512 ${cliArgs}`);
    if (!args.threeDOnlyMode) {
      await verifyCmd(`blend/bin/python -I tools/icones/pintor.py ${exrOut} ${pngOut} ${args.iconHeightPx || 112} ${designSpec.profilePath}`);
    }
    return { variant: vNum, cliArgs, exrOut, pngOut };
  })
);

phase("Prancha Comparativa & Aprovação");
const comparisonSheet = await agent(
  `Monte a prancha comparativa "/tmp/${args.itemId || "item"}_comparacao_1_2_3.png" com PIL colocando lado a lado as 3 variantes: ${JSON.stringify(variants)} (3D pequeno + pixel art 2x + 1x). Informe o que mudou, como testar e o que não foi testado.`,
  { label: "compose-comparison-sheet" }
);

if (!args.approvedVariantIndex) {
  return {
    status: "AWAITING_USER_EYE_APPROVAL",
    message: "Prancha com 3 variantes gerada! Escolha 1, 2 ou 3.",
    comparisonSheet,
    variants
  };
}

phase("Export 1024px & Validação Playwright");
const chosenArgs = designSpec.variantsArgs[args.approvedVariantIndex - 1];
const finalExr = `/tmp/${args.itemId || "item"}_final_1024.exr`;
const finalPng = `/tmp/${args.itemId || "item"}_final.png`;
await verifyCmd(`blend/bin/python -I ${designSpec.scriptPath} -- ${finalExr} 1024 ${chosenArgs}`);
await verifyCmd(`blend/bin/python -I tools/icones/pintor.py ${finalExr} ${finalPng} ${args.iconHeightPx || 112} ${designSpec.profilePath}`);

const finalInstall = await agent(
  `Variante ${args.approvedVariantIndex} aprovada (${chosenArgs}). Grave em tools/icones/receitas/${args.lote || "lote"}.json, instale com python3 -I tools/add_icone.py item ${args.itemId || "item"} ${finalPng} --nativo, rode build e valide a bolsa com Playwright na porta 8765.`,
  { label: "install-and-bag-qa" }
);

return {
  status: "INSTALLED_AND_VERIFIED_IN_BAG",
  chosenVariant: args.approvedVariantIndex,
  finalInstall
};"#.trim().to_string(),
        },
    ]
}

pub fn seed_default_templates(project_root: &Path) -> Result<(), std::io::Error> {
    let workflows_dir = project_root.join(".claude").join("workflows");
    if !workflows_dir.exists() {
        fs::create_dir_all(&workflows_dir)?;
    }

    for tpl in get_builtin_squad_templates() {
        let dest = workflows_dir.join(format!("{}.js", tpl.slug));
        if !dest.exists() {
            fs::write(dest, tpl.script)?;
        }
    }

    Ok(())
}
