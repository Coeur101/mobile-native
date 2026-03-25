import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Settings, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { mockProjectService } from "@/services/project/mock-project-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import type { Project } from "@/types";

export function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);

  async function loadProjects() {
    setProjects(await mockProjectService.listProjects());
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleDelete = async (projectId: string) => {
    await mockProjectService.deleteProject(projectId);
    toast.success("项目已删除。");
    await loadProjects();
  };

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">项目列表</h1>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => navigate("/settings")}
            className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
            title="设置"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <AnimatePresence mode="popLayout">
          {projects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center"
            >
              <div className="animate-float mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">还没有项目</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                当前为本地演示模式。你可以创建一个结构化网页项目。
              </p>
              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={() => navigate("/editor")}
                className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                title="新建项目"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className="rounded-[28px] border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-md"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {project.status}
                    </span>
                    <h2 className="mt-3 text-lg font-semibold text-foreground">{project.name}</h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-secondary p-3 text-center text-xs text-muted-foreground">
                    <div>
                      <div className="text-lg font-semibold text-foreground">{project.messages.length}</div>
                      对话
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">{project.versions.length}</div>
                      版本
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-foreground">
                        {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                      </div>
                      更新
                    </div>
                  </div>
                  <div className="mt-5 flex gap-2">
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                      title="继续编辑"
                    >
                      <Pencil className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => navigate(`/preview/${project.id}`)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary hover:text-primary"
                      title="预览"
                    >
                      <Eye className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => void handleDelete(project.id)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-destructive/20 text-destructive transition-colors hover:bg-destructive/5"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </motion.button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* FAB */}
      <motion.button
        type="button"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_BOUNCY}
        whileTap={buttonTap}
        onClick={() => navigate("/editor")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform"
        style={{ background: "var(--gradient-brand)" }}
        title="新建项目"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </PageTransition>
  );
}
