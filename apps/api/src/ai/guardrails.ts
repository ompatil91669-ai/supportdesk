export const AI_LIMITS = {
  maxCommentChars: 800,
  maxComments: 8,
  maxContextChars: 8_000,
  maxReplyChars: 4_000,
  maxCategoryOutputChars: 512,
  maxDeltaChars: 1_000,
  streamSafetyTailChars: 512,
} as const;

export const AI_MANUAL_FALLBACK_MESSAGE =
  "AI unavailable — reply manually.";

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const secretPattern =
  /\b(password|passwd|passcode|secret|api[_ -]?key|access[_ -]?token|refresh[_ -]?token|authorization)\b\s*[:=]\s*["']?[^"',;\r\n]+/gi;
const bearerPattern = /\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi;
const phonePattern =
  /(?<!\w)(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\w)/g;
const socialSecurityPattern = /\b\d{3}-?\d{2}-?\d{4}\b/g;
const paymentCardPattern = /\b(?:\d[ -]?){13,19}\b/g;
const streetAddressPattern =
  /\b\d{1,6}\s+(?:[A-Z0-9.'#-]+\s+){0,5}(?:street|st|road|rd|avenue|ave|boulevard|blvd|lane|ln|drive|dr|court|ct|way)\b\.?/gi;

export function maskSensitiveData(value: string): string {
  return value
    .replace(secretPattern, "$1=[REDACTED]")
    .replace(bearerPattern, "Bearer [REDACTED]")
    .replace(emailPattern, "[REDACTED_EMAIL]")
    .replace(phonePattern, "[REDACTED_PHONE]")
    .replace(socialSecurityPattern, "[REDACTED_ID]")
    .replace(paymentCardPattern, "[REDACTED_PAYMENT_NUMBER]")
    .replace(streetAddressPattern, "[REDACTED_ADDRESS]");
}

export function getSafeStreamPrefix(value: string): {
  safeText: string;
  safePrefixLength: number;
} {
  const safeText = maskSensitiveData(value);
  return {
    safeText,
    safePrefixLength: Math.max(
      0,
      safeText.length - AI_LIMITS.streamSafetyTailChars
    ),
  };
}

export const GEMINI_SAFETY_SETTINGS = [
  { type: "harassment", threshold: "block_medium_and_above" },
  { type: "hate_speech", threshold: "block_medium_and_above" },
  { type: "dangerous_content", threshold: "block_medium_and_above" },
  { type: "sexually_explicit", threshold: "block_medium_and_above" },
  { type: "jailbreak", threshold: "block_low_and_above" },
] as const;
