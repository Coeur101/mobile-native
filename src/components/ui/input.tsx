import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-[20px] border border-border bg-input-background px-4 py-3 text-[15px] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition duration-200",
        "placeholder:text-muted-foreground",
        "focus:border-primary/30 focus:shadow-[var(--shadow-focus)]",
        "disabled:opacity-60",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
