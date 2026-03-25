import { useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  Loader2,
  Circle,
} from "lucide-react";
import type { ThinkingStep, ThinkingStepStatus } from "@/types";

/** 状态图标映射 */
const StatusIcon = ({ status }: { status: ThinkingStepStatus }) => {
  switch (status) {
    case "success":
      return <Check className="h-3.5 w-3.5 text-emerald-500" />;
    case "error":
      return <CircleAlert className="h-3.5 w-3.5 text-destructive" />;
    case "loading":
      return <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />;
    case "pending":
    default:
      return <Circle className="h-3 w-3 text-muted-foreground/40" />;
  }
};

/** 状态点颜色 */
const statusDotColor: Record<ThinkingStepStatus, string> = {
  success: "bg-emerald-500",
  error: "bg-destructive",
  loading: "bg-primary",
  pending: "bg-muted-foreground/30",
};

interface ThoughtChainProps {
  steps: ThinkingStep[];
  /** 默认折叠 */
  defaultCollapsed?: boolean;
}

/** 思维链组件 — 参照 Ant Design X ThoughtChain 模式 */
export const ThoughtChain = ({ steps, defaultCollapsed = true }: ThoughtChainProps) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }
      return next;
    });
  };

  // 计算总体状态摘要
  const successCount = steps.filter((s) => s.status === "success").length;
  const hasError = steps.some((s) => s.status === "error");
  const isRunning = steps.some((s) => s.status === "loading");

  return (
    <div className="rounded-xl border border-border bg-secondary/40 text-sm">
      {/* 折叠头部 */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-secondary/60"
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-xs font-medium text-muted-foreground">
          {isRunning ? "思考中..." : hasError ? "思考完成（有异常）" : "思考过程"}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/60">
          {successCount}/{steps.length}
        </span>
      </button>

      {/* 展开的步骤列表 */}
      {!collapsed && (
        <div className="border-t border-border px-3 pb-2 pt-1">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            const isExpanded = expandedSteps.has(step.id);
            const hasContent = !!step.content;

            return (
              <div key={step.id} className="relative flex gap-2.5">
                {/* 左侧时间线 */}
                <div className="flex flex-col items-center pt-2.5">
                  {/* 状态点 */}
                  <div className={`h-2 w-2 rounded-full ${statusDotColor[step.status]} flex-shrink-0`} />
                  {/* 连接线 */}
                  {!isLast && (
                    <div className="mt-1 w-px flex-1 bg-border" />
                  )}
                </div>

                {/* 右侧内容 */}
                <div className={`flex-1 pb-3 ${isLast ? "pb-1" : ""}`}>
                  <div
                    className={`flex items-start gap-2 ${hasContent ? "cursor-pointer" : ""}`}
                    onClick={() => hasContent && toggleStep(step.id)}
                  >
                    <div className="flex-1 min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <StatusIcon status={step.status} />
                        <span className="text-xs font-medium text-foreground truncate">
                          {step.title}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                          {step.description}
                        </p>
                      )}
                    </div>
                    {hasContent && (
                      <div className="pt-0.5">
                        {isExpanded ? (
                          <ChevronDown className="h-3 w-3 text-muted-foreground/50" />
                        ) : (
                          <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* 可折叠内容 */}
                  {hasContent && isExpanded && (
                    <div className="mt-1.5 rounded-lg bg-background/60 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
                      <pre className="whitespace-pre-wrap font-sans">{step.content}</pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
