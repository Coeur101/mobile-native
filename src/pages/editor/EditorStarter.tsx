import { CloudSun, Grid2X2, Grid3X3, Sparkles, Timer } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { promptTemplates } from "@/features/project/templates";
import { buttonTap, cardLift, SPRING_GENTLE, SPRING_PANEL } from "@/lib/animations";

const templateIcons = [Grid2X2, Grid3X3, Timer, CloudSun];

interface EditorStarterProps {
  onSelectTemplate: (prompt: string) => void;
}

export function EditorStarter({ onSelectTemplate }: EditorStarterProps) {
  const reduceMotion = useReducedMotion();

  return (
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
                onClick={() => onSelectTemplate(template.prompt)}
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
  );
}
