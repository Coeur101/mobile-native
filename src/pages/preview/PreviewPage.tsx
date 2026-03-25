import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileCode2, MonitorSmartphone } from "lucide-react";
import { buildPreviewDocument } from "@/lib/render-project";
import { mockProjectService } from "@/services/project/mock-project-service";
import type { Project } from "@/types";

export function PreviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [mode, setMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        return;
      }
      const nextProject = await mockProjectService.getProjectById(projectId);
      setProject(nextProject);
    }

    void loadProject();
  }, [projectId]);

  const previewDocument = useMemo(() => buildPreviewDocument(project?.files ?? {}), [project]);

  const handleExport = () => {
    if (!project) {
      return;
    }
    const blob = new Blob([previewDocument], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "project"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!project) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Preview</p>
              <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode("preview")}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition ${
                mode === "preview" ? "bg-white text-slate-900" : "border border-white/10 bg-white/5 text-white"
              }`}
            >
              <MonitorSmartphone className="h-4 w-4" />
              预览
            </button>
            <button
              type="button"
              onClick={() => setMode("code")}
              className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-medium transition ${
                mode === "code" ? "bg-white text-slate-900" : "border border-white/10 bg-white/5 text-white"
              }`}
            >
              <FileCode2 className="h-4 w-4" />
              代码
            </button>
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              导出 HTML
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        {mode === "preview" ? (
          <iframe
            title="project-preview"
            srcDoc={previewDocument}
            className="h-[calc(100vh-7rem)] w-full rounded-[28px] border border-white/10 bg-white"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="grid h-[calc(100vh-7rem)] gap-4 overflow-auto rounded-[28px] border border-white/10 bg-slate-900 p-6 lg:grid-cols-3">
            {Object.entries(project.files).map(([fileName, content]) => (
              <section key={fileName} className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950">
                <header className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">
                  {fileName}
                </header>
                <pre className="overflow-auto p-4 text-xs leading-6 text-slate-300">
                  <code>{content}</code>
                </pre>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
