'use client';

import React, { useRef, useEffect, useState } from 'react';

const EntityFluxMap = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blips, setBlips] = useState<{ x: number; y: number; opacity: number; life: number }[]>([]);

  useEffect(() => {
    // Generate initial blips
    const initialBlips = Array.from({ length: 12 }, () => ({
      x: Math.random() * 200 - 100,
      y: Math.random() * 200 - 100,
      opacity: Math.random(),
      life: Math.random() * 100
    }));
    setBlips(initialBlips);

    const interval = setInterval(() => {
      setBlips(prev => prev.map(b => {
        const newLife = b.life - 1;
        if (newLife <= 0) {
          return {
            x: Math.random() * 200 - 100,
            y: Math.random() * 200 - 100,
            opacity: 1,
            life: 100
          };
        }
        return { ...b, life: newLife, opacity: newLife / 100 };
      }));
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let rotation = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      // Draw Rings
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw Crosshair
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.stroke();

      // Draw Scanner Line
      rotation += 0.02;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotation);
      const gradient = ctx.createLinearGradient(0, 0, radius, 0);
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0.4)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, -0.2, 0.2);
      ctx.lineTo(0, 0);
      ctx.fill();
      ctx.restore();

      // Find the "Hero" (Narrative Gravity) - bit with highest life in this simulation
      const hero = [...blips].sort((a, b) => b.life - a.life)[0];

      // Draw Neural Web (Connections between nearby blips)
      ctx.lineWidth = 0.5;
      for (let i = 0; i < blips.length; i++) {
        for (let j = i + 1; j < blips.length; j++) {
          const b1 = blips[i];
          const b2 = blips[j];
          const dist = Math.sqrt(Math.pow(b1.x - b2.x, 2) + Math.pow(b1.y - b2.y, 2));
          
          if (dist < 40) {
            const x1 = centerX + (b1.x / 100) * radius;
            const y1 = centerY + (b1.y / 100) * radius;
            const x2 = centerX + (b2.x / 100) * radius;
            const y2 = centerY + (b2.y / 100) * radius;
            
            ctx.strokeStyle = `rgba(139, 92, 246, ${(1 - dist / 40) * 0.2})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
      }

      // Draw Blips
      blips.forEach(blip => {
        const x = centerX + (blip.x / 100) * radius;
        const y = centerY + (blip.y / 100) * radius;
        const isHero = blip === hero;
        
        ctx.fillStyle = isHero ? `rgba(244, 114, 182, ${blip.opacity})` : `rgba(139, 92, 246, ${blip.opacity})`;
        ctx.shadowBlur = isHero ? 15 : 10;
        ctx.shadowColor = isHero ? '#f472b6' : '#8b5cf6';
        
        ctx.beginPath();
        ctx.arc(x, y, isHero ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fill();
        
        if (isHero) {
          // Narrative Gravity Ring
          ctx.strokeStyle = `rgba(244, 114, 182, ${blip.opacity * 0.5})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(x, y, 7 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
          ctx.stroke();
          
          ctx.font = '7px monospace';
          ctx.fillText('PROTAGONIST_SIG', x + 8, y - 8);
        }
        
        ctx.shadowBlur = 0;
      });

      // Overlay text
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(139, 92, 246, 0.7)';
      ctx.fillText('SQ_QUADRANT_ALPHA', 10, 15);
      ctx.fillText(`ENTITIES: ${blips.length}`, 10, 25);
      ctx.fillText('RADAR_SCAN: ACTIVE', canvas.width - 80, 15);

      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [blips]);

  return (
    <div className="w-full h-full min-h-[250px] relative bg-void/50 backdrop-blur-3xl rounded-[var(--radius)] border border-cosmos/20 flex items-center justify-center p-4">
      <div className="absolute top-4 left-5 z-20 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-cosmos/80 animate-ping" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text- cosmos/80">Entity Flux Map</h3>
      </div>
      
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={300} 
        className="w-full h-full max-w-[250px] max-h-[250px] border border-cosmos/10 rounded-full"
      />
      
      {/* Glitch Overlay Effect */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
    </div>
  );
};

export default EntityFluxMap;
