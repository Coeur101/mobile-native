import { useEffect } from "react";
import { useNavigate } from "react-router";
import { AlertCircle, AlertTriangle, Check, ChevronRight, Info, Loader2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useGlobalStatusStore, type StatusItem, type StatusSeverity } from "@/stores/use-global-status-store";
import { SPRING_PANEL, buttonTap } from "@/lib/animations";

const NETWORK_STATUS_ID = "global-network";

const SEVERITY_PRIORITY: Record<StatusSeverity, number> = {
  error: 4,
  warning: 3,
  info: 2,
  success: 1,
};

const severityStyles: Record<StatusSeverity, string> = {
  info: "border-primary/15 bg-card/95 text-foreground",
  success: "border-emerald-500/20 bg-emerald-50/90 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  warning: "border-amber-500/20 bg-amber-50/90 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  error: "border-destructive/20 bg-destructive/8 text-destructive",
};

function getStatusIcon(item: StatusItem) {
  switch (item.severity) {
    case "error":
      return AlertCircle;
    case "warning":
      return AlertTriangle;
    case "success":
      return Check;
    case "info":
      return item.dismissable ? Info : Loader2;
  }
}

function pickActiveItem(items: StatusItem[]): StatusItem | null {
  if (items.length === 0) {
    return null;
  }

  return [...items].sort(
    (a, b) =>
      SEVERITY_PRIORITY[b.severity] - SEVERITY_PRIORITY[a.severity] ||
      b.createdAt - a.createdAt,
  )[0];
}

/** 监听浏览器在线/离线事件，推送全局网络状态 */
function useNetworkMonitor() {
  const push = useGlobalStatusStore((s) => s.push);
  const dismiss = useGlobalStatusStore((s) => s.dismiss);

  useEffect(() => {
    const handleOffline = () => {
      push({
        id: NETWORK_STATUS_ID,
        severity: "error",
        message: "网络连接已断开，部分功能暂不可用",
        dismissable: false,
        autoDismissMs: null,
      });
    };

    const handleOnline = () => {
      push({
        id: NETWORK_STATUS_ID,
        severity: "success",
        message: "网络已恢复连接",
        dismissable: true,
        autoDismissMs: 3000,
      });
    };

    if (!navigator.onLine) {
      handleOffline();
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, [push, dismiss]);
}

export function GlobalStatusBar() {
  const items = useGlobalStatusStore((s) => s.items);
  const dismiss = useGlobalStatusStore((s) => s.dismiss);
  const navigate = useNavigate();

  useNetworkMonitor();

  // 自动消失定时器
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const item of items) {
      if (item.autoDismissMs !== null) {
        const elapsed = Date.now() - item.createdAt;
        const remaining = Math.max(0, item.autoDismissMs - elapsed);
        timers.push(setTimeout(() => dismiss(item.id), remaining));
      }
    }

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [items, dismiss]);

  const activeItem = pickActiveItem(items);
  const otherCount = items.length - 1;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[4.25rem] z-30">
      <div className="mx-auto max-w-md px-4">
        <AnimatePresence mode="wait">
          {activeItem ? (
            <motion.div
              key={activeItem.id}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.97 }}
              transition={SPRING_PANEL}
              className={`pointer-events-auto flex items-center gap-2.5 rounded-[20px] border px-4 py-2.5 shadow-[var(--shadow-panel)] backdrop-blur-xl ${severityStyles[activeItem.severity]}`}
            >
              <StatusIcon item={activeItem} />

              <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {activeItem.message}
              </span>

              {otherCount > 0 ? (
                <span className="flex-shrink-0 rounded-full bg-foreground/8 px-2 py-0.5 text-[11px] text-muted-foreground">
                  +{otherCount}
                </span>
              ) : null}

              {activeItem.actionLabel && activeItem.actionTo ? (
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => navigate(activeItem.actionTo!)}
                  className="flex flex-shrink-0 items-center gap-1 rounded-full bg-foreground/8 px-2.5 py-1 text-xs font-medium transition-colors hover:bg-foreground/12"
                >
                  {activeItem.actionLabel}
                  <ChevronRight className="h-3 w-3" />
                </motion.button>
              ) : null}

              {activeItem.dismissable ? (
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => dismiss(activeItem.id)}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-colors hover:bg-foreground/8"
                  aria-label="关闭通知"
                >
                  <X className="h-3.5 w-3.5" />
                </motion.button>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StatusIcon({ item }: { item: StatusItem }) {
  const Icon = getStatusIcon(item);
  const isSpinning = item.severity === "info" && !item.dismissable;

  return (
    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center">
      <Icon className={`h-4 w-4 ${isSpinning ? "animate-spin" : ""}`} />
    </div>
  );
}
