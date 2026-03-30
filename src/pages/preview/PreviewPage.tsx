import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Download, FileCode2, MonitorSmartphone } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/ui/code-block";
import { PageTransition } from "@/components/ui/page-transition";
import { buttonTap } from "@/lib/animations";
import { buildPreviewDocument } from "@/lib/render-project";
import { projectService } from "@/services/project";
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
        setProject(await projectService.getProjectById(projectId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "加载预览失败。";
        setLoadError(message);
        setProject(null);
        toast.error(message);
      } finally {
        setIsLoadingProject(false);
      }
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
    link.download = `${project.name || "项目预览"}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (isLoadingProject) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <div className="rounded-[30px] border border-border bg-card/90 px-8 py-10 text-center shadow-[var(--shadow-card)]">
          <p className="text-sm text-muted-foreground">正在加载项目预览…</p>
        </div>
      </PageTransition>
    );
  }

  if (loadError) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <div
          data-testid="preview-load-error"
          className="w-full max-w-md rounded-[32px] border border-destructive/18 bg-card/92 p-8 text-center shadow-[var(--shadow-card)]"
        >
          <h1 className="text-[1.5rem] font-semibold text-foreground">加载预览失败</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground"
          >
            返回项目列表
          </button>
        </div>
      </PageTransition>
    );
  }

  if (!project) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <div
          data-testid="preview-project-missing"
          className="w-full max-w-md rounded-[32px] border border-border bg-card/92 p-8 text-center shadow-[var(--shadow-card)]"
        >
          <h1 className="text-[1.5rem] font-semibold text-foreground">项目不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground">当前账号下没有可用的预览内容。</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground"
          >
            返回项目列表
          </button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/82 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/90 text-foreground shadow-[var(--shadow-panel)]"
              title="返回"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
                Live preview
              </div>
              <h1 className="truncate text-[1.1rem] font-semibold text-foreground">{project.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-full border border-border bg-card/90 p-1 shadow-[var(--shadow-panel)]">
              <button
                type="button"
                onClick={() => setMode("preview")}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors ${
                  mode === "preview"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="预览模式"
              >
                <MonitorSmartphone className="h-4 w-4" />
                <span className="hidden sm:inline">预览</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("code")}
                className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors ${
                  mode === "code"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="代码模式"
              >
                <FileCode2 className="h-4 w-4" />
                <span className="hidden sm:inline">代码</span>
              </button>
            </div>

            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={handleExport}
              className="flex h-11 items-center gap-2 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-[0_12px_30px_rgba(0,113,227,0.22)]"
              title="导出 HTML"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">导出</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <AnimatePresence mode="wait">
          {mode === "preview" ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-[34px] border border-border bg-card/88 p-4 shadow-[var(--shadow-card)]"
            >
              <iframe
                title="project-preview"
                srcDoc={previewDocument}
                className="h-[calc(100vh-8.75rem)] w-full rounded-[28px] border border-border bg-white"
                sandbox="allow-scripts"
              />
            </motion.div>
          ) : (
            <motion.div
              key="code"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid gap-4 lg:grid-cols-3"
            >
              {Object.entries(project.files).map(([fileName, content]) => (
                <section
                  key={fileName}
                  className="overflow-hidden rounded-[30px] border border-white/6 bg-[#101216] shadow-[0_20px_50px_rgba(0,0,0,0.24)]"
                >
                  <header className="flex items-center gap-2 border-b border-white/8 px-4 py-3 text-sm font-medium text-white">
                    <FileCode2 className="h-4 w-4 text-white/70" />
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
