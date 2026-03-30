import { useState } from "react";
import { Check, ChevronDown, ChevronRight, Circle, CircleAlert, Loader2 } from "lucide-react";
import type { ThinkingStep, ThinkingStepStatus } from "@/types";

const StatusIcon = ({ status }: { status: ThinkingStepStatus }) => {
  switch (status) {
    case "success":
      return <Check className="h-3.5 w-3.5 text-emerald-500" />;
    case "error":
      return <CircleAlert className="h-3.5 w-3.5 text-destructive" />;
    case "loading":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    default:
      return <Circle className="h-3 w-3 text-muted-foreground/45" />;
  }
};

const statusDotColor: Record<ThinkingStepStatus, string> = {
  success: "bg-emerald-500",
  error: "bg-destructive",
  loading: "bg-primary",
  pending: "bg-muted-foreground/30",
};

interface ThoughtChainProps {
  steps: ThinkingStep[];
  defaultCollapsed?: boolean;
}

export const ThoughtChain = ({ steps, defaultCollapsed = true }: ThoughtChainProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((current) => {
      const next = new Set(current);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  const successCount = steps.filter((step) => step.status === "success").length;
  const hasError = steps.some((step) => step.status === "error");
  const isRunning = steps.some((step) => step.status === "loading");

  return (
    <div className="overflow-hidden rounded-[22px] border border-border bg-background/70 backdrop-blur-xl">
      <button
        type="button"
        data-testid="thought-chain-toggle"
        onClick={() => setCollapsed((value) => !value)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-secondary/55"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {isRunning ? "正在生成思路" : hasError ? "思路生成完成，包含异常" : "思路生成完成"}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/70">
          {successCount}/{steps.length}
        </span>
      </button>

      {!collapsed ? (
        <div className="border-t border-border px-4 pb-3 pt-2">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isExpanded = expandedSteps.has(step.id);
            const hasContent = Boolean(step.content);

            return (
              <div key={step.id} className="relative flex gap-3">
                <div className="flex flex-col items-center pt-3">
                  <div className={`h-2.5 w-2.5 rounded-full ${statusDotColor[step.status]}`} />
                  {!isLast ? <div className="mt-1 h-full w-px bg-border" /> : null}
                </div>

                <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-3"}`}>
                  <button
                    type="button"
                    className={`flex w-full items-start gap-2 rounded-[18px] px-1 py-2 text-left ${
                      hasContent ? "cursor-pointer" : "cursor-default"
                    }`}
                    onClick={() => {
                      if (hasContent) {
                        toggleStep(step.id);
                      }
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={step.status} />
                        <span className="truncate text-sm font-medium text-foreground">
                          {step.title}
                        </span>
                      </div>
                      {step.description ? (
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          {step.description}
                        </p>
                      ) : null}
                    </div>
                    {hasContent ? (
                      isExpanded ? (
                        <ChevronDown className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60" />
                      ) : (
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 text-muted-foreground/60" />
                      )
                    ) : null}
                  </button>

                  {hasContent && isExpanded ? (
                    <div className="mt-1 rounded-[18px] bg-secondary/65 px-3 py-2 text-xs leading-5 text-muted-foreground">
                      <pre className="whitespace-pre-wrap font-sans">{step.content}</pre>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
};
