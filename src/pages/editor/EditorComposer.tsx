import { Loader2, Send } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { promptTemplates } from "@/features/project/templates";
import { buttonTap, SPRING_BOUNCY, SPRING_GENTLE, SPRING_PANEL } from "@/lib/animations";

interface EditorComposerProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isStarterMode: boolean;
  isGenerationActive: boolean;
  isRestoring: boolean;
  isComposerFocused: boolean;
  onFocus: () => void;
  onBlur: () => void;
}

export function EditorComposer({
  prompt,
  onPromptChange,
  onSubmit,
  isStarterMode,
  isGenerationActive,
  isRestoring,
  isComposerFocused,
  onFocus,
  onBlur,
}: EditorComposerProps) {
  const reduceMotion = useReducedMotion();

  return (
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
                onClick={() => onPromptChange(template.prompt)}
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
              onChange={(event) => onPromptChange(event.target.value)}
              onFocus={onFocus}
              onBlur={onBlur}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  onSubmit();
                }
              }}
              placeholder={
                isStarterMode
                  ? "描述你想要的网页或选择上方模板..."
                  : "继续描述你希望生成或修改的页面内容..."
              }
              className="max-h-32 min-h-[48px] flex-1 resize-none bg-transparent px-2 py-2 text-[15px] leading-6 text-foreground outline-none placeholder:text-muted-foreground"
              disabled={isGenerationActive}
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
              onClick={onSubmit}
              disabled={!prompt.trim() || isRestoring || isGenerationActive}
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-opacity disabled:opacity-40"
              title="发送需求"
            >
              {isGenerationActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
