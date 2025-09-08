

import React from "react";
import { twMerge } from "tailwind-merge";

/**
 * Card primitives (shadcn-style API) with TailAdmin tokens
 * Usage:
 *  <Card>
 *    <CardHeader>
 *      <CardTitle>Title</CardTitle>
 *      <CardDescription>Optional description</CardDescription>
 *    </CardHeader>
 *    <CardContent>...</CardContent>
 *    <CardFooter>...</CardFooter>
 *  </Card>
 */

export function Card({
  className,
  children,
  as: As = "div",
  interactive = false,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { as?: any; interactive?: boolean }) {
  const base = "bg-white shadow-card rounded-2xl";
  const padding = "p-6";
  const hover = interactive ? "transition-shadow hover:shadow-lg-soft" : "";
  return (
    <As className={twMerge(base, padding, hover, className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("mb-4", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={twMerge("text-lg font-semibold tracking-tight", className)} {...rest}>
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={twMerge("text-gray-600 text-sm mt-1", className)} {...rest}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("space-y-3", className)} {...rest}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={twMerge("mt-5 pt-4 border-t border-gray-200", className)} {...rest}>
      {children}
    </div>
  );
}

export default Card;