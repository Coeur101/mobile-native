import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileCode2, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/ui/page-transition";
import { buildPreviewDocument } from "@/lib/render-project";
import { mockProjectService } from "@/services/project/mock-project-service";
import { buttonTap } from "@/lib/animations";
import type { Project } from "@/types";

export function PreviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [mode, setMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    async function loadProject() {
      if (!projectId) return;
      const nextProject = await mockProjectService.getProjectById(projectId);
      setProject(nextProject);
    }
    void loadProject();
  }, [projectId]);

  const previewDocument = useMemo(() => buildPreviewDocument(project?.files ?? {}), [project]);

  const handleExport = () => {
    if (!project) return;
    const blob = new Blob([previewDocument], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.name || "project"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!project) return null;

  return (
    <PageTransition className="flex min-h-screen flex-col bg-[#0C0A09] text-white">
      {/* Header — 纯图标 */}
      <header className="border-b border-white/8 bg-[#0C0A09]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate(-1)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              title="返回"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <h1 className="text-sm font-semibold text-white">{project.name}</h1>
          </div>

          <div className="flex items-center gap-1.5">
            {/* 模式切换 — 图标按钮组 */}
            <div className="flex items-center rounded-full border border-white/10 bg-white/5 p-1">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                  mode === "preview" ? "bg-white text-[#0C0A09] shadow-sm" : "text-white/60 hover:text-white"
                }`}
                title="预览"
              >
                <MonitorSmartphone className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setMode("code")}
                className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
                  mode === "code" ? "bg-white text-[#0C0A09] shadow-sm" : "text-white/60 hover:text-white"
                }`}
                title="代码"
              >
                <FileCode2 className="h-4 w-4" />
              </button>
            </div>

            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={handleExport}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              title="导出 HTML"
            >
              <Download className="h-4 w-4" />
            </motion.button>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {mode === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <iframe
                title="project-preview"
                srcDoc={previewDocument}
                className="h-[calc(100vh-7rem)] w-full rounded-[28px] border border-white/10 bg-white"
                sandbox="allow-scripts allow-same-origin"
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid h-[calc(100vh-7rem)] gap-4 overflow-auto rounded-[28px] border border-white/10 bg-[#1C1917] p-6 lg:grid-cols-3"
            >
              {Object.entries(project.files).map(([fileName, content]) => (
                <section
                  key={fileName}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C0A09]"
                >
                  <header className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">
                    <FileCode2 className="mr-2 inline-block h-3.5 w-3.5 text-[#A78BFA]" />
                    {fileName}
                  </header>
                  <pre className="overflow-auto p-4 text-xs leading-6 text-white/70">
                    <code>{content}</code>
                  </pre>
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
