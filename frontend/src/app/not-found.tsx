import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
            <div className="text-center space-y-4">
                <h2 className="text-4xl font-bold text-zinc-300">404</h2>
                <p className="text-zinc-400">Page not found</p>
                <Link
                    href="/"
                    className="inline-block px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
                >
                    Return Home
                </Link>
            </div>
        </div>
    );
}
