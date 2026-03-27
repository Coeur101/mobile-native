export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "todo",
    label: "待办清单",
    prompt: "生成一个极简待办清单网页，支持新增、完成和删除任务，并带有柔和的交互动效。",
  },
  {
    id: "timer",
    label: "番茄时钟",
    prompt: "生成一个番茄时钟网页，包含专注与休息模式、进度条和大号倒计时。",
  },
  {
    id: "landing",
    label: "产品落地页",
    prompt: "生成一个科技感产品落地页，需要有标题、卖点、行动按钮和移动端适配。",
  },
  {
    id: "weather",
    label: "天气卡片",
    prompt: "生成一个毛玻璃风格天气卡片网页，展示当前天气和未来三天的简要信息。",
  },
];
