import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/page-transition";
import { PulsingDots } from "@/components/ui/pulsing-dots";
import { ThoughtChain } from "@/components/ui/thought-chain";
import { promptTemplates } from "@/features/project/templates";
import { mockProjectService } from "@/services/project/mock-project-service";
import { buttonTap } from "@/lib/animations";
import type { Project } from "@/types";

// 模板图标映射
const templateIcons = [Grid2X2, Grid3X3, Timer, CloudSun];

export function EditorPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [project?.messages]);

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

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
      toast.success(project ? "项目已按新需求更新。" : "项目已创建。");
      if (!projectId) {
        navigate(`/editor/${nextProject.id}`, { replace: true });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveVersion = async () => {
    if (!project) return;
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

  const messages = project?.messages ?? [];

  return (
    <PageTransition className="flex min-h-screen flex-col bg-background">
      {/* Header — 紧凑，纯图标 */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
              title="返回"
            >
              <ArrowLeft className="h-5 w-5" />
            </motion.button>
            <div>
              <h1 className="text-sm font-semibold text-foreground">
                {project ? project.name : "新建项目"}
              </h1>
              {project && (
                <p className="text-xs text-muted-foreground">{project.description?.slice(0, 20)}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {project && (
              <>
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => void handleSaveVersion()}
                  disabled={isSaving}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-primary disabled:opacity-50"
                  title="保存版本"
                >
                  <Save className="h-4 w-4" />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => navigate(`/preview/${project.id}`)}
                  className="flex h-9 w-9 items-center justify-center rounded-full text-primary-foreground"
                  style={{ background: "var(--gradient-brand)" }}
                  title="预览"
                >
                  <Eye className="h-4 w-4" />
                </motion.button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 消息区域 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-md px-4 py-4">
          <AnimatePresence mode="popLayout">
            {messages.length === 0 ? (
              /* 欢迎状态 + 模板 */
              <motion.div
                key="welcome"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="animate-float mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-border bg-accent">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">
                  你想创造点什么？
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                  输入需求或者尝试以下灵感模板
                </p>

                <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                  {promptTemplates.map((template, idx) => {
                    const Icon = templateIcons[idx] ?? Sparkles;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setPrompt(template.prompt)}
                        className="group flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-muted-foreground transition-transform duration-200 group-hover:scale-110 group-hover:text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-foreground mb-0.5">
                            {template.label}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {template.prompt}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            ) : (
              /* 对话消息列表 */
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {/* 头像 */}
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-accent text-muted-foreground"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                    </div>

                    {/* 气泡 */}
                    <div className={`flex-1 ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          message.role === "user"
                            ? "rounded-tr-sm bg-primary text-primary-foreground shadow-sm"
                            : "rounded-tl-sm border border-border bg-card text-foreground shadow-sm"
                        }`}
                      >
                        {/* 思维链（仅 AI 消息且有步骤时显示） */}
                        {message.role === "assistant" && message.thinkingSteps && message.thinkingSteps.length > 0 && (
                          <div className="mb-2.5">
                            <ThoughtChain steps={message.thinkingSteps} />
                          </div>
                        )}
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      </div>
                      <p className={`mt-1.5 px-2 text-[11px] text-muted-foreground/60 ${message.role === "user" ? "text-right" : ""}`}>
                        {new Date(message.createdAt).toLocaleTimeString("zh-CN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* 生成中指示器 */}
                {isGenerating && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-border bg-accent text-muted-foreground">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="inline-block rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-2.5 shadow-sm">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        正在思考 <PulsingDots />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 底部输入栏 */}
      <div className="sticky bottom-0 z-20 border-t border-border bg-card/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-md items-end gap-2 px-4 py-3">
          <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-input-background shadow-sm transition-all focus-within:border-primary/40 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleGenerate();
                }
              }}
              placeholder="描述你想要的网页..."
              className="max-h-32 min-h-[48px] w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              rows={1}
              disabled={isGenerating}
            />
          </div>
          <motion.button
            type="button"
            whileTap={buttonTap}
            onClick={() => void handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            title="发送"
          >
            {isGenerating ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </motion.button>
        </div>
      </div>
    </PageTransition>
  );
}
