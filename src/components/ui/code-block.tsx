import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import html from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";

// 注册需要的语言
hljs.registerLanguage("html", html);
hljs.registerLanguage("xml", html);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);

// 文件名到语言的映射
const fileLanguageMap: Record<string, string> = {
  "index.html": "html",
  "style.css": "css",
  "main.js": "javascript",
};

interface CodeBlockProps {
  code: string;
  fileName: string;
  /** 是否显示行号，默认 true */
  showLineNumbers?: boolean;
}

export const CodeBlock = ({ code, fileName, showLineNumbers = true }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (codeRef.current) {
      // 先清除之前的高亮
      codeRef.current.removeAttribute("data-highlighted");
      codeRef.current.textContent = code;
      hljs.highlightElement(codeRef.current);
    }
  }, [code, fileName]);

  const language = fileLanguageMap[fileName] ?? "plaintext";
  const lines = code.split("\n");

  return (
    <div className="relative overflow-auto text-xs leading-6">
      {showLineNumbers && (
        <div className="absolute left-0 top-0 flex flex-col select-none border-r border-white/5 px-3 py-4 text-right text-white/20">
          {lines.map((_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
      )}
      <pre className={`p-4 ${showLineNumbers ? "pl-14" : ""}`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};
