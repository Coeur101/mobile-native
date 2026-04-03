import { useNavigate } from "react-router";
import { ArrowLeft, Eye, Save, WandSparkles } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { buttonTap, iconLift, SPRING_BOUNCY, SPRING_PANEL } from "@/lib/animations";
import { formatConversationMeta } from "@/lib/formatters";
import { getGenerationLabel } from "./editor-types";
import type { Project, ProjectGenerationStatus } from "@/types";

interface EditorHeaderProps {
  project: Project | null;
  isEditingName: boolean;
  editName: string;
  onEditNameChange: (value: string) => void;
  onRenameSave: () => void;
  onStartEditing: () => void;
  onCancelEditing: () => void;
  generationStatus: ProjectGenerationStatus | "idle";
  isGenerationActive: boolean;
  isSaving: boolean;
  isRestoring: boolean;
  onSaveVersion: () => void;
  onOpenVersionPanel: () => void;
  pendingLabel: string | null;
  draftLabel: string | null;
}

export function EditorHeader({
  project,
  isEditingName,
  editName,
  onEditNameChange,
  onRenameSave,
  onStartEditing,
  onCancelEditing,
  generationStatus,
  isGenerationActive,
  isSaving,
  isRestoring,
  onSaveVersion,
  onOpenVersionPanel,
  pendingLabel,
  draftLabel,
}: EditorHeaderProps) {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const subtitle = project
    ? formatConversationMeta(project)
    : draftLabel
      ? draftLabel
      : "从一句需求开始";

  return (
    <header className="sticky top-0 z-20 border-b border-border/70 bg-background/86 pt-[env(safe-area-inset-top)] backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-md items-center justify-between gap-3 px-4">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
          animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={SPRING_PANEL}
          className="flex min-w-0 items-center gap-3"
        >
          <motion.button
            type="button"
            data-testid="editor-back-home"
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
                onChange={(event) => onEditNameChange(event.target.value)}
                onBlur={onRenameSave}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onRenameSave();
                  if (event.key === "Escape") onCancelEditing();
                }}
                autoFocus
                className="w-full rounded-[16px] border border-primary/25 bg-input-background px-3 py-1.5 text-base font-semibold text-foreground outline-none shadow-[var(--shadow-focus)]"
              />
            ) : (
              <h1
                className="truncate text-[1.1rem] font-semibold tracking-[-0.03em] text-foreground"
                onClick={project ? onStartEditing : undefined}
                title={project ? "点击编辑项目名称" : undefined}
              >
                {project ? project.name : pendingLabel ? "新会话" : "新建项目"}
              </h1>
            )}
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
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
              onClick={onSaveVersion}
              disabled={isSaving || isRestoring || isGenerationActive}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75 disabled:opacity-55"
              title={isGenerationActive ? "生成中暂不可保存版本" : "保存版本"}
            >
              <Save className="h-4 w-4" />
            </motion.button>
            <motion.button
              type="button"
              data-testid="open-version-panel"
              whileTap={buttonTap}
              whileHover={reduceMotion ? undefined : iconLift}
              transition={SPRING_BOUNCY}
              onClick={onOpenVersionPanel}
              disabled={isGenerationActive}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border/80 bg-card/92 text-foreground shadow-[var(--shadow-panel)] transition-colors hover:bg-secondary/75 disabled:opacity-55"
              title={isGenerationActive ? "生成中暂不可查看版本历史" : "版本历史"}
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
              disabled={isGenerationActive}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background shadow-[var(--shadow-panel)] disabled:opacity-40"
              title={isGenerationActive ? "生成中暂不可预览" : "预览"}
            >
              <Eye className="h-4 w-4" />
            </motion.button>
          </motion.div>
        ) : (
          <div className="w-11" />
        )}
      </div>
    </header>
  );
}
