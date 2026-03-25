import type { AIService } from "./ai-service";
import type { GeneratedProjectPayload, Project, ProjectFileMap, ProjectMessage, ThinkingStep } from "@/types";

/** 从用户提示词中提取简短项目名称（保留中文原文） */
function deriveProjectName(value: string) {
  const trimmed = value.trim().slice(0, 20);
  return trimmed || "演示项目";
}

function buildFiles(prompt: string, project?: Project): ProjectFileMap {
  const title = prompt.slice(0, 24);
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
        <span class="badge">Mock AI 生成</span>
        <h1>${title}</h1>
        <p>${prompt}</p>
        <button id="actionButton">添加一个演示事项</button>
      </section>
      <section class="panel">
        <h2>当前能力</h2>
        <ul id="list">
          <li>结构化文件预览</li>
          <li>本地版本快照</li>
          <li>后续可接入真实 AI 与 Supabase</li>
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
  font-family: "Segoe UI", "PingFang SC", sans-serif;
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
    item.textContent = "来自演示模式的新事项：${title}";
    list.appendChild(item);
  });
}`,
  };
}

/** 生成 mock 思维链步骤 */
function buildThinkingSteps(prompt: string, isUpdate: boolean): ThinkingStep[] {
  const now = Date.now();
  const steps: ThinkingStep[] = [
    {
      id: `step-${now}-1`,
      title: "理解需求",
      description: `分析用户输入: "${prompt.slice(0, 30)}${prompt.length > 30 ? "..." : ""}"`,
      status: "success",
      content: `用户希望${isUpdate ? "更新现有项目" : "创建一个新项目"}。\n关键词提取: ${prompt.split(/[，,。.！!？?\s]+/).filter(Boolean).slice(0, 5).join("、")}`,
    },
    {
      id: `step-${now}-2`,
      title: "设计方案",
      description: "确定技术栈与页面结构",
      status: "success",
      content: "技术栈: HTML5 + CSS3 + Vanilla JS\n布局方案: 响应式单页，移动端优先\n视觉风格: 毛玻璃卡片 + 渐变背景",
    },
    {
      id: `step-${now}-3`,
      title: "生成代码",
      description: isUpdate ? "基于现有文件增量更新" : "生成 index.html / style.css / main.js",
      status: "success",
      content: "生成文件清单:\n- index.html (页面结构)\n- style.css (样式与动画)\n- main.js (交互逻辑)",
    },
    {
      id: `step-${now}-4`,
      title: "质量检查",
      description: "验证代码规范与浏览器兼容性",
      status: "success",
    },
    {
      id: `step-${now}-5`,
      title: "部署就绪",
      description: "项目文件已准备完毕，可预览",
      status: "success",
    },
  ];

  return steps;
}

export const mockAIService: AIService = {
  async generateProjectFromPrompt(prompt, project) {
    const createdAt = new Date().toISOString();
    const files = buildFiles(prompt, project);
    const isUpdate = !!project;
    const thinkingSteps = buildThinkingSteps(prompt, isUpdate);

    const messages: ProjectMessage[] = [
      {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: isUpdate
          ? "已根据你的新需求更新了项目文件。你可以在预览中查看效果，或继续描述新的修改。"
          : "已根据你的描述生成结构化项目文件，包含 HTML 页面、CSS 样式和 JS 交互。你可以预览效果或继续优化。",
        createdAt,
        thinkingSteps,
        metadata: {
          provider: "mock-ai",
        },
      },
    ];

    const payload: GeneratedProjectPayload = {
      projectName: deriveProjectName(prompt),
      summary: prompt,
      files,
      messages,
      meta: {
        entry: "index.html",
        framework: "vanilla",
      },
    };

    return payload;
  },
};
