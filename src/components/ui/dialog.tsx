import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X } from "lucide-react";
import { buttonTap } from "@/lib/animations";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && open) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[18px]"
            onClick={onClose}
          />

          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22 }}
            className="relative z-10 w-full max-w-md rounded-[28px] border border-border bg-popover/95 p-6 shadow-[var(--shadow-card)] backdrop-blur-2xl"
          >
            <motion.button
              type="button"
              whileTap={buttonTap}
              onClick={onClose}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-secondary/80 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="关闭弹窗"
            >
              <X className="h-4 w-4" />
            </motion.button>

            <div className="pr-10">
              <h2 className="text-[1.35rem] font-semibold text-foreground">{title}</h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
              ) : null}
            </div>

            {children ? <div className="mt-5">{children}</div> : null}

            {onConfirm ? (
              <div className="mt-6 flex gap-3">
                <motion.button
                  type="button"
                  whileTap={buttonTap}
                  onClick={onClose}
                  className="flex-1 rounded-full border border-border bg-secondary/70 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
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
                  className={`flex-1 rounded-full px-4 py-3 text-sm font-medium text-white transition-opacity hover:opacity-92 ${
                    destructive ? "bg-destructive" : "bg-primary"
                  }`}
                >
                  {confirmLabel}
                </motion.button>
              </div>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
};
