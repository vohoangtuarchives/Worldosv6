import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "default" | "ghost" | "outline" | "destructive";
    size?: "default" | "sm" | "lg" | "icon";
}

const variantClasses: Record<string, string> = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    ghost: "bg-transparent hover:bg-slate-800 text-slate-300",
    outline: "border border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300",
    destructive: "bg-red-600 text-white hover:bg-red-700",
};

const sizeClasses: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-8 px-3 text-xs",
    lg: "h-12 px-8 text-base",
    icon: "h-9 w-9",
};

export function Button({ className = "", variant = "default", size = "default", children, ...props }: ButtonProps) {
    const v = variantClasses[variant] ?? variantClasses.default;
    const s = sizeClasses[size] ?? sizeClasses.default;
    return (
        <button
            className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 ${v} ${s} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
}
