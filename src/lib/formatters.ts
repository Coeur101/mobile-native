import type { Project } from "@/types";

/**
 * 从用户名或邮箱中提取最多两个字符的大写缩写，用于头像占位。
 */
export function getDisplayInitials(name: string, fallback = "用户") {
  const source = name.trim();
  if (!source) {
    return fallback;
  }

  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

/**
 * 格式化项目的更新时间和对话数量摘要。
 */
export function formatProjectMeta(project: Project) {
  const updatedAt = new Date(project.updatedAt);
  const now = new Date();
  const isToday =
    updatedAt.getFullYear() === now.getFullYear() &&
    updatedAt.getMonth() === now.getMonth() &&
    updatedAt.getDate() === now.getDate();

  return `${isToday ? "今天" : updatedAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · ${project.messages.length} 条对话`;
}

/**
 * 格式化对话元信息（更新日期 + 对话数量），无项目时返回默认提示。
 */
export function formatConversationMeta(project: Project | null) {
  if (!project) {
    return "从一句需求开始";
  }

  return formatProjectMeta(project);
}

/**
 * 将 ISO 时间字符串格式化为 HH:MM 形式。
 */
export function formatMessageTime(value: string) {
  return new Date(value).toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
