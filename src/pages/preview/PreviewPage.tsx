import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileCode2, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PageTransition } from "@/components/ui/page-transition";
import { buildPreviewDocument } from "@/lib/render-project";
import { mockProjectService } from "@/services/project/mock-project-service";
import {
  EASE_SMOOTH,
  STAGGER_DELAY,
  buttonTap,
} from "@/lib/animations";
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
    <PageTransition className="flex min-h-screen flex-col bg-[#0C0A09] text-white">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_SMOOTH }}
        className="border-b border-white/8 bg-[#0C0A09]/90 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate(-1)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/40">Preview</p>
              <h1 className="text-lg font-semibold text-white">{project.name}</h1>
            </div>
          </div>

          {/* 模式切换 — 滑动指示器 */}
          <div className="flex items-center gap-2">
            <div className="relative flex items-center rounded-2xl border border-white/10 bg-white/5 p-1">
              {/* 滑动背景指示器 */}
              <motion.div
                className="absolute inset-y-1 rounded-xl bg-white"
                layout
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                style={{
                  left: mode === "preview" ? "4px" : "50%",
                  width: "calc(50% - 4px)",
                }}
              />
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`relative z-10 inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
                  mode === "preview" ? "text-[#0C0A09]" : "text-white/70"
                }`}
              >
                <MonitorSmartphone className="h-4 w-4" />
                预览
              </button>
              <button
                type="button"
                onClick={() => setMode("code")}
                className={`relative z-10 inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition ${
                  mode === "code" ? "text-[#0C0A09]" : "text-white/70"
                }`}
              >
                <FileCode2 className="h-4 w-4" />
                代码
              </button>
            </div>

            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={handleExport}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Download className="h-4 w-4" />
              导出
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* 内容区 */}
      <main className="flex-1 p-4">
        <AnimatePresence mode="wait">
          {mode === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE_SMOOTH }}
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
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, ease: EASE_SMOOTH }}
              className="grid h-[calc(100vh-7rem)] gap-4 overflow-auto rounded-[28px] border border-white/10 bg-[#1C1917] p-6 lg:grid-cols-3"
            >
              {Object.entries(project.files).map(([fileName, content], index) => (
                <motion.section
                  key={fileName}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * STAGGER_DELAY, duration: 0.3, ease: EASE_SMOOTH }}
                  className="overflow-hidden rounded-3xl border border-white/10 bg-[#0C0A09]"
                >
                  <header className="border-b border-white/10 px-4 py-3 text-sm font-medium text-white">
                    <FileCode2 className="mr-2 inline-block h-3.5 w-3.5 text-[#A78BFA]" />
                    {fileName}
                  </header>
                  <pre className="overflow-auto p-4 text-xs leading-6 text-white/70">
                    <code>{content}</code>
                  </pre>
                </motion.section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
