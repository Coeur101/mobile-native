import { useEffect, useRef } from "react";
import hljs from "highlight.js/lib/core";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import html from "highlight.js/lib/languages/xml";

hljs.registerLanguage("html", html);
hljs.registerLanguage("xml", html);
hljs.registerLanguage("css", css);
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);

const fileLanguageMap: Record<string, string> = {
  "index.html": "html",
  "style.css": "css",
  "main.js": "javascript",
};

interface CodeBlockProps {
  code: string;
  fileName: string;
  showLineNumbers?: boolean;
}

export const CodeBlock = ({ code, fileName, showLineNumbers = true }: CodeBlockProps) => {
  const codeRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!codeRef.current) {
      return;
    }

    codeRef.current.removeAttribute("data-highlighted");
    codeRef.current.textContent = code;
    hljs.highlightElement(codeRef.current);
  }, [code, fileName]);

  const language = fileLanguageMap[fileName] ?? "plaintext";
  const lines = code.split("\n");

  return (
    <div className="relative overflow-auto text-xs leading-6 text-white/92">
      {showLineNumbers ? (
        <div className="absolute left-0 top-0 flex flex-col select-none border-r border-white/8 px-3 py-4 text-right text-white/28">
          {lines.map((_, index) => (
            <span key={index}>{index + 1}</span>
          ))}
        </div>
      ) : null}
      <pre className={`p-4 ${showLineNumbers ? "pl-14" : ""}`}>
        <code ref={codeRef} className={`language-${language}`}>
          {code}
        </code>
      </pre>
    </div>
  );
};
