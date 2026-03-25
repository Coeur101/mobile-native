import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Search, Settings, Sparkles, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { Dialog } from "@/components/ui/dialog";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import { mockProjectService } from "@/services/project/mock-project-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import type { Project, ProjectStatus } from "@/types";

const STATUS_LABELS: Record<"all" | ProjectStatus, string> = {
  all: "全部",
  draft: "草稿",
  active: "进行中",
  archived: "已归档",
};

export function HomePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ProjectStatus>("all");

  async function loadProjects() {
    setIsLoading(true);
    try {
      setProjects(await mockProjectService.listProjects());
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleDelete = async (projectId: string) => {
    await mockProjectService.deleteProject(projectId);
    toast.success("项目已删除。");
    await loadProjects();
  };

  // 过滤后的项目列表
  const filteredProjects = useMemo(() => {
    let result = projects;

    // 状态筛选
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query),
      );
    }

    return result;
  }, [projects, statusFilter, searchQuery]);

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

      {/* 搜索栏和状态筛选 */}
      {projects.length > 0 && (
        <div className="mx-auto max-w-5xl px-4 pt-4">
          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索项目..."
              className="w-full rounded-2xl border border-border bg-input-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground transition-all focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
            />
          </div>

          {/* 状态筛选标签 */}
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
      )}

      <main className="mx-auto max-w-5xl px-4 py-6">
        {isLoading ? (
          <ProjectListSkeleton />
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
          ) : filteredProjects.length === 0 ? (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-[28px] border border-dashed border-border bg-card p-10 text-center"
            >
              <Search className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">没有找到匹配的项目</p>
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
                  className="rounded-[28px] border border-border bg-card p-5 transition-shadow duration-200 hover:shadow-md"
                >
                  <div>
                    <span className="inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
                      {project.status === "active" ? "进行中" : project.status === "draft" ? "草稿" : "已归档"}
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
                      onClick={() => setDeleteTarget(project)}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-destructive/20 text-destructive transition-colors hover:bg-destructive/5"
                      title="删除"
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

      {/* 删除确认对话框 */}
      <Dialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="确认删除项目"
        description={`确定要删除「${deleteTarget?.name ?? ""}」吗？此操作不可恢复。`}
        confirmLabel="删除"
        cancelLabel="取消"
        destructive
        onConfirm={() => {
          if (deleteTarget) void handleDelete(deleteTarget.id);
        }}
      />

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
