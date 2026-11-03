/**
 * Deterministic output guardrails of the text agent (ADR 0026). They run after the model, so a manipulated or
 * confused answer still cannot add an instruction, a non-food item or a piece of the prompt to what the user sees.
 */

/** Text that reads as an order to the assistant, not as something eaten (LLM01). */
const INSTRUCTION =
  /\b(ignora|olvida|instrucci|prompt|system|sistema|admin|regla|propose_entries|search_catalog|get_units|catalogid|responde|repite|mu[eé]strame|dime|escribe|registra|agrega|a[nñ]ade|calor[ií]as?|kcal)|<\/?texto_de_la_persona>/i;

/** Things the text log never records (F16: only meals; never sleep, symptoms, activity or intimate entries). */
const NOT_FOOD =
  /\b(dorm[ií]|sue[nñ]o|horas? de|camin[eé]|corr[ií]|ejercicio|gimnasio|dolor|me doli[oó]|hinchad|n[aá]usea|relaciones|sexo|ba[nñ]o|deposici)/i;

/** Pieces of the system prompt that must never reach the user (LLM07). */
const PROMPT_LEAK =
  /propose_entries|search_catalog|get_units|texto_de_la_persona|Eres el asistente|Reglas:/i;

export function isInstruction(text: string): boolean {
  return INSTRUCTION.test(text);
}

export function isNotFood(text: string): boolean {
  return NOT_FOOD.test(text);
}

export function leaksPrompt(text: string): boolean {
  return PROMPT_LEAK.test(text);
}

/** A pending item survives only when it reads as food: no instruction, no sleep or symptom, no prompt piece. */
export function keepUnmatched(text: string): boolean {
  return !isInstruction(text) && !isNotFood(text) && !leaksPrompt(text);
}
