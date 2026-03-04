import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: "default" | "outline" | "secondary" | "destructive";
}

const variantClasses: Record<string, string> = {
    default: "bg-blue-600 text-white",
    outline: "border border-slate-700 text-slate-300",
    secondary: "bg-slate-700 text-slate-200",
    destructive: "bg-red-600 text-white",
};

export function Badge({ className = "", variant = "default", children, ...props }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
}
