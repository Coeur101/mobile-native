import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { buttonTap } from "@/lib/animations";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  /** 确认按钮文字 */
  confirmLabel?: string;
  /** 取消按钮文字 */
  cancelLabel?: string;
  /** 确认按钮是否为危险操作样式 */
  destructive?: boolean;
  onConfirm?: () => void;
}

export const Dialog = ({
  open,
  onClose,
  title,
  description,
  children,
  confirmLabel = "确认",
  cancelLabel = "取消",
  destructive = false,
  onConfirm,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  // ESC 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // 打开时禁止背景滚动
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 对话框 */}
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 mx-4 w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-xl"
          >
            {/* 关闭按钮 */}
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary"
            >
              <X className="h-4 w-4" />
            </motion.button>

            {/* 标题 */}
            <h2 className="pr-8 text-lg font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            )}

            {/* 自定义内容 */}
            {children && <div className="mt-4">{children}</div>}

            {/* 操作按钮 */}
            {onConfirm && (
              <div className="mt-6 flex gap-3">
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={onClose}
                  className="flex-1 rounded-2xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                >
                  {cancelLabel}
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={() => {
                    onConfirm();
                    onClose();
                  }}
                  className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors ${
                    destructive
                      ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
