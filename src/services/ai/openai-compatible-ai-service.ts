import { settingsService as defaultSettingsService } from "@/services/settings";
import type { SettingsService } from "@/services/settings/settings-service";
import type { GeneratedProjectPayload, Project, ProjectFileMap, ProjectGenerationProgress, ThinkingStep } from "@/types";
import type { AIService, ProjectGenerationOptions } from "./ai-service";

type FetchLike = typeof fetch;

type ChatCompletionMessage = {
  role?: string;
  content?: string | Array<{ type?: string; text?: string }>;
};

type ChatCompletionResponse = {
  choices?: Array<{
    delta?: ChatCompletionMessage;
    message?: ChatCompletionMessage;
    finish_reason?: string | null;
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
    "返回 JSON 时请保持字段顺序固定为：projectName、summary、assistantMessage、thinkingSteps、files。",
    "JSON 必须包含以下字段：",
    "projectName: 字符串，项目名称。",
    "summary: 字符串，简洁总结当前版本内容。",
    "assistantMessage: 字符串，面向用户的中文回复。",
    "thinkingSteps: 数组，可选，每项包含 title、description、content、status。",
    "files: 对象，且必须包含 index.html、style.css、main.js 三个字符串文件。",
    "thinkingSteps 请使用 2 到 4 个简短中文步骤，status 只允许 pending、loading、success、error。",
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

function extractThinkingAndPayload(value: string) {
  const normalized = stripMarkdownFences(value);
  const thinkingParts: string[] = [];
  const payloadParts: string[] = [];
  let cursor = 0;

  while (cursor < normalized.length) {
    const thinkStart = normalized.indexOf("<think>", cursor);
    if (thinkStart === -1) {
      payloadParts.push(normalized.slice(cursor));
      break;
    }

    payloadParts.push(normalized.slice(cursor, thinkStart));

    const contentStart = thinkStart + "<think>".length;
    const thinkEnd = normalized.indexOf("</think>", contentStart);
    if (thinkEnd === -1) {
      thinkingParts.push(normalized.slice(contentStart));
      cursor = normalized.length;
      break;
    }

    thinkingParts.push(normalized.slice(contentStart, thinkEnd));
    cursor = thinkEnd + "</think>".length;
  }

  return {
    thinkingText: thinkingParts.join("\n\n").trim(),
    payloadText: payloadParts.join("").trim(),
  };
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
          : `thinking-step-${index + 1}`,
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

function buildFallbackThinkingSteps(thinkingText: string, status: ThinkingStep["status"]): ThinkingStep[] {
  const normalized = thinkingText.trim();
  if (!normalized) {
    return [];
  }

  return [
    {
      id: "thinking-step-fallback",
      title: status === "loading" ? "思考中" : "推理过程",
      content: normalized,
      status,
    },
  ];
}

function parseProjectPayloadText(payloadText: string) {
  const { thinkingText, payloadText: jsonCandidate } = extractThinkingAndPayload(payloadText);
  const parsedResult = parseResultPayload(JSON.parse(extractJsonText(jsonCandidate || payloadText)));

  if (parsedResult.thinkingSteps.length === 0 && thinkingText) {
    return {
      ...parsedResult,
      thinkingSteps: buildFallbackThinkingSteps(thinkingText, "success"),
    };
  }

  return parsedResult;
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

function parseProviderResponseWithThinkingSupport(responseText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    return parseProjectPayloadText(responseText);
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
    return parseProjectPayloadText(messageText);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("AI 返回的内容不是合法的项目 JSON。");
  }
}

function buildRequestBody(prompt: string, project: Project | undefined, preferredModel: string, stream: boolean) {
  return {
    model: preferredModel,
    temperature: 0.2,
    stream,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: buildUserPrompt(prompt, project),
      },
    ],
  };
}

function buildGeneratedProjectPayload(result: ParsedAIResult, preferredModel: string): GeneratedProjectPayload {
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
          model: preferredModel,
        },
      },
    ],
    meta: {
      entry: "index.html",
      framework: "vanilla",
    },
  };
}

function emitProgress(options: ProjectGenerationOptions | undefined, progress: ProjectGenerationProgress) {
  options?.onProgress?.(progress);
}

