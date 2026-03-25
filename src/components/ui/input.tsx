import type { InputHTMLAttributes } from "react";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-2xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none transition",
        "placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
        props.className ?? "",
      ].join(" ")}
    />
  );
}
