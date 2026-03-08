import { type ReactNode } from "react";

/** Wrapper thống nhất cho nội dung trang: container, padding, min-height */
export function PageContainer({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`container mx-auto px-4 py-6 flex-1 min-h-0 ${className}`}>
      {children}
    </div>
  );
}
