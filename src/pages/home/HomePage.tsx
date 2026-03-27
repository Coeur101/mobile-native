import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Search, Trash2, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { Dialog } from "@/components/ui/dialog";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import { projectService } from "@/services/project";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { useAuthStore } from "@/stores/use-auth-store";
import type { Project, ProjectStatus } from "@/types";

const STATUS_LABELS: Record<"all" | ProjectStatus, string> = {
  all: "全部",
  draft: "草稿",
  active: "进行中",
  archived: "已归档",
};

function getDisplayInitials(name: string) {
  const source = name.trim();
  if (!source) {
    return "我";
  }

  const parts = source.split(/[\s_-]+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[1][0]}` : source.slice(0, 2);
  return initials.toUpperCase();
}

export function HomePage() {
  const navigate = useNavigate();
  const profile = useAuthStore((state) => state.profile);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");

  async function loadProjects() {
    setIsLoading(true);
    setLoadError(null);
    try {
      setProjects(await projectService.listProjects());
    } catch (error) {
      const message = error instanceof Error ? error.message : "加载项目失败。";
      setLoadError(message);
      toast.error(message);
      setProjects([]);
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

  const filteredProjects = useMemo(() => {
    let result = projects;

    if (statusFilter !== "all") {
      result = result.filter((project) => project.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.description.toLowerCase().includes(query),
      );
    }

    return result;
  }, [projects, searchQuery, statusFilter]);

  const profileLabel = profile?.nickname?.trim() || profile?.email || "个人资料";

  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-primary-foreground"
              style={{ background: "var(--gradient-brand)" }}
            >
              <Plus className="h-4 w-4" />
            </div>
            <h1 className="text-lg font-semibold text-foreground">我的项目</h1>
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => navigate("/profile")}
            data-testid="profile-entry"
            className="flex h-10 min-w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-foreground transition-colors hover:border-primary/40 hover:bg-secondary"
            title={profileLabel}
          >
            {profile?.avatarBase64 ? (
              <img
                src={profile.avatarBase64}
                alt={profileLabel}
                className="h-full w-full object-cover"
              />
            ) : profile ? (
              <span className="text-xs font-semibold">{getDisplayInitials(profileLabel)}</span>
            ) : (
              <UserCircle2 className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索项目"
              className="w-full rounded-2xl border border-border bg-input-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>

          <div className="mt-3 flex gap-2">
            {(Object.keys(STATUS_LABELS) as Array<"all" | ProjectStatus>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {STATUS_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <ProjectListSkeleton />
        ) : loadError ? (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            data-testid="project-load-error"
            className="rounded-[28px] border border-destructive/20 bg-card p-10 text-center"
          >
            <h2 className="text-xl font-semibold text-foreground">加载项目失败</h2>
            <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void loadProjects()}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              重试
            </motion.button>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredProjects.length === 0 && projects.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center"
              >
                <div className="animate-float mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">还没有项目</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  新建一个项目，生成你的第一个移动端网页工作区。
                </p>
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => navigate("/editor")}
                  className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                  title="创建项目"
                >
                  <Plus className="h-5 w-5" />
                </motion.button>
              </motion.div>
            ) : filteredProjects.length === 0 ? (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center"
              >
                <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">当前筛选条件下没有匹配的项目。</p>
              </motion.div>
            ) : (
              <motion.div
                key="projects"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid gap-4 md:grid-cols-2"
              >
                {filteredProjects.map((project) => (
                  <article
                    key={project.id}
                    data-testid={`project-card-${project.id}`}
                    className="rounded-[28px] border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-md"
                  >
                    <div>
                      <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                        {STATUS_LABELS[project.status]}
                      </span>
                      <h2 className="mt-3 text-lg font-semibold text-foreground">{project.name}</h2>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {project.description}
                      </p>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 rounded-2xl bg-secondary p-3 text-center text-xs text-muted-foreground">
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {project.messages.length}
                        </div>
                        消息
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {project.versions.length}
                        </div>
                        版本
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {new Date(project.updatedAt).toLocaleDateString("zh-CN")}
                        </div>
                        更新时间
                      </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <motion.button
                        type="button"
                        data-testid={`project-edit-${project.id}`}
                        whileTap={buttonTap}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                        title="编辑项目"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        data-testid={`project-preview-${project.id}`}
                        whileTap={buttonTap}
                        onClick={() => navigate(`/preview/${project.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary hover:text-primary"
                        title="预览项目"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        data-testid={`project-delete-${project.id}`}
                        whileTap={buttonTap}
                        onClick={() => setDeleteTarget(project)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-destructive/20 text-destructive transition-colors hover:bg-destructive/5"
                        title="删除项目"
                      >
                        <Trash2 className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </article>
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
        description={`删除后将无法恢复「${deleteTarget?.name ?? ""}」。`}
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
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={SPRING_BOUNCY}
        whileTap={buttonTap}
        onClick={() => navigate("/editor")}
        className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full text-primary-foreground shadow-lg transition-transform"
        style={{ background: "var(--gradient-brand)" }}
        title="创建项目"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </PageTransition>
  );
}
