import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileCode2, MonitorSmartphone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { CodeBlock } from "@/components/ui/code-block";
import { buildPreviewDocument } from "@/lib/render-project";
import { projectService } from "@/services/project";
import { buttonTap } from "@/lib/animations";
import type { Project } from "@/types";

export function PreviewPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mode, setMode] = useState<"preview" | "code">("preview");

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setIsLoadingProject(false);
        return;
      }
      setIsLoadingProject(true);
      setLoadError(null);
      try {
        const nextProject = await projectService.getProjectById(projectId);
        setProject(nextProject);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unable to load project preview.";
        toast.error(message);
        setLoadError(message);
        setProject(null);
      } finally {
        setIsLoadingProject(false);
      }
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

  if (isLoadingProject) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center bg-[#0C0A09] px-6 text-white">
        <div className="text-center">
          <p className="text-sm text-white/70">Loading project preview...</p>
        </div>
      </PageTransition>
    );
  }

  if (loadError) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center bg-[#0C0A09] px-6 text-white">
        <div
          data-testid="preview-load-error"
          className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 text-center"
        >
          <h1 className="text-xl font-semibold text-white">Unable to load preview</h1>
          <p className="mt-2 text-sm text-white/70">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0C0A09]"
          >
            Back to Projects
          </button>
        </div>
      </PageTransition>
    );
  }

  if (!project) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center bg-[#0C0A09] px-6 text-white">
        <div
          data-testid="preview-project-missing"
          className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 p-8 text-center"
        >
          <h1 className="text-xl font-semibold text-white">Project not found</h1>
          <p className="mt-2 text-sm text-white/70">
            The requested preview is not available for the current account.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#0C0A09]"
          >
            Back to Projects
          </button>
        </div>
      </PageTransition>
    );
  }

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
                sandbox="allow-scripts"
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
                  <CodeBlock code={content} fileName={fileName} />
                </section>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
