# Núcleo Rust: Quality Gates Determinísticos (WebGL/VRAM & Pipeline 3D Pixel Art)

> **Arquivo de Origem:** src-tauri/src/gates.rs  
> **Tamanho:** 345 linhas (14.2 KB)  
> **Descrição:** Validadores nativos de vazamento de memória GPU em Three.js/R3F (dispose checks, allocation in useFrame) e conformidade de scripts Blender EXR -> Pixel Art.

`rust
// src-tauri/src/gates.rs
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GateReport {
    pub squad_id: String,
    pub passed: bool,
    pub violations: Vec<String>,
    pub metrics: Value,
}

pub struct UltracodeGates;

impl UltracodeGates {
    /// Disjuntor financeiro de tokens em tempo real
    pub fn enforce_token_budget(current_tokens_used: usize, max_tokens_per_run: usize) -> Result<(), String> {
        if max_tokens_per_run > 0 && current_tokens_used >= max_tokens_per_run {
            return Err(format!(
                "TOKEN_BUDGET_EXCEEDED: Disjuntor financeiro ativado. Consumo atual ({} tokens) atingiu o orçamento máximo de {} tokens.",
                current_tokens_used, max_tokens_per_run
            ));
        }
        Ok(())
    }

    /// Limite máximo anti-loop de agentes por execução
    pub fn enforce_agent_cap(total_spawned: usize, max_total: usize) -> Result<(), String> {
        if total_spawned >= max_total {
            return Err(format!(
                "Ultracode Gate: Limite maximo de {} subagentes por execucao atingido (trava anti-loop).",
                max_total
            ));
        }
        Ok(())
    }

    /// Harmoniza e limita o nível de esforço solicitado pelo teto configurado
    pub fn clamp_effort(requested_effort: &str, provider_cap: &str) -> String {
        let levels = ["low", "medium", "high", "xhigh"];
        let req = match requested_effort {
            "ultracode" => "xhigh",
            other => other,
        };

        let req_idx = levels.iter().position(|&l| l == req).unwrap_or(2); // default high
        let cap_idx = levels.iter().position(|&l| l == provider_cap).unwrap_or(2);

        let final_idx = req_idx.min(cap_idx);
        levels[final_idx].to_string()
    }

    /// Validação estrita de schema com extração de blocos markdown
    pub fn validate_schema(raw_text: &str, schema: &Value) -> Result<Value, String> {
        let trimmed = raw_text.trim();
        let json_str = if trimmed.starts_with("```") {
            let re = regex::Regex::new(r"```(?:json)?\s*([\s\S]*?)```").map_err(|e| e.to_string())?;
            if let Some(caps) = re.captures(trimmed) {
                caps.get(1).map(|m| m.as_str().trim()).unwrap_or(trimmed)
            } else {
                trimmed
            }
        } else {
            trimmed
        };

        let parsed: Value = serde_json::from_str(json_str).map_err(|e| format!("JSON malformado: {}", e))?;

        if let Some(req_fields) = schema.get("required").and_then(|r| r.as_array()) {
            for req in req_fields {
                if let Some(field_name) = req.as_str() {
                    if parsed.get(field_name).is_none() {
                        return Err(format!("Campo obrigatório '{}' ausente no JSON", field_name));
                    }
                }
            }
        }

        Ok(parsed)
    }
}

pub struct DeterministicGates;

