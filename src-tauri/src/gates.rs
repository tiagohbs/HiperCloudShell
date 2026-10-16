use serde_json::Value;

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
