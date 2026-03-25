import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-border bg-input-background px-3 py-2 text-sm text-foreground outline-none transition",
        "placeholder:text-muted-foreground",
        "focus:border-primary/40 focus:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]",
        "dark:focus:shadow-[0_0_0_3px_rgba(167,139,250,0.1)]",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
