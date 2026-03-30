import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CloudSun,
  Eye,
  Grid2X2,
  Grid3X3,
  Loader2,
  Save,
  Send,
  Sparkles,
  Timer,
  WandSparkles,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { PulsingDots } from "@/components/ui/pulsing-dots";
import { ThoughtChain } from "@/components/ui/thought-chain";
import { VersionPanel } from "@/components/ui/version-panel";
import { promptTemplates } from "@/features/project/templates";
import { buttonTap, cardLift, iconLift, SPRING_BOUNCY, SPRING_GENTLE, SPRING_PANEL } from "@/lib/animations";
import { projectService } from "@/services/project";
import type { Project } from "@/types";

const templateIcons = [Grid2X2, Grid3X3, Timer, CloudSun];

interface EditorRouteState {
  initialPrompt?: string;
}

function formatConversationMeta(project: Project | null) {
  if (!project) {
    return "从一句需求开始";
  }

  const updatedAt = new Date(project.updatedAt);
  const now = new Date();
  const isToday =
    updatedAt.getFullYear() === now.getFullYear() &&
    updatedAt.getMonth() === now.getMonth() &&
    updatedAt.getDate() === now.getDate();

  return `${isToday ? "今天" : updatedAt.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · ${project.messages.length} 条对话`;
}