impl DeterministicGates {
    // ========================================================================
    // 1. GATE DO SQUAD-3D-SHADER-STUDIO (Three.js / R3F VRAM Dispose & GLSL)
    // ========================================================================
    pub fn validate_3d_shader_studio_gate(
        worktree_path: &Path,
        target_files: &[String],
    ) -> GateReport {
        let mut violations = Vec::new();
        let mut total_allocations = 0usize;
        let mut total_disposes = 0usize;
        let mut glsl_checked = 0usize;

        for rel_path in target_files {
            let full_path = worktree_path.join(rel_path);
            let content = match fs::read_to_string(&full_path) {
                Ok(c) => c,
                Err(_) => {
                    violations.push(format!("Arquivo esperado nao encontrado: {}", rel_path));
                    continue;
                }
            };

            // A. Verificacao de Shaders GLSL (inline ou arquivos .glsl/.vert/.frag)
            if rel_path.ends_with(".glsl")
                || rel_path.ends_with(".vert")
                || rel_path.ends_with(".frag")
                || content.contains("gl_Position")
                || content.contains("gl_FragColor")
            {
                glsl_checked += 1;
                if !content.contains("void main") {
                    violations.push(format!(
                        "[GLSL] {}: Shader nao contem entry point 'void main()'.",
                        rel_path
                    ));
                }
                // Detecta divisao literal por zero comum em shaders gerados
                if content.contains("/ 0.0") || content.contains("/0.0") {
                    violations.push(format!(
                        "[GLSL] {}: Divisao literal por 0.0 detectada no shader.",
                        rel_path
                    ));
                }
            }

            // B. Auditoria de Vazamento de VRAM (Geometries, Materials, Textures, RenderTargets)
            if rel_path.ends_with(".js")
                || rel_path.ends_with(".jsx")
                || rel_path.ends_with(".ts")
                || rel_path.ends_with(".tsx")
            {
                let alloc_patterns = [
                    "Geometry(",
                    "Material(",
                    "TextureLoader",
                    "WebGLRenderTarget(",
                    "DataTexture(",
                ];

                let file_allocs: usize = alloc_patterns
                    .iter()
                    .map(|pat| content.matches(pat).count())
                    .sum();
                let file_disposes = content.matches(".dispose()").count();

                total_allocations += file_allocs;
                total_disposes += file_disposes;

                if file_allocs > 0 && file_disposes == 0 {
                    violations.push(format!(
                        "[VRAM Leak] {}: Detectadas {} alocacoes Three.js sem nenhuma chamada a .dispose() no cleanup.",
                        rel_path, file_allocs
                    ));
                }

                // Verifica se useFrame realiza instanciacao pesada por frame (mata os 60 FPS)
                if content.contains("useFrame") && content.contains("new THREE.Vector3") {
                    let lines: Vec<&str> = content.lines().collect();
                    let mut inside_use_frame = false;
                    for (idx, line) in lines.iter().enumerate() {
                        if line.contains("useFrame(") {
                            inside_use_frame = true;
                        }
                        if inside_use_frame && line.contains("new THREE.") {
                            violations.push(format!(
                                "[60FPS Gate] {}:{}: Alocacao 'new THREE.*' dentro de useFrame causa engasgos de Garbage Collector. Reutilize objetos via useMemo/useRef.",
                                rel_path,
                                idx + 1
                            ));
                            break;
                        }
                    }
                }
            }
        }

        GateReport {
            squad_id: "squad-3d-shader-studio".to_string(),
            passed: violations.is_empty(),
            violations,
            metrics: serde_json::json!({
                "vram_allocations_detected": total_allocations,
                "vram_disposes_detected": total_disposes,
                "glsl_shaders_audited": glsl_checked
            }),
        }
    }

