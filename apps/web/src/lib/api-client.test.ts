import { afterEach, describe, expect, it, vi } from "vitest";

const callbacks = () => ({
  onDelta: vi.fn(),
  onComplete: vi.fn(),
  onError: vi.fn(),
  onInterrupted: vi.fn(),
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("streamApiRequest", () => {
  it("reports an SSE provider error once without also reporting interruption", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5556");
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            'event: error\ndata: {"code":"AI_PROVIDER_ERROR","message":"AI unavailable — reply manually."}\n\n'
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 }))
    );
    const { streamApiRequest } = await import("./api-client");
    const handlers = callbacks();

    await streamApiRequest("/tickets/TKT-101/ai/suggest-reply", handlers);

    expect(handlers.onError).toHaveBeenCalledOnce();
    expect(handlers.onError).toHaveBeenCalledWith(
      "AI_PROVIDER_ERROR",
      "AI unavailable — reply manually."
    );
    expect(handlers.onInterrupted).not.toHaveBeenCalled();
    expect(handlers.onComplete).not.toHaveBeenCalled();
  });

  it("stops processing an invalid SSE payload after reporting the stream error", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5556");
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            "event: delta\ndata: {invalid}\n\nevent: complete\ndata: {}\n\n"
          )
        );
        controller.close();
      },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(body, { status: 200 }))
    );
    const { streamApiRequest } = await import("./api-client");
    const handlers = callbacks();

    await streamApiRequest("/tickets/TKT-101/ai/suggest-reply", handlers);

    expect(handlers.onError).toHaveBeenCalledWith(
      "INVALID_STREAM",
      "The AI stream returned invalid data."
    );
    expect(handlers.onComplete).not.toHaveBeenCalled();
    expect(handlers.onInterrupted).not.toHaveBeenCalled();
  });

  it("reports explicit request cancellation as interruption, not a network error", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "http://localhost:5556");
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError")));
    const { streamApiRequest } = await import("./api-client");
    const handlers = callbacks();

    await streamApiRequest(
      "/tickets/TKT-101/ai/suggest-reply",
      handlers,
      { signal: controller.signal }
    );

    expect(handlers.onInterrupted).toHaveBeenCalledOnce();
    expect(handlers.onError).not.toHaveBeenCalled();
  });
});
