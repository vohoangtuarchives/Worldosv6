"use client";

import React from "react";

interface WorldScarsListProps {
    scars: string[] | undefined;
}

/**
 * Hiển thị danh sách World Scars từ universe.state_vector.scars.
 * Scars là các vết sẹo thế giới (trauma dài hạn) sau biến cố lớn.
 */
export function WorldScarsList({ scars }: WorldScarsListProps) {
    const list = Array.isArray(scars) ? scars : [];
    const items = list.map((s) => (typeof s === "string" ? s : (s as { name?: string })?.name ?? String(s)));

    if (items.length === 0) {
        return (
            <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 backdrop-blur">
                <h3 className="tracking-tight text-sm font-medium mb-2">World Scars</h3>
                <p className="text-xs text-muted-foreground">Không có vết sẹo</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-4 backdrop-blur">
            <h3 className="tracking-tight text-sm font-medium mb-2">World Scars</h3>
            <div className="flex flex-wrap gap-2">
                {items.map((label) => (
                    <span
                        key={label}
                        className="inline-flex items-center rounded-md bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-400 border border-red-500/30"
                    >
                        {formatScarLabel(label)}
                    </span>
                ))}
            </div>
        </div>
    );
}

function formatScarLabel(slug: string): string {
    return slug
        .split(/[_\s]+/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}
