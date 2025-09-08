

import React from "react";
import { twMerge } from "tailwind-merge";

type ButtonVariant = "primary" | "secondary" | "danger" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...rest
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none";

  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-9 px-4 text-sm",
    lg: "h-10 px-5 text-sm",
  };

  const variants: Record<ButtonVariant, string> = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300",
    danger: "bg-danger text-white hover:bg-red-700 focus:ring-danger",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-primary-500",
    ghost: "text-gray-700 hover:bg-gray-50 focus:ring-primary-500",
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