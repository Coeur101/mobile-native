import { describe, expect, it, vi } from "vitest";
import { createOpenAICompatibleAIService } from "@/services/ai";
import type { Project, UserSettings } from "@/types";

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

describe("createOpenAICompatibleAIService streaming", () => {
  it("emits streaming progress for assistant content and thinking steps", async () => {
    const currentProject: Project = {
      id: "project-1",
      ownerUserId: "user-1",
      name: "当前项目",
      description: "已有内容",
      status: "active",
      files: {
        "index.html": "<div>before</div>",
        "style.css": "body { color: red; }",
        "main.js": "console.log('before')",
      },
      messages: [],
      versions: [],
      preview: {
        entry: "index.html",
        framework: "vanilla",
      },
      createdAt: "2026-03-27T00:00:00.000Z",
      updatedAt: "2026-03-27T00:00:00.000Z",
    };
    const streamedPayload = JSON.stringify({
      projectName: "流式营销页",
      summary: "一个带流式反馈的营销页",
      assistantMessage: "已先为你搭好页面框架，正在补充样式和交互。",
      thinkingSteps: [
        {
          id: "step-1",
          title: "整理页面结构",
          description: "先搭建 Hero 与 CTA 层级。",
          content: "已确认页面主视觉、标题区和行动按钮位置。",
          status: "success",
        },
      ],
      files: {
        "index.html": "<!doctype html><html lang=\"zh-CN\"><body><main>stream</main></body></html>",
        "style.css": "body { margin: 0; }",
        "main.js": "console.log('stream-ready')",
      },
    });
    const progressEvents: Array<{ status: string; content: string; thinkingSteps: number }> = [];

    const service = createOpenAICompatibleAIService({
      settingsService: {
        getSettings: () => createSettings(),
        saveSettings: async () => {},
      },
      fetchImpl: vi.fn(async () =>
        createStreamingResponse([
          streamedPayload.slice(0, 110),
          streamedPayload.slice(110, 250),
          streamedPayload.slice(250),
        ]),
      ) as typeof fetch,
    });

    const payload = await service.generateProjectFromPrompt("生成带流式反馈的营销页", currentProject, {
      onProgress: (progress) => {
        progressEvents.push({
          status: progress.status,
          content: progress.content,
          thinkingSteps: progress.thinkingSteps.length,
        });
      },
    });

    expect(progressEvents.length).toBeGreaterThan(1);
    expect(progressEvents.some((event) => event.status === "streaming" && event.content.length > 0)).toBe(true);
    expect(progressEvents.some((event) => event.thinkingSteps > 0)).toBe(true);
    expect(payload.projectName).toBe("流式营销页");
    expect(payload.messages[0]?.content).toContain("页面框架");
    expect(payload.messages[0]?.thinkingSteps?.[0]?.title).toBe("整理页面结构");
  });
});
