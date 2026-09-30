export const MODELS = [
  {
    label: "Gemini 3.5 Flash Lite",
    provider: "google",
    model: "gemini-3.5-flash-lite",
    fast: true,
    reason: false,
  },
];

export type LlmConfig = { provider: string; model: string };

export const DEFAULT_LLM: LlmConfig = {
  provider: MODELS[0].provider,
  model: MODELS[0].model,
};

export const resolveLlmConfig = (config?: Partial<LlmConfig> | null): LlmConfig => {
  const match = MODELS.find(({ provider, model }) => provider === config?.provider && model === config?.model);
  return match ? { provider: match.provider, model: match.model } : DEFAULT_LLM;
};

export const getLlmConfig = (): LlmConfig => {
  try {
    const item = window.localStorage.getItem('llm');
    return resolveLlmConfig(item ? JSON.parse(item) : null);
  } catch (error) {
    console.log(error);
    return DEFAULT_LLM;
  }
};
