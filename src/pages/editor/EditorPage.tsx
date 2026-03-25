import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Eye, FileCode2, History, MessageSquarePlus, Save } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition } from "@/components/ui/page-transition";
import { PulsingDots } from "@/components/ui/pulsing-dots";
import { promptTemplates } from "@/features/project/templates";
import { buildPreviewDocument } from "@/lib/render-project";
import { mockProjectService } from "@/services/project/mock-project-service";
import { useEditorStore } from "@/stores/use-editor-store";
import {
  EASE_SMOOTH,
  STAGGER_DELAY,
  buttonTap,
  cardHover,
} from "@/lib/animations";
import type { Project } from "@/types";

export function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { activeTab, selectedFile, setActiveTab, setSelectedFile } = useEditorStore();

  useEffect(() => {
    async function loadProject() {
      if (!projectId) {
        setProject(null);
        return;
      }
      const nextProject = await mockProjectService.getProjectById(projectId);
      setProject(nextProject);
    }

    void loadProject();
  }, [projectId]);

  const previewDocument = useMemo(() => buildPreviewDocument(project?.files ?? {}), [project]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("请输入你想生成的页面需求。");
      return;
    }

    setIsGenerating(true);
    try {
      const nextProject = project
        ? await mockProjectService.continueProject(project.id, prompt)
        : await mockProjectService.createProject(prompt);

      if (!nextProject) {
        toast.error("项目不存在，无法继续生成。");
        return;
      }

      setProject(nextProject);
      setPrompt("");
      setSelectedFile("index.html");
      toast.success(project ? "项目已按新需求更新。" : "项目已创建。");
      if (!projectId) {
        navigate(`/editor/${nextProject.id}`, { replace: true });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!project) {
      toast.error("请先生成项目。");
      return;
    }
    setIsSaving(true);
    try {
      const nextProject = await mockProjectService.createProjectVersion(
        project.id,
        "手动保存当前编辑版本",
      );
      if (nextProject) {
        setProject(nextProject);
        toast.success("已保存新版本快照。");
      }
    } finally {
      setIsSaving(false);
    }
  };

  const updateSelectedFile = async (value: string) => {
    if (!project) {
      return;
    }
    const nextProject = await mockProjectService.updateProjectFiles(project.id, {
      ...project.files,
      [selectedFile]: value,
    });
    if (nextProject) {
      setProject(nextProject);
    }
  };

  const fileEntries = Object.entries(project?.files ?? {});

  return (
    <PageTransition className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: EASE_SMOOTH }}
        className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition hover:border-primary/20 hover:text-primary"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Editor</p>
              <h1 className="text-lg font-semibold text-foreground">
                {project ? project.name : "新建项目"}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => project && navigate(`/preview/${project.id}`)}
              disabled={!project}
              className="inline-flex h-11 items-center gap-2 rounded-2xl border border-border px-4 text-sm font-medium text-foreground transition hover:border-primary/20 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Eye className="h-4 w-4" />
              独立预览
            </motion.button>
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => void handleSaveVersion()}
              disabled={!project || isSaving}
              className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              保存版本
            </motion.button>
          </div>
        </div>
      </motion.header>

      <main className="mx-auto grid max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[360px_1fr]">
        {/* 左侧 — 需求输入 */}
        <motion.section
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE_SMOOTH, delay: 0.1 }}
          className="rounded-[28px] border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <MessageSquarePlus className="h-4 w-4 text-primary" />
            需求输入
          </div>
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="描述你想创建或更新的网页。当前会生成结构化文件，并保留后续对接真实 AI 的入口。"
            className="mt-3 min-h-32 w-full rounded-3xl border border-border bg-input-background px-4 py-4 text-sm text-foreground outline-none transition focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]"
          />

          {/* 模板卡片 */}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {promptTemplates.map((template, i) => (
              <motion.button
                key={template.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * STAGGER_DELAY, duration: 0.3, ease: EASE_SMOOTH }}
                whileTap={buttonTap}
                whileHover={{ scale: 1.02, borderColor: "var(--primary)" }}
                onClick={() => setPrompt(template.prompt)}
                className="rounded-2xl border border-border bg-card px-3 py-3 text-left text-sm transition hover:bg-accent"
              >
                <div className="font-medium text-foreground">{template.label}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {template.prompt}
                </div>
              </motion.button>
            ))}
          </div>

          {/* 生成按钮 */}
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleGenerate()}
            disabled={isGenerating}
            className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
            style={{ background: isGenerating ? undefined : "var(--gradient-brand)" }}
          >
            {isGenerating ? (
              <>
                生成中 <PulsingDots />
              </>
            ) : project ? "继续生成" : "生成项目"}
          </motion.button>

          <div className="mt-5 rounded-3xl border border-amber-200/50 bg-amber-50/50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300">
            当前为演示模式。邮箱登录、微信登录、Supabase 数据和真实 AI 调用都只预留了入口，页面结构与数据模型已按后续真实接入形态组织。
          </div>
        </motion.section>

        {/* 右侧 — Tabs 内容 */}
        <motion.section
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: EASE_SMOOTH, delay: 0.2 }}
          className="rounded-[28px] border border-border bg-card p-5 shadow-sm"
        >
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
            <TabsList className="grid h-auto grid-cols-4 rounded-2xl bg-secondary p-1">
              <TabsTrigger value="chat" className="rounded-xl py-2">对话</TabsTrigger>
              <TabsTrigger value="files" className="rounded-xl py-2">文件</TabsTrigger>
              <TabsTrigger value="preview" className="rounded-xl py-2">预览</TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl py-2">历史</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-5">
              <AnimatePresence mode="wait">
                <motion.div
                  key="chat-content"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: EASE_SMOOTH }}
                  className="space-y-3"
                >
                  {(project?.messages ?? []).length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-border bg-secondary p-8 text-center text-sm text-muted-foreground">
                      还没有对话记录，先输入一个需求生成项目。
                    </div>
                  ) : (
                    project?.messages.map((message, index) => (
                      <motion.div
                        key={message.id}
                        initial={{
                          opacity: 0,
                          x: message.role === "user" ? 20 : -20,
                        }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          delay: index * 0.05,
                          duration: 0.3,
                          ease: EASE_SMOOTH,
                        }}
                        className={`rounded-3xl border px-4 py-3 text-sm leading-6 ${
                          message.role === "user"
                            ? "border-primary/20 bg-primary text-primary-foreground"
                            : "border-border bg-secondary text-foreground"
                        }`}
                      >
                        <div className="mb-1 text-xs uppercase tracking-[0.18em] opacity-70">
                          {message.role}
                        </div>
                        {message.content}
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="files" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-border bg-secondary p-8 text-center text-sm text-muted-foreground">
                  先生成项目后再编辑文件。
                </div>
              ) : (
                <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
                  <aside className="space-y-2">
                    {fileEntries.map(([fileName]) => (
                      <motion.button
                        key={fileName}
                        type="button"
                        whileTap={buttonTap}
                        onClick={() => setSelectedFile(fileName)}
                        className={`flex w-full items-center gap-2 rounded-2xl px-3 py-3 text-left text-sm transition ${
                          selectedFile === fileName
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-foreground hover:border-primary/20"
                        }`}
                      >
                        <FileCode2 className="h-4 w-4" />
                        {fileName}
                      </motion.button>
                    ))}
                  </aside>
                  <textarea
                    value={project.files[selectedFile] ?? ""}
                    onChange={(event) => void updateSelectedFile(event.target.value)}
                    className="min-h-[420px] w-full rounded-3xl border border-border bg-[#1C1917] px-4 py-4 font-mono text-sm leading-6 text-[#FAFAF9] outline-none transition focus:border-primary/40 dark:bg-[#0C0A09]"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="preview" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-border bg-secondary p-8 text-center text-sm text-muted-foreground">
                  先生成项目后再预览。
                </div>
              ) : (
                <div className="overflow-hidden rounded-[28px] border border-border">
                  <iframe
                    title="embedded-preview"
                    srcDoc={previewDocument}
                    className="h-[560px] w-full border-0 bg-white"
                    sandbox="allow-scripts allow-same-origin"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="history" className="mt-5">
              {!project ? (
                <div className="rounded-3xl border border-dashed border-border bg-secondary p-8 text-center text-sm text-muted-foreground">
                  还没有版本历史。
                </div>
              ) : (
                <div className="space-y-3">
                  {project.versions.map((version, index) => (
                    <motion.article
                      key={version.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * STAGGER_DELAY, duration: 0.3, ease: EASE_SMOOTH }}
                      className="rounded-3xl border border-border bg-secondary p-4"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <History className="h-4 w-4 text-primary" />
                        版本 #{version.versionNo}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{version.summary}</p>
                      <p className="mt-2 text-xs text-muted-foreground/60">
                        {new Date(version.createdAt).toLocaleString("zh-CN")}
                      </p>
                    </motion.article>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.section>
      </main>
    </PageTransition>
  );
}
