import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Settings, Sparkles, Trash2, UserCircle2 } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Dialog } from "@/components/ui/dialog";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import { PageTransition } from "@/components/ui/page-transition";
import { buttonTap, cardLift, iconLift, SPRING_BOUNCY, SPRING_GENTLE, SPRING_PANEL } from "@/lib/animations";
import { projectService } from "@/services/project";
import { useAuthStore } from "@/stores/use-auth-store";
import type { Project } from "@/types";

function getDisplayInitials(name: string) {
  const source = name.trim();
  if (!source) {
    return "我";
  }

  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

function formatProjectMeta(project: Project) {
  const updatedAt = new Date(project.updatedAt);
  const now = new Date();
  const isToday =
    updatedAt.getFullYear() === now.getFullYear() &&
    updatedAt.getMonth() === now.getMonth() &&
    updatedAt.getDate() === now.getDate();

  return `${isToday ? "今天" : updatedAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · ${project.messages.length} 条对话`;
}

export function HomePage() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const profile = useAuthStore((state) => state.profile);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);

  async function loadProjects() {
    setIsLoading(true);
    setLoadError(null);

    try {
      setProjects(await projectService.listProjects());
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载项目失败。";
      setLoadError(message);
      setProjects([]);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleDelete = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      toast.success("项目已删除。");
      await loadProjects();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除项目失败。");
    }
  };

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
      ),
    [projects],
  );

  const profileLabel = profile?.nickname?.trim() || profile?.email || "个人资料";

  return (
    <PageTransition className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,113,227,0.08),_transparent_28%),linear-gradient(180deg,_rgba(255,255,255,0.98),_rgba(246,247,251,0.96))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-56 overflow-hidden">
        <div className="animate-drift absolute left-[-3rem] top-5 h-28 w-28 rounded-full bg-primary/12 blur-3xl" />
        <div className="animate-glow absolute right-[-2rem] top-10 h-24 w-24 rounded-full bg-sky-300/18 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/86 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between px-4">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={SPRING_PANEL}
            className="flex items-center gap-3"
          >
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -4, 0], rotate: [0, -4, 0], scale: [1, 1.03, 1] }}
              transition={reduceMotion ? undefined : { duration: 5.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-panel)]"
            >
              <Sparkles className="h-4 w-4" />
            </motion.div>
            <div>
              <h1 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-foreground">
                AI网页生成器
              </h1>
              <p className="text-xs text-muted-foreground">最近项目</p>
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={reduceMotion ? undefined : { ...SPRING_PANEL, delay: 0.04 }}
            className="flex items-center gap-2"
          >
            <motion.button
              type="button"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : iconLift}
              transition={SPRING_BOUNCY}
              onClick={() => navigate("/settings")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-card"
              title="设置"
            >
              <Settings className="h-4 w-4" />
            </motion.button>

            <motion.button
              type="button"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : iconLift}
              transition={SPRING_BOUNCY}
              onClick={() => navigate("/profile")}
              data-testid="profile-entry"
              className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-card"
              title={profileLabel}
            >
              {profile?.avatarBase64 ? (
                <img src={profile.avatarBase64} alt={profileLabel} className="h-full w-full object-cover" />
              ) : profile ? (
                <span className="text-xs font-semibold">{getDisplayInitials(profileLabel)}</span>
              ) : (
                <UserCircle2 className="h-5 w-5" />
              )}
            </motion.button>
          </motion.div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-md flex-col gap-4 px-4 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4">
        {!isLoading && !loadError && sortedProjects.length > 0 ? (
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={reduceMotion ? undefined : { ...SPRING_PANEL, delay: 0.06 }}
            className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card/94 p-4 shadow-[var(--shadow-card)]"
          >
            <div className="pointer-events-none absolute inset-x-6 -top-8 h-20 rounded-full bg-primary/8 blur-3xl" />
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
                  继续创作
                </p>
                <h2 className="mt-1 text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground">
                  继续最近一次创作
                </h2>
              </div>
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
                transition={reduceMotion ? undefined : { duration: 4.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground"
              >
                {formatProjectMeta(sortedProjects[0])}
              </motion.div>
            </div>

            <motion.button
              type="button"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : cardLift}
              transition={SPRING_BOUNCY}
              onClick={() => navigate(`/editor/${sortedProjects[0].id}`)}
              className="mt-4 flex w-full items-center gap-4 rounded-[24px] bg-secondary/75 px-4 py-4 text-left transition-colors hover:bg-secondary"
            >
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -3, 0], scale: [1, 1.04, 1] }}
                transition={reduceMotion ? undefined : { duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-card text-foreground shadow-[var(--shadow-panel)]"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-base font-semibold text-foreground">打开最近项目</div>
                <div className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {sortedProjects[0].description}
                </div>
              </div>
            </motion.button>
          </motion.section>
        ) : null}

        <motion.section
          initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { ...SPRING_PANEL, delay: 0.1 }}
          className="flex items-center justify-between px-1 pt-2"
        >
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-muted-foreground">
              项目列表
            </p>
            <h2 className="mt-1 text-[1.25rem] font-semibold tracking-[-0.03em] text-foreground">
              你的项目
            </h2>
          </div>
          {!isLoading && !loadError ? (
            <div className="rounded-full bg-secondary/80 px-3 py-1 text-xs text-muted-foreground">
              {sortedProjects.length} 个
            </div>
          ) : null}
        </motion.section>

        {isLoading ? (
          <ProjectListSkeleton />
        ) : loadError ? (
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={SPRING_PANEL}
            data-testid="project-load-error"
            className="rounded-[28px] border border-destructive/18 bg-card/92 px-6 py-10 text-center shadow-[var(--shadow-card)]"
          >
            <h2 className="text-[1.35rem] font-semibold text-foreground">加载项目失败</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{loadError}</p>
            <motion.button
              type="button"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : { y: -2, scale: 1.01 }}
              transition={SPRING_BOUNCY}
              onClick={() => void loadProjects()}
              className="mt-5 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              重新加载
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {sortedProjects.length === 0 ? (
              <motion.section
                key="empty"
                initial={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.99 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={SPRING_PANEL}
                className="rounded-[30px] border border-dashed border-border/80 bg-card/74 px-6 py-14 text-center shadow-[var(--shadow-panel)]"
              >
                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, -5, 0] }}
                  transition={reduceMotion ? undefined : { duration: 5.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-foreground"
                >
                  <Sparkles className="h-7 w-7" />
                </motion.div>
                <h2 className="mt-5 text-[1.55rem] font-semibold tracking-[-0.04em] text-foreground">
                  还没有项目
                </h2>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  点击底部加号，直接开始新的页面创作。
                </p>
              </motion.section>
            ) : (
              <motion.div
                key="projects"
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="space-y-3"
              >
                {sortedProjects.map((project, index) => (
                  <motion.article
                    key={project.id}
                    data-testid={`project-card-${project.id}`}
                    initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.985 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    transition={reduceMotion ? undefined : { ...SPRING_GENTLE, delay: 0.08 + index * 0.04 }}
                    whileHover={reduceMotion ? undefined : cardLift}
                    className="relative overflow-hidden rounded-[28px] border border-border/80 bg-card/94 p-4 shadow-[var(--shadow-card)]"
                  >
                    <div className="pointer-events-none absolute right-[-1.5rem] top-[-1.5rem] h-20 w-20 rounded-full bg-primary/6 blur-3xl" />
                    <div className="flex items-start gap-4">
                      <motion.div
                        animate={reduceMotion ? undefined : { y: [0, -2, 0], scale: [1, 1.03, 1] }}
                        transition={reduceMotion ? undefined : { duration: 4.8 + index * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                        className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[18px] bg-secondary text-foreground"
                      >
                        <Sparkles className="h-5 w-5" />
                      </motion.div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[1.2rem] font-semibold tracking-[-0.03em] text-foreground">
                          {project.name}
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                          {project.description}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">{formatProjectMeta(project)}</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2">
                      <motion.button
                        type="button"
                        data-testid={`project-preview-${project.id}`}
                        whileTap={buttonTap}
                        whileHover={reduceMotion ? undefined : iconLift}
                        transition={SPRING_BOUNCY}
                        onClick={() => navigate(`/preview/${project.id}`)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-panel)]"
                        title="预览"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        data-testid={`project-edit-${project.id}`}
                        whileTap={buttonTap}
                        whileHover={reduceMotion ? undefined : iconLift}
                        transition={SPRING_BOUNCY}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75"
                        title="编辑"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        data-testid={`project-delete-${project.id}`}
                        whileTap={buttonTap}
                        whileHover={reduceMotion ? undefined : iconLift}
                        transition={SPRING_BOUNCY}
                        onClick={() => setDeleteTarget(project)}
                        className="flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive/15"
                        title="删除"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </main>

      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="删除项目"
        description={deleteTarget ? `删除后将无法恢复“${deleteTarget.name}”。` : undefined}
        confirmLabel="确认删除"
        cancelLabel="取消"
        destructive
        onConfirm={() => {
          if (deleteTarget) {
            void handleDelete(deleteTarget.id);
          }
        }}
      />

      <motion.button
        type="button"
        initial={reduceMotion ? undefined : { y: 28, opacity: 0, scale: 0.94 }}
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -4, 0],
                opacity: 1,
                scale: 1,
                boxShadow: [
                  "0 18px 40px rgba(15,23,42,0.24)",
                  "0 24px 52px rgba(15,23,42,0.28)",
                  "0 18px 40px rgba(15,23,42,0.24)",
                ],
              }
        }
        transition={
          reduceMotion
            ? undefined
            : {
                opacity: { duration: 0.32 },
                scale: { duration: 0.32, ease: "easeOut" },
                y: { duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                boxShadow: { duration: 4.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
              }
        }
        whileTap={buttonTap}
        whileHover={reduceMotion ? undefined : { y: -6, scale: 1.04 }}
        onClick={() => navigate("/editor")}
        className="fixed bottom-[calc(1.25rem+env(safe-area-inset-bottom))] left-1/2 z-20 flex h-16 w-16 -translate-x-1/2 items-center justify-center rounded-full bg-foreground text-background"
        title="新建项目"
      >
        <Plus className="h-7 w-7" />
      </motion.button>
    </PageTransition>
  );
}
