import { motion, AnimatePresence } from "motion/react";
import { Clock, RotateCcw, X } from "lucide-react";
import { buttonTap } from "@/lib/animations";
import type { ProjectVersion } from "@/types";

interface VersionPanelProps {
  open: boolean;
  onClose: () => void;
  versions: ProjectVersion[];
  onRestore: (versionId: string) => void;
}

export const VersionPanel = ({ open, onClose, versions, onRestore }: VersionPanelProps) => {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-card shadow-2xl"
          >
            <div className="flex h-14 items-center justify-between border-b border-border px-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground">版本历史</h2>
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                  {versions.length}
                </span>
              </div>
              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="h-[calc(100vh-3.5rem)] overflow-y-auto p-4">
              {versions.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">暂无版本记录</div>
              ) : (
                <div className="relative space-y-0">
                  <div className="absolute bottom-2 left-3.5 top-2 w-px bg-border" />

                  {versions.map((version, idx) => (
                    <div key={version.id} className="relative flex gap-4 pb-6">
                      <div
                        className={`relative z-10 mt-1 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium ${
                          idx === 0
                            ? "bg-primary text-primary-foreground"
                            : "border border-border bg-card text-muted-foreground"
                        }`}
                      >
                        {version.versionNo}
                      </div>

                      <div className="flex-1 rounded-2xl border border-border bg-background p-3">
                        <p className="text-sm font-medium text-foreground">{version.summary}</p>
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {new Date(version.createdAt).toLocaleString("zh-CN", {
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {" · "}
                          {Object.keys(version.files).length} 个文件
                        </p>

                        {idx > 0 ? (
                          <motion.button
                            type="button"
                            data-testid={`restore-version-${version.id}`}
                            whileTap={buttonTap}
                            onClick={() => onRestore(version.id)}
                            className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/80"
                          >
                            <RotateCcw className="h-3 w-3" />
                            恢复此版本
                          </motion.button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};
