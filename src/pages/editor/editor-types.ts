import type { ProjectGenerationStatus, ThinkingStep } from "@/types";

export interface EditorRouteState {
  initialPrompt?: string;
}

export interface PendingUserMessage {
  content: string;
  createdAt: string;
}

export interface DraftAssistantState {
  startedAt: string;
  progress: import("@/types").ProjectGenerationProgress;
}

export function getGenerationLabel(status: ProjectGenerationStatus) {
  switch (status) {
    case "streaming":
      return "流式生成中";
    case "persisting":
      return "正在保存结果";
    case "failed":
      return "生成失败";
    case "completed":
      return "已完成";
    default:
      return "待开始";
  }
}

export function getGenerationSummary(status: ProjectGenerationStatus, error?: string) {
  switch (status) {
    case "streaming":
      return "AI 正在逐步生成回复和思路。";
    case "persisting":
      return "已拿到完整结果，正在写入项目记录。";
    case "failed":
      return error ?? "这次生成失败了，你可以调整需求后重试。";
    case "completed":
      return "本次生成已完成。";
    default:
      return "准备开始新的生成会话。";
  }
}

export function mergeThinkingSteps(current: ThinkingStep[], incoming: ThinkingStep[]) {
  return incoming.length > 0 ? incoming : current;
}
