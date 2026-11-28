import { readFile } from "node:fs/promises";
import path from "node:path";

const categories = [
  "Technical",
  "Billing",
  "Account",
  "General",
  "Other",
] as const;
type Category = (typeof categories)[number];

interface LabelledTicket {
  id: string;
  title: string;
  comments: string[];
  expectedCategory: Category;
}

interface EvaluationContext {
  ticket: {
    id: string;
    name: string;
    status: string;
    priority: string;
  };
  publicComments: Array<{ content: string; createdAt: Date }>;
}

interface CategorisationResult {
  category: Category;
  priority: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCategory(value: unknown): value is Category {
  return typeof value === "string" && categories.includes(value as Category);
}

function validateLabelledTickets(value: unknown): LabelledTicket[] {
  if (!Array.isArray(value) || value.length !== 20) {
    throw new Error("Expected exactly 20 labelled evaluation tickets.");
  }

  const tickets = value.map((item, index): LabelledTicket => {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      !item.id.trim() ||
      typeof item.title !== "string" ||
      !item.title.trim() ||
      !Array.isArray(item.comments) ||
      !item.comments.every((comment) => typeof comment === "string") ||
      !isCategory(item.expectedCategory)
    ) {
      throw new Error(`Evaluation ticket ${index + 1} has an invalid shape.`);
    }

    return {
      id: item.id,
      title: item.title,
      comments: item.comments,
      expectedCategory: item.expectedCategory,
    };
  });

  const counts = new Map<Category, number>(
    categories.map((category) => [category, 0])
  );
  for (const ticket of tickets) {
    counts.set(ticket.expectedCategory, counts.get(ticket.expectedCategory)! + 1);
  }
  if (categories.some((category) => counts.get(category) !== 4)) {
    throw new Error("Expected exactly four labelled tickets in each category.");
  }

  return tickets;
}

function safeErrorCode(error: unknown): string {
  if (
    isRecord(error) &&
    typeof error.code === "string" &&
    /^[A-Z0-9_]{1,80}$/.test(error.code)
  ) {
    return error.code;
  }
  return "AI_PROVIDER_ERROR";
}

async function main(): Promise<void> {
  if (!process.argv.includes("--allow-live-gemini")) {
    throw new Error(
      "Live requests are disabled. After explicit approval, rerun with --allow-live-gemini."
    );
  }

  const fixturePath = path.resolve(
    __dirname,
    "../tests/fixtures/ai/labelled-tickets.json"
  );
  const fixtureText = await readFile(fixturePath, "utf8");
  const tickets = validateLabelledTickets(JSON.parse(fixtureText) as unknown);
  const service = require(
    path.resolve(__dirname, "../src/services/ai.service")
  ) as {
    categoriseTicket: (
      context: EvaluationContext
    ) => Promise<CategorisationResult>;
  };

  const results: Array<{
    id: string;
    expectedCategory: Category;
    actualCategory?: Category;
    correct?: boolean;
    errorCode?: string;
  }> = [];
  const timestamp = new Date().toISOString();

  for (const ticket of tickets) {
    try {
      const prediction = await service.categoriseTicket({
        ticket: {
          id: ticket.id,
          name: "[REDACTED CUSTOMER NAME]",
          status: "Open",
          priority: "Medium",
        },
        publicComments: [
          ticket.title,
          ...ticket.comments,
        ].map((content) => ({
          content,
          createdAt: new Date(timestamp),
        })),
      });
      results.push({
        id: ticket.id,
        expectedCategory: ticket.expectedCategory,
        actualCategory: prediction.category,
        correct: prediction.category === ticket.expectedCategory,
      });
    } catch (error) {
      results.push({
        id: ticket.id,
        expectedCategory: ticket.expectedCategory,
        errorCode: safeErrorCode(error),
      });
    }
  }

  const evaluated = results.filter(
    (result): result is typeof result & { correct: boolean } =>
      typeof result.correct === "boolean"
  );
  const correctCount = evaluated.filter((result) => result.correct).length;
  const byCategory = Object.fromEntries(
    categories.map((category) => {
      const rows = evaluated.filter(
        (result) => result.expectedCategory === category
      );
      return [
        category,
        {
          correct: rows.filter((result) => result.correct).length,
          evaluated: rows.length,
        },
      ];
    })
  );

  console.log(
    JSON.stringify(
      {
        startedAt: timestamp,
        totalTickets: tickets.length,
        evaluatedTickets: evaluated.length,
        failedRequests: results.length - evaluated.length,
        correct: correctCount,
        accuracy:
          evaluated.length === 0
            ? null
            : Number((correctCount / evaluated.length).toFixed(4)),
        byCategory,
        results,
      },
      null,
      2
    )
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Evaluation failed.");
  process.exitCode = 1;
});
