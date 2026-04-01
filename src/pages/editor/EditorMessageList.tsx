import type { RefObject } from "react";
import { Sparkles, WandSparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PulsingDots } from "@/components/ui/pulsing-dots";
import { ThoughtChain } from "@/components/ui/thought-chain";
import { SPRING_BOUNCY, SPRING_GENTLE, SPRING_PANEL } from "@/lib/animations";
import { formatMessageTime } from "@/lib/formatters";
import { getGenerationLabel } from "./editor-types";
import type { DraftAssistantState, PendingUserMessage } from "./editor-types";
import type { Project, ProjectGenerationStatus } from "@/types";

interface EditorMessageListProps {
  messages: Project["messages"];
  pendingUserMessage: PendingUserMessage | null;
  draftAssistant: DraftAssistantState | null;
  generationStatus: ProjectGenerationStatus | "idle";
  sessionTitle: string;
  sessionSummary: string;
  sessionMeta: string;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}

export function EditorMessageList({
  messages,
  pendingUserMessage,
  draftAssistant,
  generationStatus,
  sessionTitle,
  sessionSummary,
  sessionMeta,
  messagesEndRef,
}: EditorMessageListProps) {
  const reduceMotion = useReducedMotion();

  return (
    <main className="relative z-10 mx-auto flex h-[calc(100dvh-4rem)] min-h-0 w-full max-w-md flex-col px-4 pb-[calc(8.5rem+env(safe-area-inset-bottom))] pt-4">
      {/* 会话信息卡片 */}
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
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="truncate text-lg font-semibold tracking-[-0.03em] text-foreground">
                {sessionTitle}
              </h2>
              {draftAssistant ? (
                <span
                  className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                    generationStatus === "failed"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {getGenerationLabel(generationStatus)}
                </span>
              ) : null}
            </div>
            <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
              {sessionSummary}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">{sessionMeta}</p>
          </div>
        </div>
      </motion.section>

      {/* 消息列表 */}
      <div className="mt-4 min-h-0 flex-1 overflow-y-auto [overscroll-behavior:contain]">
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
                      {formatMessageTime(message.createdAt)}
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

            {/* 待确认的用户消息 */}
            {pendingUserMessage ? (
              <motion.div
                key={`pending-user-${pendingUserMessage.createdAt}`}
                layout={!reduceMotion}
                initial={reduceMotion ? undefined : { opacity: 0, y: 14, scale: 0.98 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                transition={SPRING_PANEL}
                className="flex justify-end gap-3"
              >
                <div className="max-w-[84%] items-end">
                  <motion.div
                    whileHover={reduceMotion ? undefined : { y: -2 }}
                    transition={SPRING_BOUNCY}
                    className="rounded-[24px] rounded-br-[10px] bg-foreground px-4 py-3 text-sm leading-7 text-background shadow-[var(--shadow-panel)]"
                  >
                    <p className="whitespace-pre-wrap">{pendingUserMessage.content}</p>
                  </motion.div>

                  <p className="mt-2 text-right text-[11px] text-muted-foreground">
                    {formatMessageTime(pendingUserMessage.createdAt)}
                  </p>
                </div>

                <motion.div
                  animate={reduceMotion ? undefined : { y: [0, -2, 0] }}
                  transition={reduceMotion ? undefined : { duration: 4.6, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                >
                  <WandSparkles className="h-4 w-4" />
                </motion.div>
              </motion.div>
            ) : null}

            {/* AI 草稿气泡 */}
            {draftAssistant ? (
              <motion.div
                key={`draft-assistant-${draftAssistant.startedAt}`}
                layout={!reduceMotion}
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

                <div className="max-w-[84%]">
                  <div
                    className={`rounded-[24px] rounded-bl-[10px] border px-4 py-3 text-sm leading-7 shadow-[var(--shadow-panel)] ${
                      generationStatus === "failed"
                        ? "border-destructive/25 bg-destructive/5 text-foreground"
                        : "border-border/80 bg-card/96 text-foreground"
                    }`}
                  >
                    {draftAssistant.progress.thinkingSteps.length > 0 ? (
                      <div className="mb-3">
                        <ThoughtChain
                          steps={draftAssistant.progress.thinkingSteps}
                          defaultCollapsed={generationStatus !== "streaming"}
                        />
                      </div>
                    ) : null}

                    {draftAssistant.progress.content ? (
                      <p className="whitespace-pre-wrap">{draftAssistant.progress.content}</p>
                    ) : generationStatus === "failed" ? (
                      <p className="whitespace-pre-wrap text-destructive">
                        {draftAssistant.progress.error ?? "生成失败，请稍后重试。"}
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {generationStatus === "persisting" ? "正在保存最终结果" : "正在生成内容"}
                        <PulsingDots />
                      </div>
                    )}
                  </div>

                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {formatMessageTime(draftAssistant.startedAt)} · {getGenerationLabel(generationStatus)}
                  </p>
                </div>
              </motion.div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </AnimatePresence>
      </div>
    </main>
  );
}
