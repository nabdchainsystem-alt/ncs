import * as React from "react";

type SectionHeaderProps = {
  title: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  subtitle?: string;
  className?: string;
  /** visual container style */
  variant?: "card" | "flat"; // flat = بدون خلفية/حدود (للاستخدام داخل كارت موجود)
  size?: "md" | "lg" | "xl";        // lg = عنوان أكبر
  iconClassName?: string;    // لتغيير لون الأيقونة
};

export default function SectionHeader({
  title,
  icon,
  rightSlot,
  subtitle,
  className = "",
  variant = "card",
  size = "md",
  iconClassName = "text-gray-900",
}: SectionHeaderProps) {
  const wrap =
    variant === "card"
      ? "rounded-2xl border bg-white shadow-card px-4 py-3 "
      : "px-1 pb-1 ";
  const titleCls =
    size === "xl"
      ? "text-2xl md:text-3xl font-semibold"
      : size === "lg"
      ? "text-lg md:text-xl font-semibold"
      : "text-base font-semibold";

  const iconWrap =
    size === "xl" ? "h-9 w-9" : size === "lg" ? "h-8 w-8" : "h-7 w-7";

  return (
    <div className={wrap + className}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {icon ? (
            <span className={"inline-flex items-center justify-center " + iconWrap + " " + iconClassName}>
              {icon}
            </span>
          ) : null}
          <div className="min-w-0">
            <div className={titleCls + " text-gray-900 truncate"}>{title}</div>
            {subtitle ? <div className="text-xs text-gray-500 truncate">{subtitle}</div> : null}
          </div>
        </div>
        {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
      </div>
    </div>
  );
}