import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "xs";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

function classNames(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "secondary",
  size = "sm",
  className,
  children,
  ...rest
}: ButtonProps) {
  const sizeClasses = size === "xs" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm";

  const variantClasses =
    variant === "primary"
      ? "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500"
      : variant === "danger"
      ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
      : variant === "ghost"
      ? "border-transparent text-slate-700 hover:bg-slate-100"
      : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100";

  return (
    <button
      className={classNames(
        "inline-flex items-center justify-center rounded border font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed",
        sizeClasses,
        variantClasses,
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
