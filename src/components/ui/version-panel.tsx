import { AnimatePresence, motion } from "motion/react";
import { Clock3, RotateCcw, X } from "lucide-react";
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
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[14px]"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-popover/95 shadow-[var(--shadow-card)] backdrop-blur-2xl"
          >
            <header className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Clock3 className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-foreground">版本历史</h2>
                  <p className="text-xs text-muted-foreground">{versions.length} 个可恢复快照</p>
                </div>
              </div>
              <motion.button
                type="button"
                whileTap={buttonTap}
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="关闭版本历史"
              >
                <X className="h-4 w-4" />
              </motion.button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {versions.length === 0 ? (
                <div className="rounded-[28px] border border-dashed border-border bg-card/70 px-5 py-10 text-center text-sm text-muted-foreground">
                  还没有历史快照。
                </div>
              ) : (
                <div className="space-y-3">
                  {versions.map((version, index) => (
                    <section
                      key={version.id}
                      className="rounded-[26px] border border-border bg-card/88 p-4 shadow-[var(--shadow-panel)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="inline-flex rounded-full bg-secondary px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                            V{version.versionNo}
                            {index === 0 ? " · 当前" : ""}
                          </div>
                          <h3 className="mt-3 text-base font-semibold text-foreground">
                            {version.summary}
                          </h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {new Date(version.createdAt).toLocaleString("zh-CN", {
                              month: "2-digit",
                              day: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            共 {Object.keys(version.files).length} 个文件
                          </p>
                        </div>

                        {index > 0 ? (
                          <motion.button
                            type="button"
                            data-testid={`restore-version-${version.id}`}
                            whileTap={buttonTap}
                            onClick={() => onRestore(version.id)}
                            className="inline-flex h-11 items-center gap-2 rounded-full bg-secondary px-4 text-sm font-medium text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          >
                            <RotateCcw className="h-4 w-4" />
                            恢复
                          </motion.button>
                        ) : null}
                      </div>
                    </section>
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  );
};
