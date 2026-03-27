import { settingsService as defaultSettingsService } from "@/services/settings";
import type { SettingsService } from "@/services/settings/settings-service";
import type { GeneratedProjectPayload, Project, ProjectFileMap, ThinkingStep } from "@/types";
import type { AIService } from "./ai-service";

type FetchLike = typeof fetch;

type ChatCompletionMessage = {
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: ChatCompletionMessage;
  }>;
  error?: {
    message?: string;
  };
};

type OpenAICompatibleAIServiceDependencies = {
  fetchImpl?: FetchLike;
  settingsService?: SettingsService;
};

type ParsedAIResult = {
  projectName: string;
  summary: string;
  files: ProjectFileMap;
  assistantMessage: string;
  thinkingSteps: ThinkingStep[];
};

const PLACEHOLDER_MODEL_NAMES = new Set(["mock-gpt"]);
const REQUIRED_FILES = ["index.html", "style.css", "main.js"] as const;

function normalizeValue(value: string | undefined | null) {
  return value?.trim() ?? "";
}

function ensureConfiguredSettings(settingsService: SettingsService) {
  const settings = settingsService.getSettings();
  const preferredModel = normalizeValue(settings.preferredModel);
  const customBaseUrl = normalizeValue(settings.customBaseUrl);
  const apiKey = normalizeValue(settings.apiKey);

  if (!preferredModel || PLACEHOLDER_MODEL_NAMES.has(preferredModel)) {
    throw new Error("请先在高级设置中填写可用的 AI 模型名称。");
  }

  if (!customBaseUrl) {
    throw new Error("请先在高级设置中填写 AI 服务 Base URL。");
  }

  if (!apiKey) {
    throw new Error("请先在高级设置中填写 API Key。");
  }

  return {
    preferredModel,
    customBaseUrl,
    apiKey,
  };
}

function buildEndpoint(baseUrl: string) {
  const normalized = baseUrl.replace(/\/+$/, "");
  return normalized.endsWith("/chat/completions")
    ? normalized
    : `${normalized}/chat/completions`;
}

function buildSystemPrompt() {
  return [
    "你是一个中文网页生成助手。",
    "你的任务是根据用户需求输出一个完整、可直接预览的轻量网页项目。",
    "你必须只返回 JSON，禁止返回 Markdown 代码块、解释文本或额外前后缀。",
    "JSON 必须包含以下字段：",
    "projectName: 字符串，项目名称。",
    "summary: 字符串，简洁总结当前版本内容。",
    "assistantMessage: 字符串，面向用户的中文回复。",
    "thinkingSteps: 数组，可选，每项包含 title、description、content、status。",
    "files: 对象，且必须包含 index.html、style.css、main.js 三个字符串文件。",
    "返回的 HTML 必须使用 zh-CN，CSS 和 JS 必须可直接运行。",
    "如果用户是在续写已有项目，你必须返回完整文件内容，而不是增量补丁。",
  ].join("\n");
}

function buildUserPrompt(prompt: string, project?: Project) {
  const context = project
    ? [
        "当前正在续写已有项目。",
        `项目名称：${project.name}`,
        `项目描述：${project.description}`,
        "当前文件：",
        JSON.stringify(project.files, null, 2),
      ].join("\n")
    : "当前是首次生成新项目。";

  return [
    context,
    "",
    "用户需求：",
    prompt.trim(),
    "",
    "请严格返回 JSON 对象，不要输出任何额外说明。",
  ].join("\n");
}

