import React from "react";

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> { }

export function ScrollArea({ className = "", children, ...props }: ScrollAreaProps) {
    return (
        <div
            className={`overflow-auto ${className}`}
            style={{ scrollbarWidth: "thin", scrollbarColor: "#334155 transparent" }}
            {...props}
        >
            {children}
        </div>
    );
}
