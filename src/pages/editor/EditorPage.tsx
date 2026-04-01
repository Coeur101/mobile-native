import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { Loader2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { VersionPanel } from "@/components/ui/version-panel";
import { SPRING_PANEL } from "@/lib/animations";
import { formatConversationMeta, formatMessageTime } from "@/lib/formatters";
import { projectService } from "@/services/project";
import { useGlobalStatusStore } from "@/stores/use-global-status-store";
import { EditorHeader } from "./EditorHeader";
import { EditorStarter } from "./EditorStarter";
import { EditorMessageList } from "./EditorMessageList";
import { EditorComposer } from "./EditorComposer";
import { getGenerationSummary, mergeThinkingSteps } from "./editor-types";
import type { DraftAssistantState, EditorRouteState, PendingUserMessage } from "./editor-types";
import type { Project } from "@/types";

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
  const [pendingUserMessage, setPendingUserMessage] = useState<PendingUserMessage | null>(null);
  const [draftAssistant, setDraftAssistant] = useState<DraftAssistantState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState("");
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generationStatus = draftAssistant?.progress.status ?? "idle";
  const isGenerationActive = generationStatus === "streaming" || generationStatus === "persisting";
  const isStarterMode = !project && !pendingUserMessage && !draftAssistant;

  const sessionTitle = draftAssistant
    ? (project ? `${project.name}（更新中）` : "新的生成会话")
    : project?.name ?? "新的生成会话";
  const sessionSummary = draftAssistant
    ? getGenerationSummary(generationStatus, draftAssistant.progress.error)
    : project?.description ?? getGenerationSummary(generationStatus);
  const sessionMeta = draftAssistant
    ? `本轮需求发送于 ${formatMessageTime(pendingUserMessage?.createdAt ?? draftAssistant.startedAt)}`
    : project
      ? `${formatConversationMeta(project)} · ${project.versions.length} 个版本`
      : pendingUserMessage
        ? `本轮需求发送于 ${formatMessageTime(pendingUserMessage.createdAt)}`
        : "准备开始新会话";

  // 加载项目
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

  // 路由携带的初始 prompt
  useEffect(() => {
    if (!projectId && !project && !prompt.trim() && routeState?.initialPrompt) {
      setPrompt(routeState.initialPrompt);
    }
  }, [project, projectId, prompt, routeState]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [
    project?.messages,
    pendingUserMessage?.content,
    draftAssistant?.progress.content,
    draftAssistant?.progress.thinkingSteps,
    draftAssistant?.progress.status,
  ]);

  // 将 AI 生成进度同步到全局状态栏
  useEffect(() => {
    const GENERATION_ID = "ai-generation";
    const globalStatus = useGlobalStatusStore.getState();

    if (!draftAssistant) {
      globalStatus.dismiss(GENERATION_ID);
      return;
    }

    const status = draftAssistant.progress.status;
    const targetPath = projectId ? `/editor/${projectId}` : undefined;

    if (status === "streaming") {
      globalStatus.push({
        id: GENERATION_ID,
        severity: "info",
        message: project ? `正在更新「${project.name}」...` : "AI 正在生成项目...",
        dismissable: false,
        autoDismissMs: null,
      });
    } else if (status === "persisting") {
      globalStatus.push({
        id: GENERATION_ID,
        severity: "info",
        message: "正在保存生成结果...",
        dismissable: false,
        autoDismissMs: null,
      });
    } else if (status === "completed") {
      globalStatus.push({
        id: GENERATION_ID,
        severity: "success",
        message: project ? `「${project.name}」已更新` : "项目已生成完成",
        dismissable: true,
        autoDismissMs: 4000,
        actionLabel: targetPath ? "查看" : undefined,
        actionTo: targetPath,
      });
    } else if (status === "failed") {
      globalStatus.push({
        id: GENERATION_ID,
        severity: "error",
        message: draftAssistant.progress.error ?? "生成失败",
        dismissable: true,
        autoDismissMs: 8000,
      });
    }
  }, [draftAssistant?.progress.status, draftAssistant?.progress.error, project?.name, projectId]);

  const handleGenerate = useCallback(async () => {
    const submittedPrompt = prompt.trim();
    if (!submittedPrompt || isGenerationActive) {
      return;
    }

    const startedAt = new Date().toISOString();
    setPendingUserMessage({ content: submittedPrompt, createdAt: startedAt });
    setDraftAssistant({
      startedAt,
      progress: { status: "streaming", content: "", thinkingSteps: [] },
    });

    const onProgress = (progress: import("@/types").ProjectGenerationProgress) => {
      setDraftAssistant((current) => ({
        startedAt: current?.startedAt ?? startedAt,
        progress: {
          status: progress.status,
          content: progress.content || current?.progress.content || "",
          thinkingSteps: mergeThinkingSteps(current?.progress.thinkingSteps ?? [], progress.thinkingSteps),
          error: progress.error,
        },
      }));
    };

    try {
      const nextProject = project
        ? await projectService.continueProject(project.id, submittedPrompt, { onProgress })
        : await projectService.createProject(submittedPrompt, { onProgress });

      if (!nextProject) {
        const message = "项目不存在，无法继续生成。";
        setDraftAssistant((current) => ({
          startedAt: current?.startedAt ?? startedAt,
          progress: { status: "failed", content: current?.progress.content ?? "", thinkingSteps: current?.progress.thinkingSteps ?? [], error: message },
        }));
        toast.error(message);
        return;
      }

      setProject(nextProject);
      setPrompt("");
      setPendingUserMessage(null);
      setDraftAssistant(null);
      toast.success(project ? "项目已根据新需求更新。" : "项目已创建。");

      if (!projectId) {
        navigate(`/editor/${nextProject.id}`, { replace: true });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败。";
      setDraftAssistant((current) => ({
        startedAt: current?.startedAt ?? startedAt,
        progress: { status: "failed", content: current?.progress.content ?? "", thinkingSteps: current?.progress.thinkingSteps ?? [], error: current?.progress.error ?? message },
      }));
      toast.error(message);
    }
  }, [prompt, isGenerationActive, project, projectId, navigate]);

  const handleSaveVersion = useCallback(async () => {
    if (!project) return;
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
  }, [project]);

  const handleRestoreVersion = useCallback(async (versionId: string) => {
    if (!project || isRestoring) return;
    setIsRestoring(true);
    setRestoringVersionId(versionId);
    try {
      const restored = await projectService.restoreProjectVersion(project.id, versionId);
      if (restored) {
        setProject(restored);
        toast.success("已恢复到所选版本。");
        setShowVersionPanel(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "恢复版本失败。");
    } finally {
      setIsRestoring(false);
      setRestoringVersionId(null);
    }
  }, [project, isRestoring]);

  const handleRenameSave = useCallback(async () => {
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
  }, [project, editName]);

  // ── 加载中 ──
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

  // ── 加载失败 ──
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
            <button type="button" onClick={() => navigate("/")} className="rounded-full border border-border px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/75">返回首页</button>
            <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground">重新加载</button>
          </div>
        </motion.div>
      </PageTransition>
    );
  }

  // ── 项目不存在 ──
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
          <button type="button" onClick={() => navigate("/")} className="mt-5 rounded-full bg-primary px-4 py-2.5 text-sm text-primary-foreground">返回首页</button>
        </motion.div>
      </PageTransition>
    );
  }

  // ── 正常编辑器 ──
  return (
    <PageTransition className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-64 overflow-hidden">
        <div className="animate-drift absolute left-[-3rem] top-8 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="animate-glow absolute right-[-2rem] top-16 h-24 w-24 rounded-full bg-primary/12 blur-3xl" />
      </div>

      <EditorHeader
        project={project}
        isEditingName={isEditingName}
        editName={editName}
        onEditNameChange={setEditName}
        onRenameSave={() => void handleRenameSave()}
        onStartEditing={() => { if (project) { setEditName(project.name); setIsEditingName(true); } }}
        onCancelEditing={() => setIsEditingName(false)}
        generationStatus={generationStatus}
        isGenerationActive={isGenerationActive}
        isSaving={isSaving}
        isRestoring={isRestoring}
        onSaveVersion={() => void handleSaveVersion()}
        onOpenVersionPanel={() => setShowVersionPanel(true)}
        pendingLabel={pendingUserMessage ? "新会话" : null}
        draftLabel={draftAssistant ? getGenerationSummary(generationStatus) : null}
      />

      {isStarterMode ? (
        <EditorStarter onSelectTemplate={setPrompt} />
      ) : (
        <EditorMessageList
          messages={project?.messages ?? []}
          pendingUserMessage={pendingUserMessage}
          draftAssistant={draftAssistant}
          generationStatus={generationStatus}
          sessionTitle={sessionTitle}
          sessionSummary={sessionSummary}
          sessionMeta={sessionMeta}
          messagesEndRef={messagesEndRef}
        />
      )}

      <EditorComposer
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={() => void handleGenerate()}
        isStarterMode={isStarterMode}
        isGenerationActive={isGenerationActive}
        isRestoring={isRestoring}
        isComposerFocused={isComposerFocused}
        onFocus={() => setIsComposerFocused(true)}
        onBlur={() => setIsComposerFocused(false)}
      />

      <VersionPanel
        open={showVersionPanel}
        onClose={() => setShowVersionPanel(false)}
        versions={project?.versions ?? []}
        onRestore={(versionId) => void handleRestoreVersion(versionId)}
        isRestoring={isRestoring}
        restoringVersionId={restoringVersionId}
      />
    </PageTransition>
  );
}
