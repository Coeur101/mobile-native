import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Eye, Pencil, Plus, Search, Trash2, UserCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { Dialog } from "@/components/ui/dialog";
import { ProjectListSkeleton } from "@/components/ui/skeleton";
import { mockProjectService } from "@/services/project/mock-project-service";
import { SPRING_BOUNCY, buttonTap } from "@/lib/animations";
import { useAuthStore } from "@/stores/use-auth-store";
import type { Project, ProjectStatus } from "@/types";

const STATUS_LABELS: Record<"all" | ProjectStatus, string> = {
  all: "All",
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

function getDisplayInitials(name: string) {
  const source = name.trim();
  if (!source) {
    return "U";
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
    toast.success("Project deleted.");
    await loadProjects();
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

  const profileLabel = profile?.nickname?.trim() || profile?.email || "Profile";

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
            <h1 className="text-lg font-semibold text-foreground">Projects</h1>
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
              placeholder="Search projects"
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
                <h2 className="text-xl font-semibold text-foreground">No projects yet</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Start a new project to generate your first mobile web app workspace.
                </p>
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => navigate("/editor")}
                  className="mt-5 inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                  title="Create project"
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
                <p className="text-sm text-muted-foreground">
                  No projects match the current search and filter.
                </p>
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
                        Messages
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {project.versions.length}
                        </div>
                        Versions
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-foreground">
                          {new Date(project.updatedAt).toLocaleDateString("en-US")}
                        </div>
                        Updated
                      </div>
                    </div>
                    <div className="mt-5 flex gap-2">
                      <motion.button
                        type="button"
                        whileTap={buttonTap}
                        onClick={() => navigate(`/editor/${project.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground transition-colors hover:opacity-90"
                        title="Edit project"
                      >
                        <Pencil className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={buttonTap}
                        onClick={() => navigate(`/preview/${project.id}`)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary hover:text-primary"
                        title="Preview project"
                      >
                        <Eye className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        type="button"
                        whileTap={buttonTap}
                        onClick={() => setDeleteTarget(project)}
                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-destructive/20 text-destructive transition-colors hover:bg-destructive/5"
                        title="Delete project"
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
        title="Delete project"
        description={`This action will permanently delete "${deleteTarget?.name ?? ""}".`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
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
        title="Create project"
      >
        <Plus className="h-6 w-6" />
      </motion.button>
    </PageTransition>
  );
}
