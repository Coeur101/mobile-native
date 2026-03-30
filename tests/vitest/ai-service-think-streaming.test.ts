import { describe, expect, it, vi } from "vitest";
import { createOpenAICompatibleAIService } from "@/services/ai";
import type { UserSettings } from "@/types";

function createSettings(overrides: Partial<UserSettings> = {}): UserSettings {
  return {
    theme: "auto",
    preferredModel: "demo-model",
    customBaseUrl: "https://api.example.com/v1",
    apiKey: "demo-api-key",
    notes: "",
    ...overrides,
  };
}

function createStreamingResponse(chunks: string[]) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ choices: [{ delta: { content: chunk } }] })}\n\n`,
            ),
          );
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
      },
    },
  );
}

describe("createOpenAICompatibleAIService think streaming", () => {
  it("parses think-prefixed streams and exposes temporary thinking progress", async () => {
    const streamedPayload = `<think>\nAnalyze the request\nDraft UI structure\n</think>\n\n${JSON.stringify({
      projectName: "Minesweeper",
      summary: "A touch-friendly minesweeper game.",
      assistantMessage: "Generated a mobile-friendly minesweeper experience.",
      thinkingSteps: [
        {
          title: "Analyze request",
          description: "Inspect the requested gameplay and layout constraints.",
          content: "Focus on a touch-friendly board, responsive layout, and compact controls.",
          status: "success",
        },
      ],
      files: {
        "index.html": "<!doctype html><html lang=\"zh-CN\"><body><main>Minesweeper</main></body></html>",
        "style.css": "body { margin: 0; }",
        "main.js": "console.log('minesweeper-ready')",
      },
    })}`;
    const progressEvents: Array<{
      status: string;
      content: string;
      thinkingTitles: string[];
      thinkingContent: string[];
    }> = [];

    const service = createOpenAICompatibleAIService({
      settingsService: {
        getSettings: () => createSettings(),
        saveSettings: async () => {},
      },
      fetchImpl: vi.fn(async () =>
        createStreamingResponse([
          streamedPayload.slice(0, 24),
          streamedPayload.slice(24, 80),
          streamedPayload.slice(80, 220),
          streamedPayload.slice(220),
        ]),
      ) as typeof fetch,
    });

    const payload = await service.generateProjectFromPrompt("build a minesweeper game", undefined, {
      onProgress: (progress) => {
        progressEvents.push({
          status: progress.status,
          content: progress.content,
          thinkingTitles: progress.thinkingSteps.map((step) => step.title),
          thinkingContent: progress.thinkingSteps.map((step) => step.content ?? ""),
        });
      },
    });

    expect(progressEvents.some((event) => event.thinkingTitles.length > 0)).toBe(true);
    expect(progressEvents.some((event) => event.thinkingContent.some((content) => content.includes("Analyze the request")))).toBe(true);
    expect(progressEvents.some((event) => event.content.includes("Generated a mobile-friendly minesweeper experience."))).toBe(true);
    expect(payload.projectName).toBe("Minesweeper");
    expect(payload.messages[0]?.content).toBe("Generated a mobile-friendly minesweeper experience.");
    expect(payload.messages[0]?.thinkingSteps?.[0]?.title).toBe("Analyze request");
  });
});

