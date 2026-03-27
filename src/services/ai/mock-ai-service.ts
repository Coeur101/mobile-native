import type { AIService } from "./ai-service";
import type { GeneratedProjectPayload, Project, ProjectFileMap, ThinkingStep } from "@/types";

function deriveProjectName(value: string) {
  const trimmed = value.trim().slice(0, 20);
  return trimmed || "演示项目";
}

function buildFiles(prompt: string, project?: Project): ProjectFileMap {
  const title = prompt.slice(0, 24) || "演示页面";
  const existingStyles = project?.files["style.css"] ?? "";

  return {
    "index.html": `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <main class="shell">
      <section class="hero">
        <span class="badge">AI 演示生成</span>
        <h1>${title}</h1>
        <p>${prompt}</p>
        <button id="actionButton">添加一个演示事项</button>
      </section>
      <section class="panel">
        <h2>当前能力</h2>
        <ul id="list">
          <li>结构化页面文件输出</li>
          <li>版本快照与历史恢复</li>
          <li>支持继续补充需求并迭代页面</li>
        </ul>
      </section>
    </main>
  </body>
</html>`,
    "style.css": `.shell {
  min-height: 100vh;
  padding: 32px 20px 48px;
  background:
    radial-gradient(circle at top right, rgba(20, 184, 166, 0.12), transparent 34%),
    linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  color: #0f172a;
  font-family: "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
}
.hero,
.panel {
  max-width: 720px;
  margin: 0 auto 18px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(148, 163, 184, 0.18);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(18px);
  padding: 24px;
}
.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  background: #0f172a;
  color: white;
  padding: 6px 10px;
  font-size: 12px;
}
h1 {
  margin: 16px 0 12px;
  font-size: clamp(32px, 7vw, 48px);
  line-height: 1.05;
}
h2 {
  margin: 0 0 12px;
  font-size: 20px;
}
p,
li {
  color: #475569;
  line-height: 1.7;
}
button {
  margin-top: 18px;
  border: 0;
  border-radius: 999px;
  background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 100%);
  color: white;
  padding: 12px 18px;
  cursor: pointer;
}
ul {
  margin: 0;
  padding-left: 18px;
}
${existingStyles}`.trim(),
    "main.js": `const list = document.getElementById("list");
const button = document.getElementById("actionButton");

if (button && list) {
  button.addEventListener("click", () => {
    const item = document.createElement("li");
    item.textContent = "新增演示事项：${title}";
    list.appendChild(item);
  });
}`,
  };
}

function buildThinkingSteps(prompt: string, isUpdate: boolean): ThinkingStep[] {
  const now = Date.now();
  const keywords = prompt
    .split(/[，。；、\s]+/)
    .filter(Boolean)
    .slice(0, 5)
    .join("、");

  return [
    {
      id: `step-${now}-1`,
      title: "理解需求",
      description: `分析输入内容：${prompt.slice(0, 30)}${prompt.length > 30 ? "..." : ""}`,
      status: "success",
      content: `当前目标是${isUpdate ? "继续完善现有项目" : "创建一个新项目"}，识别到的重点包括：${keywords || "页面结构、视觉层次、基础交互"}。`,
    },
    {
      id: `step-${now}-2`,
      title: "设计页面结构",
      description: "确定页面层级、主要区块与视觉风格。",
      status: "success",
      content: "采用单页结构，包含主视觉区域、说明区块和基础交互入口，并默认兼容移动端展示。",
    },
    {
      id: `step-${now}-3`,
      title: "生成项目文件",
      description: isUpdate ? "基于现有文件做增量更新。" : "生成 HTML、CSS 和 JS 文件。",
      status: "success",
      content: "输出 index.html、style.css、main.js 三个核心文件，便于直接预览和继续编辑。",
    },
    {
      id: `step-${now}-4`,
      title: "检查可用性",
      description: "确认结构完整、样式可读、交互可运行。",
      status: "success",
      content: "已保留基础按钮交互和演示列表，方便继续追加需求。",
    },
    {
      id: `step-${now}-5`,
      title: "准备继续迭代",
      description: "当前版本已经可以进入预览或继续补充需求。",
      status: "success",
      content: "你可以继续描述布局、配色、模块或交互要求，我会在当前项目上继续生成。",
    },
  ];
}

export const mockAIService: AIService = {
  async generateProjectFromPrompt(prompt, project) {
    const createdAt = new Date().toISOString();
    const files = buildFiles(prompt, project);
    const isUpdate = Boolean(project);
    const thinkingSteps = buildThinkingSteps(prompt, isUpdate);

    const messages: GeneratedProjectPayload["messages"] = [
      {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: isUpdate
          ? "已根据你的新需求更新项目文件。你可以先预览效果，或继续补充想修改的部分。"
          : "已根据你的描述生成首版项目文件，包含页面结构、样式和基础交互。你可以直接预览，或继续细化需求。",
        createdAt,
        thinkingSteps,
        metadata: {
          provider: "mock-ai",
        },
      },
    ];

    return {
      projectName: deriveProjectName(prompt),
      summary: prompt,
      files,
      messages,
      meta: {
        entry: "index.html",
        framework: "vanilla",
      },
    };
  },
};
