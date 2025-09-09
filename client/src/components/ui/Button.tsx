

import React from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "xs" | "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

  const sizes: Record<ButtonSize, string> = {
    xs: "h-7 px-2 text-xs",
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-5 text-base",
    lg: "h-11 px-6 text-lg",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus:ring-primary-500",
    secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400 focus:ring-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-500",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-primary-500",
    ghost: "text-gray-700 hover:bg-gray-100 active:bg-gray-200 focus:ring-primary-500",
  };

  return (
    <button
      className={twMerge(base, sizes[size], variants[variant], className)}
      {...rest}
    >
      {children}
    </button>
  );
}
export default Button;