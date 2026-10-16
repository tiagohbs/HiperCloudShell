#!/usr/bin/env node
/**
 * scripts/sync-stitch-mcp.cjs
 * Lê o arquivo .env do HiperCloudShell e sincroniza a chave do Google Stitch
 * no servidor MCP para Claude Code CLI, Google Antigravity e .mcp.json local.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const ENV_PATH = path.join(PROJECT_ROOT, '.env');
const MCP_JSON_PATH = path.join(PROJECT_ROOT, '.mcp.json');

const GEMINI_CONFIG_PATH = path.join(
  process.env.USERPROFILE || process.env.HOME || '',
  '.gemini',
  'config',
  'mcp_config.json'
);

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

function syncStitchMcp() {
  console.log('🔄 Sincronizando Google Stitch MCP com as variáveis do .env...');

  const env = parseEnv(ENV_PATH);
  const apiKey = env.STITCH_API_KEY;
  const mcpUrl = env.STITCH_MCP_URL || 'https://stitch.googleapis.com/mcp';

  if (!apiKey || apiKey === 'coloque_sua_chave_stitch_aqui' || apiKey === 'sua_chave_do_stitch_aqui') {
    console.warn('\n⚠️  Aviso: STITCH_API_KEY não foi configurada ou ainda contém o valor padrão.');
    console.warn(`👉 Abra o arquivo .env e substitua:`);
    console.warn(`   STITCH_API_KEY=${apiKey || 'coloque_sua_chave_stitch_aqui'}`);
    console.warn(`   pela sua chave obtida em: https://stitch.withgoogle.com -> Settings -> API Keys\n`);
    return false;
  }

  // 1. Gera / Atualiza .mcp.json no root do projeto (ignorado pelo git)
  const localMcpConfig = {
    mcpServers: {
      stitch: {
        type: 'http',
        url: mcpUrl,
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      }
    }
  };

  try {
    fs.writeFileSync(MCP_JSON_PATH, JSON.stringify(localMcpConfig, null, 2), 'utf8');
    console.log(`✔ .mcp.json do projeto configurado com Stitch MCP.`);
  } catch (err) {
    console.error(`Falha ao gravar .mcp.json:`, err.message);
  }

  // 2. Atualiza a configuração MCP do Google Antigravity / Gemini
  try {
    let geminiConfig = { mcpServers: {} };
    if (fs.existsSync(GEMINI_CONFIG_PATH)) {
      try {
        const raw = fs.readFileSync(GEMINI_CONFIG_PATH, 'utf8').trim();
        if (raw) geminiConfig = JSON.parse(raw);
      } catch (_) {}
    }
    if (!geminiConfig.mcpServers) geminiConfig.mcpServers = {};
    geminiConfig.mcpServers.stitch = {
      url: mcpUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    };
    const geminiDir = path.dirname(GEMINI_CONFIG_PATH);
    if (!fs.existsSync(geminiDir)) fs.mkdirSync(geminiDir, { recursive: true });
    fs.writeFileSync(GEMINI_CONFIG_PATH, JSON.stringify(geminiConfig, null, 2), 'utf8');
    console.log(`✔ Configuração MCP do Antigravity/Gemini atualizada (${GEMINI_CONFIG_PATH}).`);
  } catch (err) {
    console.warn(`Aviso ao atualizar Antigravity MCP:`, err.message);
  }

  // 3. Registra / Atualiza no Claude Code CLI
  try {
    console.log(`📡 Registrando Stitch MCP no Claude Code CLI...`);
    execSync(
      `claude mcp add --transport http stitch "${mcpUrl}" --header "Authorization: Bearer ${apiKey}"`,
      { stdio: 'inherit', cwd: PROJECT_ROOT }
    );
    console.log(`✔ Stitch MCP registrado com sucesso no Claude Code CLI!`);
  } catch (err) {
    console.warn(`(Claude CLI registration notice: ${err.message})`);
  }

  console.log('\n✨ Google Stitch MCP conectado e alimentado com sucesso a partir do .env!');
  return true;
}

if (require.main === module) {
  syncStitchMcp();
}

module.exports = { syncStitchMcp, parseEnv };
