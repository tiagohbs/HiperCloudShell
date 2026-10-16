// .claude/workflows/pixel-forge-3d.ultracode.js
// Dynamic Workflow para o squad-pixel-forge-3d (Blender bpy -> EXR -> pintor.py -> Capybound Bag)

const bmeshArchitect = harness({
  id: 'pixel-forge-bmesh-architect',
  role: 'Modelador 3D Procedural Blender (bpy/bmesh) & Designer de Paletas Pixel Art',
  cli: 'claude',
  effort: 'high',
  allowedReadFiles: [
    'docs/arte/PROCESSO_ICONES_3D.md',
    'tools/icones/cena.py',
    'tools/icones/pintor.py'
  ]
});

const variantRunner = harness({
  id: 'pixel-forge-variant-runner',
  role: 'Operador de Renderizacao EXR Multicamadas, PIL Sheet Composer & Playwright QA',
  cli: 'agy',
  effort: 'medium'
});

export async function runPixelForgeWorkflow({
  itemId = 'espada_bambu',
  lote = 'lote3',
  iconHeightPx = 112,
  styleBrief = 'pixel art 16-bit com sombra fria, luz quente e contorno tingido',
  threeDOnlyMode = false, // Quando o usuario pede: "nao passa pra pixel art ainda"
  eightViewsMode = true, // Renderizacao 360 em 8 vistas com camera 24 graus
  cameraElevation = 24.0, // Pitch dimetrico RPG 2.5D
  approvedVariantIndex = null // 1, 2 ou 3 quando o usuario escolhe a variante vencedora
}) {
  const scriptPath = `tools/icones/${itemId}.py`;
  const profilePath = `tools/icones/perfis/${itemId}.json`;
  const blendMasterPath = `dist/game/models/${itemId}_8vistas.blend`;

  // ==========================================================================
  // FASE 1: CONSTRUCAO DO MODELO 3D PROCEDURAL (bpy) + PERFIL DO PINTOR
  // ==========================================================================
  const designSpec = await agent(
    `Construa o script 3D procedural em '${scriptPath}' e o perfil de pintura em '${profilePath}' para o item '${itemId}'.
     Estilo desejado: ${styleBrief}.
     Regras obrigatorias do PROCESSO_ICONES_3D.md:
     1. Use 'from cena import nova, mat, add, obj, render'.
     2. Indice do material = peca do perfil (separe em pecas tudo que tiver rampa de cor propria).
     3. Cada volta de corda, tira ou adorno deve ser um objeto separado para o pintor desenhar linhas de contato.
     4. Exponha as dimensoes chave como opcoes CLI via op('--param', padrao) e retorne 3 conjuntos de argumentos distintos (variantsArgs) para compararmos lado a lado.
     5. Converta qualquer escalar numpy com float() antes de passar para mathutils.Vector.`,
    {
      harness: bmeshArchitect,
      allowedWriteFiles: [scriptPath, profilePath],
      schema: {
        type: 'object',
        required: ['scriptPath', 'profilePath', 'variantsArgs'],
        properties: {
          scriptPath: { type: 'string' },
          profilePath: { type: 'string' },
          variantsArgs: {
            type: 'array',
            minItems: 3,
            maxItems: 3,
            items: { type: 'string' }
          }
        }
      }
    }
  );

  // Gate Deterministico: valida sintaxe Python e orcamento de bandas no JSON
  await verifyCmd(`python3 -I -m py_compile ${scriptPath}`);

  // ==========================================================================
  // FASE 2: GERACAO PARALELA DAS 3 VARIANTES NUMERADAS (Res 512 para teste rapido)
  // ==========================================================================
  const variantResults = await parallel(
    designSpec.variantsArgs.map((cliArgs, idx) => async () => {
      const vNum = idx + 1;
      const exrOut = `/tmp/${itemId}_v${vNum}.exr`;
      const pngOut = `/tmp/${itemId}_v${vNum}_px.png`;

      // Renderiza estrutura EXR em 512px via Blender headless
      await verifyCmd(
        `blend/bin/python -I ${scriptPath} -- ${exrOut} 512 ${cliArgs}`
      );

      // Se o usuario ainda nao liberou pixel art, pula o pintor.py
      if (!threeDOnlyMode) {
        await verifyCmd(
          `blend/bin/python -I tools/icones/pintor.py ${exrOut} ${pngOut} ${iconHeightPx} ${profilePath}`
        );
      }

      return { variant: vNum, cliArgs, exrOut, pngOut };
    })
  );

  // Monta a folha comparativa das 3 variantes numeradas (Render 3D + Pixel Art 2x + Tamanho Real 1x)
  const comparisonSheet = await agent(
    `Monte a prancha comparativa '/tmp/${itemId}_comparacao_1_2_3.png' com PIL colocando lado a lado as 3 variantes (${JSON.stringify(
      variantResults
    )}): render 3D pequeno + pixel art 2x (Image.NEAREST) + pixel art em tamanho real (${iconHeightPx}px).
     Ao final, informe: o que mudou, como testar e o que NAO foi testado.`,
    {
      harness: variantRunner,
      schema: {
        type: 'object',
        required: ['sheetPath', 'whatChanged', 'howToTest', 'notTested'],
        properties: {
          sheetPath: { type: 'string' },
          whatChanged: { type: 'string' },
          howToTest: { type: 'string' },
          notTested: { type: 'string' }
        }
      }
    }
  );

  // Se o usuario ainda nao escolheu a variante (1, 2 ou 3), pausa aqui (Ordered Replay Cache preserva tudo!)
  if (!approvedVariantIndex) {
    return {
      status: 'AWAITING_USER_EYE_APPROVAL',
      message: 'Prancha com 3 variantes gerada! Escolha 1, 2 ou 3 (ou peca ajustes de parametro).',
      comparisonSheet
    };
  }

  // ==========================================================================
  // FASE 3: RENDER FINAL 1024px, EXPORT 5X NEAREST, RECEITA & PLAYWRIGHT NA BOLSA
  // ==========================================================================
  const chosenArgs = designSpec.variantsArgs[approvedVariantIndex - 1];
  const finalExr = `/tmp/${itemId}_final_1024.exr`;
  const finalPng = `/tmp/${itemId}_final.png`;

  await verifyCmd(`blend/bin/python -I ${scriptPath} -- ${finalExr} 1024 ${chosenArgs}`);
  await verifyCmd(
    `blend/bin/python -I tools/icones/pintor.py ${finalExr} ${finalPng} ${iconHeightPx} ${profilePath}`
  );

  // Execucao das 8 Vistas Multi-Angulo (360) com Camera 24 graus e salvamento do .blend Master
  if (eightViewsMode) {
    await verifyCmd(
      `blend/bin/python -I ${scriptPath} -- /tmp/${itemId}_8vistas 512 --vistas8 --salvar-blend ${blendMasterPath} ${chosenArgs}`
    );
  }

  // Instala no jogo, atualiza receitas/<lote>.json, grava DIARIO e tira print da bolsa com Playwright
  const finalInstall = await agent(
    `A variante ${approvedVariantIndex} ('${chosenArgs}') foi aprovada pelo usuario!
     1. Entregue o modelo nativo Blender em '${blendMasterPath}' e prancha comparativa das 8 vistas (camera ${cameraElevation}°).
     2. Registre a entrega com data, parametros e checksum no arquivo 'docs/DIARIO_3D_PIXEL_FORGE.md'.
     3. Gere as duas imagens separadas: foto 3D recortada em fundo escuro e pixel art ampliado 5x com Image.NEAREST.
     4. Grave a escolha em 'tools/icones/receitas/${lote}.json' (script, args, perfil, altura: ${iconHeightPx}).
     5. Instale no jogo com 'python3 -I tools/add_icone.py item ${itemId} ${finalPng} --nativo'.
     6. Rode 'python3 tools/build.py && python3 tools/testes/mktest.py'.
     7. Suba servidor HTTP na porta 8765 e capture screenshot da tela da bolsa com Playwright para validarmos o icone em contexto real.`,
    {
      harness: variantRunner,
      allowedWriteFiles: [`tools/icones/receitas/${lote}.json`, 'docs/DIARIO_3D_PIXEL_FORGE.md'],
      schema: {
        type: 'object',
        required: ['render3dPath', 'pixelArt5xPath', 'bagScreenshotPath', 'blendMasterPath', 'whatChanged', 'howToTest', 'notTested'],
        properties: {
          render3dPath: { type: 'string' },
          pixelArt5xPath: { type: 'string' },
          bagScreenshotPath: { type: 'string' },
          blendMasterPath: { type: 'string' },
          whatChanged: { type: 'string' },
          howToTest: { type: 'string' },
          notTested: { type: 'string' }
        }
      }
    }
  );

  return {
    status: 'INSTALLED_AND_VERIFIED_IN_BAG',
    chosenVariant: approvedVariantIndex,
    chosenArgs,
    blendMasterPath,
    finalInstall
  };
}