    // ========================================================================
    // 2. GATE DO SQUAD-PIXEL-FORGE-3D (Blender bpy -> EXR -> Pintor Pixel Art)
    // ========================================================================
    pub fn validate_pixel_forge_gate(
        worktree_path: &Path,
        bpy_script_rel: &str,
        profile_json_rel: &str,
    ) -> GateReport {
        let mut violations = Vec::new();

        // A. Audita o script 3D procedural (tools/icones/<item>.py)
        let script_path = worktree_path.join(bpy_script_rel);
        match fs::read_to_string(&script_path) {
            Ok(code) => {
                if !code.contains("from cena import") && !code.contains("import bpy") {
                    violations.push(format!(
                        "[bpy Script] {}: Deve importar helpers de 'cena' (nova, mat, add, obj, render).",
                        bpy_script_rel
                    ));
                }
                if !code.contains("render(") {
                    violations.push(format!(
                        "[bpy Script] {}: Chamada final a render(OUT, RES, ...) ausente.",
                        bpy_script_rel
                    ));
                }
                // Armadilha documentada na Secao 6 do PROCESSO_ICONES_3D.md: numpy.float64 com Vector
                if (code.contains("np.") || code.contains("numpy"))
                    && code.contains("Vector(")
                    && !code.contains("float(")
                {
                    violations.push(format!(
                        "[bpy Gotcha] {}: Uso de numpy com Vector detectado sem conversao explicita float(). Isso causa TypeError com numpy.float64 no Blender.",
                        bpy_script_rel
                    ));
                }
                // Seguranca (Secao 7): proibido chaves de API hardcoded
                if code.contains("sk-") || code.contains("AIza") || code.contains("API_KEY = \"") {
                    violations.push(format!(
                        "[Seguranca] {}: Possivel chave de API hardcoded detectada no script.",
                        bpy_script_rel
                    ));
                }
            }
            Err(_) => violations.push(format!(
                "Script 3D do item nao encontrado: {}",
                bpy_script_rel
            )),
        }

        // B. Audita o Perfil do Pintor (tools/icones/perfis/<item>.json)
        let profile_path = worktree_path.join(profile_json_rel);
        let mut pieces_validated = 0usize;

        match fs::read_to_string(&profile_path) {
            Ok(raw_json) => match serde_json::from_str::<Value>(&raw_json) {
                Ok(Value::Object(map)) => {
                    if !map.contains_key("_global") {
                        violations.push(format!(
                            "[Perfil JSON] {}: Chave obrigatoria '_global' (light, sil, zt, outline_L) ausente.",
                            profile_json_rel
                        ));
                    }

                    let valid_kinds = ["cloth", "soft", "metal", "gem"];
                    for (key, val) in &map {
                        if key == "_global" {
                            continue;
                        }
                        pieces_validated += 1;

                        // Verifica 'kind'
                        let kind = val.get("kind").and_then(|v| v.as_str()).unwrap_or("");
                        if !valid_kinds.contains(&kind) {
                            violations.push(format!(
                                "[Perfil JSON] Peca '{}': 'kind' invalido ('{}'). Use cloth, soft, metal ou gem.",
                                key, kind
                            ));
                        }

                        // Verifica 'ramp' e 'bands'
                        let ramp_len = val
                            .get("ramp")
                            .and_then(|v| v.as_array())
                            .map(|a| a.len())
                            .unwrap_or(0);
                        let bands = val.get("bands").and_then(|v| v.as_u64()).unwrap_or(0) as usize;

                        if ramp_len < 3 {
                            violations.push(format!(
                                "[Perfil JSON] Peca '{}': 'ramp' deve ter pelo menos 3 cores hexadecimais.",
                                key
                            ));
                        }
                        if bands < 2 || bands > ramp_len {
                            violations.push(format!(
                                "[Perfil JSON] Peca '{}': 'bands' ({}) incompativel com tamanho da 'ramp' ({}).",
                                key, bands, ramp_len
                            ));
                        }

                        // Verifica 'budget' (numero de elementos deve bater com 'bands' e somar 100)
                        if let Some(budget_arr) = val.get("budget").and_then(|v| v.as_array()) {
                            if budget_arr.len() != bands {
                                violations.push(format!(
                                    "[Perfil JSON] Peca '{}': 'budget' tem {} itens, mas 'bands' e {}.",
                                    key,
                                    budget_arr.len(),
                                    bands
                                ));
                            }
                            let sum: i64 = budget_arr.iter().filter_map(|x| x.as_i64()).sum();
                            if sum != 100 {
                                violations.push(format!(
                                    "[Perfil JSON] Peca '{}': soma de 'budget' deve ser 100% (atual: {}%).",
                                    key, sum
                                ));
                            }
                        } else {
                            violations.push(format!(
                                "[Perfil JSON] Peca '{}': array 'budget' obrigatorio ausente.",
                                key
                            ));
                        }
                    }
                }
                _ => violations.push(format!(
                    "[Perfil JSON] {}: JSON invalido ou nao e um objeto.",
                    profile_json_rel
                )),
            },
            Err(_) => violations.push(format!(
                "Arquivo de perfil do pintor nao encontrado: {}",
                profile_json_rel
            )),
        }

        GateReport {
            squad_id: "squad-pixel-forge-3d".to_string(),
            passed: violations.is_empty(),
            violations,
            metrics: serde_json::json!({
                "pieces_validated": pieces_validated,
                "bpy_script": bpy_script_rel,
                "profile_json": profile_json_rel
            }),
        }
    }
}
`