function extractJsonStringField(source: string, fieldName: string) {
  const fieldIndex = source.indexOf(`"${fieldName}"`);
  if (fieldIndex === -1) {
    return "";
  }

  const colonIndex = source.indexOf(":", fieldIndex);
  if (colonIndex === -1) {
    return "";
  }

  let cursor = colonIndex + 1;
  while (cursor < source.length && /\s/.test(source[cursor] ?? "")) {
    cursor += 1;
  }

  if (source[cursor] !== "\"") {
    return "";
  }

  cursor += 1;
  let value = "";

  while (cursor < source.length) {
    const character = source[cursor];

    if (character === "\\") {
      const escaped = source[cursor + 1];
      if (!escaped) {
        break;
      }

      switch (escaped) {
        case "\"":
        case "\\":
        case "/":
          value += escaped;
          cursor += 2;
          continue;
        case "b":
          value += "\b";
          cursor += 2;
          continue;
        case "f":
          value += "\f";
          cursor += 2;
          continue;
        case "n":
          value += "\n";
          cursor += 2;
          continue;
        case "r":
          value += "\r";
          cursor += 2;
          continue;
        case "t":
          value += "\t";
          cursor += 2;
          continue;
        case "u": {
          const unicodeSequence = source.slice(cursor + 2, cursor + 6);
          if (unicodeSequence.length < 4 || !/^[0-9a-fA-F]{4}$/.test(unicodeSequence)) {
            return value;
          }

          value += String.fromCharCode(Number.parseInt(unicodeSequence, 16));
          cursor += 6;
          continue;
        }
        default:
          value += escaped;
          cursor += 2;
          continue;
      }
    }

    if (character === "\"") {
      return value;
    }

    value += character;
    cursor += 1;
  }

  return value;
}

function extractStreamingThinkingSteps(source: string) {
  const fieldIndex = source.indexOf("\"thinkingSteps\"");
  if (fieldIndex === -1) {
    return [];
  }

  const colonIndex = source.indexOf(":", fieldIndex);
  if (colonIndex === -1) {
    return [];
  }

  const arrayIndex = source.indexOf("[", colonIndex);
  if (arrayIndex === -1) {
    return [];
  }

  const objectTexts: string[] = [];
  let arrayClosed = false;
  let objectStart = -1;
  let objectDepth = 0;
  let inString = false;
  let escaping = false;

  for (let index = arrayIndex + 1; index < source.length; index += 1) {
    const character = source[index];

    if (inString) {
      if (escaping) {
        escaping = false;
      } else if (character === "\\") {
        escaping = true;
      } else if (character === "\"") {
        inString = false;
      }
      continue;
    }

    if (character === "\"") {
      inString = true;
      continue;
    }

    if (character === "{") {
      if (objectDepth === 0) {
        objectStart = index;
      }
      objectDepth += 1;
      continue;
    }

    if (character === "}") {
      if (objectDepth > 0) {
        objectDepth -= 1;
        if (objectDepth === 0 && objectStart !== -1) {
          objectTexts.push(source.slice(objectStart, index + 1));
          objectStart = -1;
        }
      }
      continue;
    }

    if (character === "]" && objectDepth === 0) {
      arrayClosed = true;
      break;
    }
  }

  const steps = objectTexts.flatMap((stepText, index) => {
    try {
      return parseThinkingSteps([
        {
          id: `thinking-step-${index + 1}`,
          ...(JSON.parse(stepText) as Record<string, unknown>),
        },
      ]);
    } catch {
      return [];
    }
  });

  if (!arrayClosed && steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    if (lastStep && lastStep.status !== "error") {
      steps[steps.length - 1] = {
        ...lastStep,
        status: "loading",
      };
    }
  }

  return steps;
}

function deriveStreamingProgress(rawJsonText: string) {
  return {
    content: extractJsonStringField(rawJsonText, "assistantMessage"),
    thinkingSteps: extractStreamingThinkingSteps(rawJsonText),
  };
}

function deriveStreamingProgressWithThinkingSupport(rawStreamText: string) {
  const { thinkingText, payloadText } = extractThinkingAndPayload(rawStreamText);
  const thinkingSteps = extractStreamingThinkingSteps(payloadText);

  return {
    content: extractJsonStringField(payloadText, "assistantMessage"),
    thinkingSteps:
      thinkingSteps.length > 0 ? thinkingSteps : buildFallbackThinkingSteps(thinkingText, "loading"),
  };
}

function extractStreamContent(response: ChatCompletionResponse) {
  const choice = response.choices?.[0];
  if (!choice) {
    return "";
  }

  return extractResponseText(choice.delta?.content ?? choice.message?.content);
}

