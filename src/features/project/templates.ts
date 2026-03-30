export interface PromptTemplate {
  id: string;
  label: string;
  description: string;
  prompt: string;
}

export const promptTemplates: PromptTemplate[] = [
  {
    id: "minesweeper",
    label: "扫雷游戏",
    description: "生成一个扫雷游戏，包含初中高三档难度、计时器和剩余雷数。",
    prompt:
      "生成一个简洁耐看的扫雷网页应用，包含初级、中级、高级三档难度，支持计时器、剩余雷数显示、重新开始按钮和移动端适配。",
  },
  {
    id: "sudoku",
    label: "数独游戏",
    description: "生成一个数独游戏，支持题目生成、草稿模式和错误提示。",
    prompt:
      "生成一个原生 App 风格的数独网页应用，支持新题生成、笔记模式、错误高亮、计时和完成反馈，并兼容手机屏幕。",
  },
  {
    id: "pomodoro",
    label: "番茄钟应用",
    description: "生成一个极简番茄钟应用，包含专注、短休息和长休息模式。",
    prompt:
      "生成一个极简且像原生 App 的番茄钟网页应用，支持专注、短休息、长休息三种模式，带倒计时、进度环、开始暂停和历史统计。",
  },
  {
    id: "weather",
    label: "天气卡片",
    description: "生成一个毛玻璃天气卡片，展示当前天气和未来三天概览。",
    prompt:
      "生成一个简洁的天气卡片网页，展示当前温度、天气图标、空气质量和未来三天预报，整体风格接近 iOS 原生天气组件。",
  },
];
