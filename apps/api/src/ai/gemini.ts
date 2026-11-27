import { env } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export function hasGeminiConfiguration(): boolean {
  return Boolean(env.GEMINI_API_KEY);
}

export async function createGeminiClient() {
  if (!env.GEMINI_API_KEY) {
    throw new AppError(
      503,
      "AI_NOT_CONFIGURED",
      "AI features are not configured."
    );
  }

  const { GoogleGenAI } = await import("@google/genai");
  return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
}