function formatUpstreamError(status: number, responseText: string) {
  let detail = "";
  try {
    const parsed = JSON.parse(responseText) as ChatCompletionResponse;
    detail = parsed.error?.message ?? "";
  } catch {
    detail = stripMarkdownFences(responseText).slice(0, 240);
  }

  return `AI 生成请求失败：${status}${detail ? `，${detail}` : "。请检查模型、Base URL 或 API Key。"} `;
}

async function parseStreamingProviderResponse(
  response: Response,
  options: ProjectGenerationOptions | undefined,
) {
  const reader = response.body?.getReader();
  if (!reader) {
    const responseText = await response.text();
    const result = parseProviderResponseWithThinkingSupport(responseText);
    emitProgress(options, {
      status: "streaming",
      content: result.assistantMessage,
      thinkingSteps: result.thinkingSteps,
    });
    return result;
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let rawJsonText = "";
  let lastSignature = "";

  const publishProgress = () => {
    const progress = deriveStreamingProgressWithThinkingSupport(rawJsonText);
    const signature = `${progress.content}::${JSON.stringify(progress.thinkingSteps)}`;
    if (signature === lastSignature) {
      return;
    }

    lastSignature = signature;
    emitProgress(options, {
      status: "streaming",
      content: progress.content,
      thinkingSteps: progress.thinkingSteps,
    });
  };

  const consumeEventBlock = (eventBlock: string) => {
    const trimmedBlock = eventBlock.trim();
    if (!trimmedBlock) {
      return;
    }

    const dataLines = trimmedBlock
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart());

    const payloadText = dataLines.length > 0 ? dataLines.join("\n") : trimmedBlock;
    if (!payloadText || payloadText === "[DONE]") {
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payloadText);
    } catch {
      return;
    }

    const responsePayload = parsed as ChatCompletionResponse;
    if (responsePayload.error?.message) {
      throw new Error(responsePayload.error.message);
    }

    const contentChunk = extractStreamContent(responsePayload);
    if (!contentChunk) {
      return;
    }

    rawJsonText += contentChunk;
    publishProgress();
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value ?? new Uint8Array(), { stream: !done });
    buffer = buffer.replace(/\r\n/g, "\n");

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const eventBlock = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      consumeEventBlock(eventBlock);
      separatorIndex = buffer.indexOf("\n\n");
    }

    if (done) {
      break;
    }
  }

  const trailingBuffer = buffer.trim();
  if (trailingBuffer) {
    consumeEventBlock(trailingBuffer);
  }

  if (!rawJsonText && trailingBuffer) {
    const result = parseProviderResponseWithThinkingSupport(trailingBuffer);
    emitProgress(options, {
      status: "streaming",
      content: result.assistantMessage,
      thinkingSteps: result.thinkingSteps,
    });
    return result;
  }

  const result = parseProviderResponseWithThinkingSupport(rawJsonText);
  emitProgress(options, {
    status: "streaming",
    content: result.assistantMessage,
    thinkingSteps: result.thinkingSteps,
  });
  return result;
}

export function createOpenAICompatibleAIService(
  dependencies: OpenAICompatibleAIServiceDependencies = {},
): AIService {
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const settingsService = dependencies.settingsService ?? defaultSettingsService;

  return {
    async generateProjectFromPrompt(prompt, project, options) {
      const normalizedPrompt = prompt.trim();
      if (!normalizedPrompt) {
        throw new Error("请输入要生成的页面需求。");
      }

      const config = ensureConfiguredSettings(settingsService);
      const endpoint = buildEndpoint(config.customBaseUrl);
      const shouldStream = typeof options?.onProgress === "function";

      try {
        const response = await fetchImpl(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify(buildRequestBody(normalizedPrompt, project, config.preferredModel, shouldStream)),
        });

        if (!response.ok) {
          const responseText = await response.text();
          throw new Error(formatUpstreamError(response.status, responseText));
        }

        if (shouldStream) {
          const streamedResult = await parseStreamingProviderResponse(response, options);
          return buildGeneratedProjectPayload(streamedResult, config.preferredModel);
        }

        const responseText = await response.text();
        const result = parseProviderResponseWithThinkingSupport(responseText);
        return buildGeneratedProjectPayload(result, config.preferredModel);
      } catch (error) {
        if (error instanceof Error) {
          emitProgress(options, {
            status: "failed",
            content: "",
            thinkingSteps: [],
            error: error.message,
          });
          throw error;
        }

        emitProgress(options, {
          status: "failed",
          content: "",
          thinkingSteps: [],
          error: "AI 生成请求失败，请检查网络连接和服务配置。",
        });
        throw new Error("AI 生成请求失败，请检查网络连接和服务配置。");
      }
    },
  };
}

