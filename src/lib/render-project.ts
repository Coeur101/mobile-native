import type { ProjectFileMap } from "@/types";

function injectStyles(html: string, styles: string): string {
  if (html.includes("</head>")) {
    return html.replace("</head>", `<style>${styles}</style></head>`);
  }
  return `<style>${styles}</style>${html}`;
}

function injectScript(html: string, script: string): string {
  if (!script.trim()) {
    return html;
  }

  if (html.includes("</body>")) {
    return html.replace("</body>", `<script>${script}</script></body>`);
  }

  return `${html}<script>${script}</script>`;
}

export function buildPreviewDocument(files: ProjectFileMap): string {
  const html = files["index.html"] ?? "<div id=\"app\"></div>";
  const styled = injectStyles(html, files["style.css"] ?? "");
  return injectScript(styled, files["main.js"] ?? "");
}
