"use client";

import { useEffect, useRef } from "react";

interface Star {
    x: number;
    y: number;
    radius: number;
    alpha: number;
    delta: number;
    speed: number;
    vx: number;
    vy: number;
}

export default function StarField() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        const stars: Star[] = [];
        const COUNT = 280;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener("resize", resize);

        // Seed stars
        for (let i = 0; i < COUNT; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 1.4 + 0.2,
                alpha: Math.random(),
                delta: (Math.random() * 0.003 + 0.0008) * (Math.random() < 0.5 ? 1 : -1),
                speed: Math.random() * 0.06 + 0.01,
                vx: (Math.random() - 0.5) * 0.008,
                vy: -(Math.random() * 0.008 + 0.003),
            });
        }

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (const s of stars) {
                // Twinkle
                s.alpha += s.delta;
                if (s.alpha <= 0.05 || s.alpha >= 1) s.delta *= -1;
                s.alpha = Math.max(0.05, Math.min(1, s.alpha));

                // Drift
                s.x += s.vx;
                s.y += s.vy;
                if (s.y < -2) s.y = canvas.height + 2;
                if (s.x < -2) s.x = canvas.width + 2;
                if (s.x > canvas.width + 2) s.x = -2;

                // Draw star with subtle blue/white hue
                const hue = Math.random() > 0.92 ? 270 : Math.random() > 0.85 ? 192 : 45;
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${hue}, 80%, 90%, ${s.alpha})`;
                ctx.fill();

                // Occasional cross-sparkle on brighter stars
                if (s.radius > 1.0 && s.alpha > 0.7) {
                    const size = s.radius * 3.5;
                    const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, size);
                    g.addColorStop(0, `hsla(${hue}, 100%, 95%, ${s.alpha * 0.6})`);
                    g.addColorStop(1, "transparent");
                    ctx.fillStyle = g;
                    ctx.fillRect(s.x - size, s.y - size, size * 2, size * 2);
                }
            }

            animationId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: "transparent" }}
        />
    );
}