function extractResponseText(content: ChatCompletionMessage["content"]) {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item?.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

function stripMarkdownFences(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function extractJsonText(value: string) {
  const normalized = stripMarkdownFences(value);
  if (normalized.startsWith("{") && normalized.endsWith("}")) {
    return normalized;
  }

  const start = normalized.indexOf("{");
  const end = normalized.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容不是合法的项目 JSON。");
  }

  return normalized.slice(start, end + 1);
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseThinkingSteps(value: unknown): ThinkingStep[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => isObjectRecord(item) && typeof item.title === "string")
    .map((item, index) => ({
      id:
        typeof item.id === "string" && item.id.trim()
          ? item.id
          : `thinking-step-${Date.now()}-${index + 1}`,
      title: item.title as string,
      description: typeof item.description === "string" ? item.description : undefined,
      content: typeof item.content === "string" ? item.content : undefined,
      status:
        item.status === "pending" ||
        item.status === "loading" ||
        item.status === "success" ||
        item.status === "error"
          ? item.status
          : "success",
    }));
}

function parseFiles(value: unknown) {
  if (!isObjectRecord(value)) {
    throw new Error("AI 返回缺少有效的文件对象。");
  }

  const files = Object.entries(value).reduce<ProjectFileMap>((result, [key, content]) => {
    if (typeof content === "string") {
      result[key] = content;
    }
    return result;
  }, {});

  for (const fileName of REQUIRED_FILES) {
    if (!normalizeValue(files[fileName])) {
      throw new Error(`AI 返回缺少必需文件：${fileName}。`);
    }
  }

  return files;
}

function parseResultPayload(value: unknown): ParsedAIResult {
  if (!isObjectRecord(value)) {
    throw new Error("AI 返回的结构无效。");
  }

  const projectName = normalizeValue(typeof value.projectName === "string" ? value.projectName : "");
  const summary = normalizeValue(typeof value.summary === "string" ? value.summary : "");
  const assistantMessage = normalizeValue(
    typeof value.assistantMessage === "string" ? value.assistantMessage : "",
  );

  if (!projectName) {
    throw new Error("AI 返回缺少项目名称。");
  }

  if (!summary) {
    throw new Error("AI 返回缺少项目摘要。");
  }

  if (!assistantMessage) {
    throw new Error("AI 返回缺少面向用户的回复内容。");
  }

  return {
    projectName,
    summary,
    assistantMessage,
    files: parseFiles(value.files),
    thinkingSteps: parseThinkingSteps(value.thinkingSteps),
  };
}

function looksLikeProjectPayload(value: unknown) {
  return isObjectRecord(value) && "projectName" in value && "files" in value;
}

function parseProviderResponse(responseText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error("AI 服务返回了无法解析的响应。");
  }

  if (looksLikeProjectPayload(parsed)) {
    return parseResultPayload(parsed);
  }

  const response = parsed as ChatCompletionResponse;
  const messageText = extractResponseText(response.choices?.[0]?.message?.content);
  if (!messageText) {
    throw new Error(response.error?.message || "AI 服务没有返回可用内容。");
  }

  try {
    return parseResultPayload(JSON.parse(extractJsonText(messageText)));
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("AI 返回的内容不是合法的项目 JSON。");
  }
}

export function createOpenAICompatibleAIService(
  dependencies: OpenAICompatibleAIServiceDependencies = {},
): AIService {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const settingsService = dependencies.settingsService ?? defaultSettingsService;

  return {
    async generateProjectFromPrompt(prompt, project) {
      const normalizedPrompt = prompt.trim();
      if (!normalizedPrompt) {
        throw new Error("请输入要生成的页面需求。");
      }

      const config = ensureConfiguredSettings(settingsService);
      const endpoint = buildEndpoint(config.customBaseUrl);

      let responseText = "";
      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.preferredModel,
            temperature: 0.2,
            messages: [
              {
                role: "system",
                content: buildSystemPrompt(),
              },
              {
                role: "user",
                content: buildUserPrompt(normalizedPrompt, project),
              },
            ],
          }),
        });

        responseText = await response.text();

        if (!response.ok) {
          let detail = "";
          try {
            const parsed = JSON.parse(responseText) as ChatCompletionResponse;
            detail = parsed.error?.message ?? "";
          } catch {
            detail = stripMarkdownFences(responseText).slice(0, 240);
          }

          throw new Error(
            `AI 生成请求失败（${response.status}）${detail ? `：${detail}` : "。请检查模型、Base URL 或 API Key。"}`,
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error("AI 生成请求失败，请检查网络连接和服务配置。");
      }

      const result = parseProviderResponse(responseText);
      const createdAt = new Date().toISOString();

      return {
        projectName: result.projectName,
        summary: result.summary,
        files: result.files,
        messages: [
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: result.assistantMessage,
            createdAt,
            thinkingSteps: result.thinkingSteps,
            metadata: {
              provider: "openai-compatible",
              model: config.preferredModel,
            },
          },
        ],
        meta: {
          entry: "index.html",
          framework: "vanilla",
        },
      } satisfies GeneratedProjectPayload;
    },
  };
}