export function EditorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const routeState = (location.state as EditorRouteState | null) ?? null;
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoadingProject, setIsLoadingProject] = useState(Boolean(projectId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setProject(null);
        setIsLoadingProject(false);
        setLoadError(null);
        return;
      }

      setIsLoadingProject(true);
      setLoadError(null);

      try {
        setProject(await projectService.getProjectById(projectId));
      } catch (error) {
        const message = error instanceof Error ? error.message : "加载项目失败。";
        setLoadError(message);
        setProject(null);
        toast.error(message);
      } finally {
        setIsLoadingProject(false);
      }
    }

    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (!projectId && !project && !prompt.trim() && routeState?.initialPrompt) {
      setPrompt(routeState.initialPrompt);
    }
  }, [project, projectId, prompt, routeState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project?.messages, isGenerating]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);

    try {
      const nextProject = project
        ? await projectService.continueProject(project.id, prompt)
        : await projectService.createProject(prompt);

      if (!nextProject) {
        toast.error("项目不存在，无法继续生成。");
        return;
      }

      setProject(nextProject);
      setPrompt("");
      toast.success(project ? "项目已根据新需求更新。" : "项目已创建。");

      if (!projectId) {
        navigate(`/editor/${nextProject.id}`, { replace: true });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "生成失败。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!project) {
      return;
    }

    setIsSaving(true);

    try {
      const nextProject = await projectService.createProjectVersion(project.id, "手动保存当前版本");
      if (nextProject) {
        setProject(nextProject);
        toast.success("已保存版本快照。");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "保存版本失败。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!project) {
      return;
    }

    try {
      const restored = await projectService.restoreProjectVersion(project.id, versionId);
      if (restored) {
        setProject(restored);
        toast.success("已恢复到所选版本。");
        setShowVersionPanel(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "恢复版本失败。");
    }
  };

  const handleRenameSave = async () => {
    if (!project || !editName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      const updated = await projectService.updateProjectMeta(project.id, { name: editName.trim() });
      if (updated) {
        setProject(updated);
        toast.success("项目名称已更新。");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新项目名称失败。");
    }

    setIsEditingName(false);
  };

  const startEditing = () => {
    if (!project) {
      return;
    }

    setEditName(project.name);
    setIsEditingName(true);
  };

  const messages = project?.messages ?? [];
  const isStarterMode = !project;

  if (projectId && isLoadingProject) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={SPRING_PANEL}
          className="rounded-[30px] border border-border bg-card/92 px-8 py-10 text-center shadow-[var(--shadow-card)]"
        >
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-sm text-muted-foreground">正在加载项目工作区…</p>
        </motion.div>
      </PageTransition>
    );
  }

  if (projectId && loadError) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={SPRING_PANEL}
          data-testid="editor-load-error"
          className="w-full max-w-md rounded-[32px] border border-destructive/18 bg-card/92 p-8 text-center shadow-[var(--shadow-card)]"
        >
          <h1 className="text-[1.5rem] font-semibold text-foreground">加载项目失败</h1>
          <p className="mt-2 text-sm text-muted-foreground">{loadError}</p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-full border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/75"
            >
              返回首页
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground"
            >
              重新加载
            </button>
          </div>
        </motion.div>
      </PageTransition>
    );
  }

  if (projectId && !project) {
    return (
      <PageTransition className="flex min-h-screen items-center justify-center px-6">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
          transition={SPRING_PANEL}
          data-testid="editor-project-missing"
          className="w-full max-w-md rounded-[32px] border border-border bg-card/92 p-8 text-center shadow-[var(--shadow-card)]"
        >
          <h1 className="text-[1.5rem] font-semibold text-foreground">项目不存在</h1>
          <p className="mt-2 text-sm text-muted-foreground">当前账号下找不到这个项目。</p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-5 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground"
          >
            返回首页
          </button>
        </motion.div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,113,227,0.08),_transparent_26%),linear-gradient(180deg,_rgba(255,255,255,0.99),_rgba(246,247,251,0.97))]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64 overflow-hidden">
        <div className="animate-drift absolute left-[-3rem] top-8 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-glow absolute right-[-2rem] top-16 h-24 w-24 rounded-full bg-sky-300/14 blur-3xl" />
      </div>

      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/86 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-3 px-4">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={SPRING_PANEL}
            className="flex min-w-0 items-center gap-3"
          >
            <motion.button
              type="button"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : iconLift}
              transition={SPRING_BOUNCY}
              onClick={() => navigate("/")}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)]"
              title="返回首页"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>

            <div className="min-w-0">
              {isEditingName ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  onBlur={() => void handleRenameSave()}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      void handleRenameSave();
                    }
                    if (event.key === "Escape") {
                      setIsEditingName(false);
                    }
                  }}
                  autoFocus
                  className="w-full rounded-[16px] border border-primary/25 bg-input-background px-3 py-1.5 text-base font-semibold text-foreground outline-none shadow-[var(--shadow-focus)]"
                />
              ) : (
                <h1
                  className="truncate text-[1.1rem] font-semibold tracking-[-0.03em] text-foreground"
                  onClick={project ? startEditing : undefined}
                  title={project ? "点击编辑项目名称" : undefined}
                >
                  {project ? project.name : "新建项目"}
                </h1>
              )}
              <p className="truncate text-xs text-muted-foreground">{formatConversationMeta(project)}</p>
            </div>
          </motion.div>

          {project ? (
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reduceMotion ? undefined : { ...SPRING_PANEL, delay: 0.04 }}
              className="flex items-center gap-2"
            >
              <motion.button
                type="button"
                data-testid="save-version"
                whileTap={buttonTap}
                whileHover={reduceMotion ? undefined : iconLift}
                transition={SPRING_BOUNCY}
                onClick={() => void handleSaveVersion()}
                disabled={isSaving}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75 disabled:opacity-55"
                title="保存版本"
              >
                <Save className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                data-testid="open-version-panel"
                whileTap={buttonTap}
                whileHover={reduceMotion ? undefined : iconLift}
                transition={SPRING_BOUNCY}
                onClick={() => setShowVersionPanel(true)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75"
                title="版本历史"
              >
                <WandSparkles className="h-4 w-4" />
              </motion.button>
              <motion.button
                type="button"
                data-testid="open-project-preview"
                whileTap={buttonTap}
                whileHover={reduceMotion ? undefined : iconLift}
                transition={SPRING_BOUNCY}
                onClick={() => navigate(`/preview/${project.id}`)}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-panel)]"
                title="预览"
              >
                <Eye className="h-4 w-4" />
              </motion.button>
            </motion.div>
          ) : (
            <div className="w-11" />
          )}
        </div>
      </header>

      {isStarterMode ? (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col px-4 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-6">
          <section className="flex flex-1 flex-col justify-center">
            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.9 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              transition={SPRING_PANEL}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-border/70 bg-card/80 text-muted-foreground shadow-[var(--shadow-panel)]"
            >
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, -6, 0], scale: [1, 1.05, 1] }}
                transition={reduceMotion ? undefined : { duration: 5.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              >
                <Sparkles className="h-8 w-8" />
              </motion.div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? undefined : { opacity: 0, y: 18 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              transition={reduceMotion ? undefined : { ...SPRING_PANEL, delay: 0.06 }}
              className="mt-8 text-center"
            >
              <h2 className="text-[2rem] font-semibold tracking-[-0.05em] text-foreground">
                你想创造点什么？
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                输入需求或者先尝试下面这些灵感模板。
              </p>
            </motion.div>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {promptTemplates.map((template, index) => {
                const Icon = templateIcons[index] ?? Sparkles;

                return (
                  <motion.button
                    key={template.id}
                    type="button"
                    initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                    transition={reduceMotion ? undefined : { ...SPRING_GENTLE, delay: 0.1 + index * 0.04 }}
                    whileTap={buttonTap}
                    whileHover={reduceMotion ? undefined : cardLift}
                    onClick={() => setPrompt(template.prompt)}
                    className="relative overflow-hidden rounded-[24px] border border-border/80 bg-card/92 p-4 text-left shadow-[var(--shadow-card)] transition-colors hover:bg-card"
                  >
                    <div className="pointer-events-none absolute right-[-1.25rem] top-[-1.25rem] h-16 w-16 rounded-full bg-primary/6 blur-2xl" />
                    <motion.div
                      animate={reduceMotion ? undefined : { y: [0, -2, 0], scale: [1, 1.04, 1] }}
                      transition={reduceMotion ? undefined : { duration: 4.5 + index * 0.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground"
                    >
                      <Icon className="h-4 w-4" />
                    </motion.div>
                    <h3 className="mt-4 text-base font-semibold text-foreground">{template.label}</h3>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {template.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </section>
        </main>
      ) : (
        <main className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-4">
          <motion.section
            initial={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.985 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
            transition={SPRING_PANEL}
            className="relative overflow-hidden rounded-[26px] border border-border/80 bg-card/94 p-4 shadow-[var(--shadow-card)]"
          >
            <div className="pointer-events-none absolute inset-x-8 -top-10 h-20 rounded-full bg-primary/7 blur-3xl" />
            <div className="flex items-start gap-3">
              <motion.div
                animate={reduceMotion ? undefined : { y: [0, -3, 0], scale: [1, 1.04, 1] }}
                transition={reduceMotion ? undefined : { duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-[18px] bg-secondary text-foreground"
              >
                <Sparkles className="h-5 w-5" />
              </motion.div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">
                  {project?.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                  {project?.description}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {formatConversationMeta(project)} · {project?.versions.length ?? 0} 个版本
                </p>
              </div>
            </div>
          </motion.section>

          <div className="mt-4 flex-1 overflow-y-auto [overscroll-behavior:contain]">
            <AnimatePresence mode="popLayout">
              <div className="space-y-4 pb-4">
                {messages.map((message, index) => {
                  const isUser = message.role === "user";

                  return (
                    <motion.div
                      key={message.id}
                      layout={!reduceMotion}
                      initial={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.98 }}
                      animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                      transition={reduceMotion ? undefined : { ...SPRING_GENTLE, delay: index * 0.02 }}
                      className={`flex gap-3 ${isUser ? "justify-end" : ""}`}
                    >
                      {!isUser ? (
                        <motion.div
                          animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
                          transition={reduceMotion ? undefined : { duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-secondary text-foreground"
                        >
                          <Sparkles className="h-4 w-4" />
                        </motion.div>
                      ) : null}

                      <div className={`max-w-[84%] ${isUser ? "items-end" : ""}`}>
                        <motion.div
                          whileHover={reduceMotion ? undefined : { y: -2 }}
                          transition={SPRING_BOUNCY}
                          className={`rounded-[24px] px-4 py-3 text-sm leading-7 shadow-[var(--shadow-panel)] ${
                            isUser
                              ? "rounded-br-[10px] bg-foreground text-background"
                              : "rounded-bl-[10px] border border-border/80 bg-card/96 text-foreground"
                          }`}
                        >
                          {!isUser && message.thinkingSteps?.length ? (
                            <div className="mb-3">
                              <ThoughtChain steps={message.thinkingSteps} />
                            </div>
                          ) : null}
                          <p className="whitespace-pre-wrap">{message.content}</p>
                        </motion.div>

                        <p className={`mt-2 text-[11px] text-muted-foreground ${isUser ? "text-right" : ""}`}>
                          {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      {isUser ? (
                        <motion.div
                          animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
                          transition={reduceMotion ? undefined : { duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                        >
                          <WandSparkles className="h-4 w-4" />
                        </motion.div>
                      ) : null}
                    </motion.div>
                  );
                })}

                {isGenerating ? (
                  <motion.div
                    initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                    animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={SPRING_PANEL}
                    className="flex gap-3"
                  >
                    <motion.div
                      animate={reduceMotion ? undefined : { y: [0, -2, 0], scale: [1, 1.05, 1] }}
                      transition={reduceMotion ? undefined : { duration: 2.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-foreground"
                    >
                      <Sparkles className="h-4 w-4" />
                    </motion.div>
                    <div className="rounded-[24px] rounded-bl-[10px] border border-border/80 bg-card/96 px-4 py-3 shadow-[var(--shadow-panel)]">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        正在生成内容
                        <PulsingDots />
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                <div ref={messagesEndRef} />
              </div>
            </AnimatePresence>
          </div>
        </main>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20">
        <div className="mx-auto max-w-md px-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {!isStarterMode && !prompt.trim() ? (
            <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {promptTemplates.map((template, index) => (
                <motion.button
                  key={template.id}
                  type="button"
                  initial={reduceMotion ? undefined : { opacity: 0, x: 8 }}
                  animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
                  transition={reduceMotion ? undefined : { ...SPRING_GENTLE, delay: 0.04 + index * 0.03 }}
                  whileTap={buttonTap}
                  whileHover={reduceMotion ? undefined : { y: -2 }}
                  onClick={() => setPrompt(template.prompt)}
                  className="whitespace-nowrap rounded-full border border-border/80 bg-card/92 px-4 py-2 text-sm text-foreground shadow-[var(--shadow-panel)]"
                >
                  {template.label}
                </motion.button>
              ))}
            </div>
          ) : null}

          <motion.div
            animate={
              reduceMotion
                ? undefined
                : {
                    y: isComposerFocused ? -4 : 0,
                    scale: isComposerFocused ? 1.01 : 1,
                  }
            }
            transition={SPRING_PANEL}
            className={`relative overflow-hidden rounded-[30px] border border-border/80 bg-card/96 p-3 backdrop-blur-2xl ${
              isComposerFocused
                ? "shadow-[0_24px_52px_rgba(15,23,42,0.18)]"
                : "shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
            }`}
          >
            <div className="pointer-events-none absolute inset-x-6 -top-10 h-16 rounded-full bg-primary/8 blur-3xl" />
            <div className="relative flex items-end gap-3">
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onFocus={() => setIsComposerFocused(true)}
                onBlur={() => setIsComposerFocused(false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    void handleGenerate();
                  }
                }}
                placeholder={
                  isStarterMode
                    ? "描述你想要的网页或选择上方模板..."
                    : "继续描述你希望生成或修改的页面内容..."
                }
                className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
                disabled={isGenerating}
              />
              <motion.button
                type="button"
                whileTap={buttonTap}
                whileHover={reduceMotion ? undefined : { y: -3, scale: 1.04 }}
                animate={
                  reduceMotion || !prompt.trim()
                    ? undefined
                    : {
                        y: [0, -2, 0],
                        boxShadow: [
                          "0 10px 20px rgba(15,23,42,0.14)",
                          "0 16px 28px rgba(15,23,42,0.2)",
                          "0 10px 20px rgba(15,23,42,0.14)",
                        ],
                      }
                }
                transition={
                  reduceMotion || !prompt.trim()
                    ? SPRING_BOUNCY
                    : {
                        y: { duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                        boxShadow: { duration: 3.4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" },
                      }
                }
                onClick={() => void handleGenerate()}
                disabled={!prompt.trim() || isGenerating}
                className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
                title="发送需求"
              >
                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </div>

      <VersionPanel
        open={showVersionPanel}
        onClose={() => setShowVersionPanel(false)}
        versions={project?.versions ?? []}
        onRestore={(versionId) => void handleRestoreVersion(versionId)}
      />
    </PageTransition>
  );
}
