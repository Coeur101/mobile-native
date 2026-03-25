import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Settings, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { mockProjectService } from "@/services/project/mock-project-service";
import {
  EASE_SMOOTH,
  SPRING_BOUNCY,
  STAGGER_DELAY,
  buttonTap,
  cardHover,
} from "@/lib/animations";
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
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_SMOOTH }}
        className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Dashboard</p>
              <h1 className="text-xl font-semibold text-foreground">项目列表</h1>
            </div>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => navigate("/settings")}
            className="flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-primary/20 hover:text-primary"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>
      </motion.header>

      {/* 主内容 */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <AnimatePresence mode="popLayout">
          {projects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4, ease: EASE_SMOOTH }}
              className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center shadow-sm"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent"
              >
                <Sparkles className="h-8 w-8 text-primary" />
              </motion.div>
              <h2 className="text-xl font-semibold text-foreground">还没有项目</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                当前为本地演示模式。你可以创建一个结构化网页项目，后续再切换到真实 AI 和云端数据。
              </p>
              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={() => navigate("/editor")}
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                新建项目
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project, index) => (
                <motion.article
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -60, scale: 0.95 }}
                  transition={{
                    delay: index * STAGGER_DELAY,
                    duration: 0.4,
                    ease: EASE_SMOOTH,
                  }}
                  whileHover={cardHover}
                  layout
                  className="rounded-[28px] border border-border bg-card p-5 shadow-sm transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        {project.status}
                      </span>
                      <h2 className="mt-3 text-lg font-semibold text-foreground">{project.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{project.description}</p>
                    </div>
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
                  <div className="mt-5 flex flex-wrap gap-2">
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => navigate(`/editor/${project.id}`)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                    >
                      <Pencil className="h-4 w-4" />
                      继续编辑
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => navigate(`/preview/${project.id}`)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:border-primary/20 hover:text-primary"
                    >
                      <Eye className="h-4 w-4" />
                      预览
                    </motion.button>
                    <motion.button
                      type="button"
                      whileTap={buttonTap}
                      onClick={() => void handleDelete(project.id)}
                      className="inline-flex h-10 items-center gap-2 rounded-2xl border border-destructive/20 px-4 text-sm font-medium text-destructive transition hover:bg-destructive/5"
                    >
                      <Trash2 className="h-4 w-4" />
                      删除
                    </motion.button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* 浮动按钮 */}
      <motion.button
        type="button"
        initial={{ y: 60, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ ...SPRING_BOUNCY, delay: 0.3 }}
        whileTap={buttonTap}
        whileHover={{ scale: 1.05 }}
        onClick={() => navigate("/editor")}
        className="fixed bottom-6 right-6 inline-flex h-14 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium text-primary-foreground shadow-lg transition"
        style={{ background: "var(--gradient-brand)" }}
      >
        <Plus className="h-5 w-5" />
        新建项目
      </motion.button>
    </PageTransition>
  );
}
