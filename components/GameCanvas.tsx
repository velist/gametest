
import React, { useEffect, useRef, useState } from 'react';
import { GodState, Era, VisualParticle, GameMode, AvatarState } from '../types';

interface GameCanvasProps {
  state: GodState;
  timeSpeed: number;
  visualQueue: string | null;
  mode: GameMode;
  avatar: AvatarState;
  onAvatarMove: (x: number, y: number) => void;
}

const ERA_COLORS = {
  [Era.StoneAge]: { primary: '#4ADE80', secondary: '#14532D', glow: '#22c55e', bg: '#050505' }, 
  [Era.BronzeAge]: { primary: '#FACC15', secondary: '#713F12', glow: '#eab308', bg: '#0f0a00' }, 
  [Era.IronAge]: { primary: '#F87171', secondary: '#7F1D1D', glow: '#ef4444', bg: '#1a0505' }, 
  [Era.ModernAge]: { primary: '#22D3EE', secondary: '#0E7490', glow: '#06b6d4', bg: '#00111a' }, 
  [Era.FutureAge]: { primary: '#D946EF', secondary: '#701A75', glow: '#c026d3', bg: '#11001a' }, 
};

const GameCanvas: React.FC<GameCanvasProps> = ({ state, timeSpeed, visualQueue, mode, avatar, onAvatarMove }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const particlesRef = useRef<VisualParticle[]>([]);
  const ripplesRef = useRef<{x: number, y: number, age: number}[]>([]);
  
  // Camera State
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const isDragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const dragStart = useRef({ x: 0, y: 0 });

  // -- Initialization & Particle Logic --
  useEffect(() => {
    for (let i = 0; i < 50; i++) {
      particlesRef.current.push(createParticle(0, 0, ERA_COLORS[state.currentEra].primary));
    }
  }, []);

  const createParticle = (x: number, y: number, color: string): VisualParticle => ({
    x, y,
    vx: (Math.random() - 0.5) * 2,
    vy: (Math.random() - 0.5) * 2,
    life: 1.0,
    color,
    size: Math.random() * 2 + 1
  });

  // Handle Visual Queue
  useEffect(() => {
    if (visualQueue) {
      const count = visualQueue === 'bloom' ? 100 : 30;
      const color = visualQueue === 'meteor' ? '#ff0000' : 
                    visualQueue === 'bloom' ? '#00ff00' : '#ffffff';
      
      for(let i=0; i<count; i++) {
        particlesRef.current.push(createParticle((Math.random()-0.5)*500, (Math.random()-0.5)*500, color));
      }
    }
  }, [visualQueue]);

  // -- Render Loop --
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const theme = ERA_COLORS[state.currentEra];

    // 1. Camera Logic
    let currentZoom = camera.zoom;
    let camX = camera.x;
    let camY = camera.y;

    // If in "Walker" mode (Descended), we simulate a paused/slow background look
    // but we keep rendering particles for atmosphere.
    // We don't need smooth follow anymore as the UI is an overlay.

    currentZoom += (1.0 - currentZoom) * 0.05; // Default zoom
    
    // 2. Clear & Background
    ctx.fillStyle = `${theme.bg}33`; // 20% opacity for trail
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    
    // Apply Camera Transform
    const renderX = width/2 + camera.x;
    const renderY = height/2 + camera.y;
    const renderZoom = camera.zoom;
    
    ctx.translate(renderX, renderY);
    ctx.scale(renderZoom, renderZoom);

    // 3. Draw Grid
    drawGrid(ctx, theme.secondary, state.currentEra);

    // 4. Draw Ripples (Feedback)
    ripplesRef.current.forEach((r, i) => {
       r.age += 0.02;
       ctx.beginPath();
       ctx.arc(r.x, r.y, r.age * 50, 0, Math.PI * 2);
       ctx.strokeStyle = `rgba(255, 255, 255, ${1 - r.age})`;
       ctx.lineWidth = 2;
       ctx.stroke();
       if (r.age > 1) ripplesRef.current.splice(i, 1);
    });

    // 5. Particles
    const targetParticles = Math.min(state.resources.population / 2, 500);
    if (particlesRef.current.length < targetParticles) {
       particlesRef.current.push(createParticle((Math.random()-0.5)*1000, (Math.random()-0.5)*1000, theme.primary));
    }

    particlesRef.current.forEach((p, i) => {
      p.x += p.vx * timeSpeed;
      p.y += p.vy * timeSpeed;

      // Simple Orbit Logic
      const dist = Math.hypot(p.x, p.y);
      if (dist > 1500) {
         p.vx *= -1; p.vy *= -1; // Bounce back
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.shadowBlur = 10;
      ctx.shadowColor = theme.glow;
      ctx.fill();
      ctx.shadowBlur = 0;
      
      // Randomly kill particles
      if (Math.random() > 0.995) particlesRef.current.splice(i, 1);
    });

    // 6. Draw City Center
    const citySize = 20 + Math.log(state.resources.population + 1) * 5;
    ctx.beginPath();
    ctx.arc(0, 0, citySize, 0, Math.PI * 2);
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = theme.glow;
    ctx.stroke();

    ctx.restore();
    requestRef.current = requestAnimationFrame(animate);
  };

  const drawGrid = (ctx: CanvasRenderingContext2D, color: string, era: Era) => {
     ctx.strokeStyle = color;
     ctx.lineWidth = 0.5;
     ctx.globalAlpha = 0.2;
     
     const step = 100;
     const limit = 2000;
     
     ctx.beginPath();
     for(let x = -limit; x <= limit; x += step) {
        ctx.moveTo(x, -limit); ctx.lineTo(x, limit);
     }
     for(let y = -limit; y <= limit; y += step) {
        ctx.moveTo(-limit, y); ctx.lineTo(limit, y);
     }
     ctx.stroke();
     ctx.globalAlpha = 1.0;
  };

  // -- Interaction --

  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
     const canvas = canvasRef.current;
     if (!canvas) return { x: 0, y: 0 };
     const rect = canvas.getBoundingClientRect();
     
     const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
     const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
     
     return {
         x: clientX - rect.left,
         y: clientY - rect.top
     };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
     if (mode === 'walker') return; // No pan in Life Sim mode
     isDragging.current = true;
     const pos = getCanvasCoordinates(e);
     lastPos.current = pos;
     dragStart.current = pos;
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
     if (!isDragging.current) return;
     const pos = getCanvasCoordinates(e);
     
     // If in God Mode: Pan Camera
     if (mode === 'god') {
         const dx = pos.x - lastPos.current.x;
         const dy = pos.y - lastPos.current.y;
         setCamera(p => ({ ...p, x: p.x + dx, y: p.y + dy }));
     }
     
     lastPos.current = pos;
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
     isDragging.current = false;
     
     // Check if it was a Tap/Click (minimal movement)
     const pos = lastPos.current; // Last known position
     const dist = Math.hypot(pos.x - dragStart.current.x, pos.y - dragStart.current.y);
     
     if (dist < 5 && mode === 'god') {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const width = canvas.width;
        const height = canvas.height;
        const worldX = (pos.x - (width/2 + camera.x)) / camera.zoom;
        const worldY = (pos.y - (height/2 + camera.y)) / camera.zoom;

        ripplesRef.current.push({ x: worldX, y: worldY, age: 0 });
     }
  };

  const handleWheel = (e: React.WheelEvent) => {
      if (mode === 'walker') return;
      const delta = -Math.sign(e.deltaY) * 0.1;
      setCamera(p => ({ ...p, zoom: Math.max(0.2, Math.min(3, p.zoom + delta)) }));
  };

  // Resize
  useEffect(() => {
     requestRef.current = requestAnimationFrame(animate);
     const handleResize = () => {
        if (canvasRef.current) {
           canvasRef.current.width = window.innerWidth;
           canvasRef.current.height = window.innerHeight;
        }
     };
     window.addEventListener('resize', handleResize);
     handleResize();
     return () => {
        if (requestRef.current) cancelAnimationFrame(requestRef.current);
        window.removeEventListener('resize', handleResize);
     };
  }, [state, timeSpeed, camera, mode]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 touch-none transition-all duration-1000 ${mode === 'walker' ? 'pixelated scale-110 blur-sm brightness-50' : 'cursor-move'}`}
      style={{ imageRendering: mode === 'walker' ? 'pixelated' : 'auto' }}
      onMouseDown={handleStart}
      onMouseMove={handleMove}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchMove={handleMove}
      onTouchEnd={handleEnd}
      onWheel={handleWheel}
    />
  );
};

export default GameCanvas;
