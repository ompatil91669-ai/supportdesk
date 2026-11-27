interface UsageData {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_thought_tokens?: number;
  total_tokens?: number;
}

export function estimateFreeTierCost(usage?: UsageData): number {
  void usage;
  return 0;
}

export function logAiUsage(input: {
  feature: "suggest-reply" | "categorise";
  promptVersion: string;
  model: string;
  usage?: UsageData;
  status: "success" | "error";
  durationMs: number;
  errorCode?: string;
}): void {
  console.log(
    JSON.stringify({
      event: "gemini_usage",
      provider: "google",
      model: input.model,
      feature: input.feature,
      promptVersion: input.promptVersion,
      inputTokenCount: input.usage?.total_input_tokens ?? null,
      outputTokenCount: input.usage?.total_output_tokens ?? null,
      thinkingTokenCount: input.usage?.total_thought_tokens ?? null,
      totalTokenCount: input.usage?.total_tokens ?? null,
      estimatedCostUsd: estimateFreeTierCost(input.usage),
      pricingTier: "free",
      requestStatus: input.status,
      timestamp: new Date().toISOString(),
      requestDurationMs: input.durationMs,
      ...(input.errorCode ? { errorCode: input.errorCode } : {}),
    })
  );
}
