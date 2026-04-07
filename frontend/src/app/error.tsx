'use client';

import { useEffect } from 'react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Unhandled error:', error);
    }, [error]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
            <div className="text-center space-y-4">
                <h2 className="text-2xl font-bold text-red-400">Something went wrong</h2>
                <p className="text-zinc-400 max-w-md">{error.message || 'An unexpected error occurred.'}</p>
                <button
                    onClick={reset}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    Try again
                </button>
            </div>
        </div>
    );
}
