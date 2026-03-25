import type { AIService } from "./ai-service";
import type { GeneratedProjectPayload, Project, ProjectFileMap, ProjectMessage } from "@/types";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24) || "demo-project";
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

export const mockAIService: AIService = {
  async generateProjectFromPrompt(prompt, project) {
    const createdAt = new Date().toISOString();
    const files = buildFiles(prompt, project);
    const messages: ProjectMessage[] = [
      {
        id: `${Date.now()}-assistant`,
        role: "assistant",
        content: "已根据你的描述生成结构化项目文件。当前为演示模式，后续可以替换为真实 AI 输出。",
        createdAt,
        metadata: {
          provider: "mock-ai",
        },
      },
    ];

    const payload: GeneratedProjectPayload = {
      projectName: slugify(prompt),
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
