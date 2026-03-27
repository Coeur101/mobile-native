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

describe("createOpenAICompatibleAIService", () => {
  it("rejects generation when the model name is missing", async () => {
    const service = createOpenAICompatibleAIService({
      settingsService: {
        getSettings: () => createSettings({ preferredModel: "" }),
        saveSettings: async () => {},
      },
      fetchImpl: vi.fn(),
    });

    await expect(service.generateProjectFromPrompt("生成一个首页")).rejects.toThrow(
      "请先在高级设置中填写可用的 AI 模型名称。",
    );
  });

  it("calls an OpenAI-compatible endpoint and parses the structured response", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  projectName: "营销首页",
                  summary: "一个用于展示产品卖点的营销首页",
                  assistantMessage: "已根据你的需求生成首版页面。",
                  thinkingSteps: [
                    {
                      title: "整理页面结构",
                      description: "抽取主视觉、卖点和行动按钮。",
                      content: "首页包含 hero、卖点列表与 CTA 按钮。",
                      status: "success",
                    },
                  ],
                  files: {
                    "index.html": "<!doctype html><html lang=\"zh-CN\"><body><main>hello</main></body></html>",
                    "style.css": "body { margin: 0; }",
                    "main.js": "console.log('ready')",
                  },
                }),
              },
            },
          ],
        }),
    })) as typeof fetch;

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

    const service = createOpenAICompatibleAIService({
      settingsService: {
        getSettings: () => createSettings(),
        saveSettings: async () => {},
      },
      fetchImpl,
    });

    const payload = await service.generateProjectFromPrompt("继续完善营销首页", currentProject);

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [endpoint, init] = fetchImpl.mock.calls[0] ?? [];
    expect(endpoint).toBe("https://api.example.com/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer demo-api-key",
    });

    const body = JSON.parse(String(init?.body)) as {
      model: string;
      messages: Array<{ role: string; content: string }>;
    };
    expect(body.model).toBe("demo-model");
    expect(body.messages[1]?.content).toContain("当前项目");
    expect(body.messages[1]?.content).toContain("继续完善营销首页");

    expect(payload.projectName).toBe("营销首页");
    expect(payload.files["index.html"]).toContain("zh-CN");
    expect(payload.messages[0]?.content).toBe("已根据你的需求生成首版页面。");
    expect(payload.messages[0]?.metadata).toMatchObject({
      provider: "openai-compatible",
      model: "demo-model",
    });
    expect(payload.messages[0]?.thinkingSteps).toHaveLength(1);
  });

  it("rejects invalid provider output instead of fabricating files", async () => {
    const service = createOpenAICompatibleAIService({
      settingsService: {
        getSettings: () => createSettings(),
        saveSettings: async () => {},
      },
      fetchImpl: vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "{\"projectName\":\"损坏响应\",\"summary\":\"缺文件\",\"assistantMessage\":\"失败\",\"files\":{\"index.html\":\"<div></div>\"}}",
                },
              },
            ],
          }),
      })) as typeof fetch,
    });

    await expect(service.generateProjectFromPrompt("生成一个页面")).rejects.toThrow(
      "AI 返回缺少必需文件：style.css。",
    );
  });
});
