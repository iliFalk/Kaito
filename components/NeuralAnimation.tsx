import React, { useRef, useEffect } from 'react';

interface SmokeParticle {
  x: number;
  y: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  speed: number;
  driftX: number;
  driftY: number;
}

const NeuralAnimation: React.FC<{ className?: string }> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: SmokeParticle[] = [];
    const particleCount = 30;
    let time = Math.random() * 100;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let sphereRadius = 0;

    const shades = ['65, 105, 225', '100, 149, 237', '173, 216, 230', '240, 248, 255'];

    const createParticle = (): SmokeParticle => {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * sphereRadius * 0.9;
      
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        radius: Math.random() * sphereRadius * 0.6 + sphereRadius * 0.2,
        color: shades[Math.floor(Math.random() * shades.length)],
        life: 0,
        maxLife: Math.random() * 200 + 150,
        speed: Math.random() * 0.2 + 0.05,
        driftX: (Math.random() - 0.5) * 0.1,
        driftY: (Math.random() - 0.5) * 0.1,
      };
    };

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      width = rect.width;
      height = rect.height;
      centerX = width / 2;
      centerY = height / 2;
      sphereRadius = Math.min(width, height) / 2;
      
      particles.length = 0;
      for (let i = 0; i < particleCount; i++) {
        const p = createParticle();
        p.life = Math.random() * p.maxLife;
        particles.push(p);
      }
    };

    resizeCanvas();

    const draw = () => {
      time += 0.005;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.clip();
      
      ctx.filter = `blur(${sphereRadius * 0.15}px) contrast(20)`;
      
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, width, height);

      particles.forEach((p, index) => {
        const angle = Math.sin(p.x * 0.01 + time) + Math.cos(p.y * 0.01 + time);
        p.x += Math.cos(angle) * p.speed + p.driftX;
        p.y += Math.sin(angle) * p.speed + p.driftY;
        
        p.life++;
        
        const distFromCenter = Math.sqrt((p.x - centerX)**2 + (p.y - centerY)**2);

        if (p.life > p.maxLife || distFromCenter > sphereRadius * 1.5) {
            particles[index] = createParticle();
        }
        
        ctx.beginPath();
        const opacity = Math.sin((p.life / p.maxLife) * Math.PI);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        
        gradient.addColorStop(0, `rgba(${p.color}, ${opacity * 0.5})`);
        gradient.addColorStop(0.5, `rgba(${p.color}, ${opacity * 0.2})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      
      animationFrameId = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <div ref={containerRef} className={className ?? "w-9 h-9"}>
      <canvas ref={canvasRef} style={{ borderRadius: '50%' }} />
    </div>
  );
};

export default NeuralAnimation;