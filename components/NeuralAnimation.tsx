import React, { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
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
    const particles: Particle[] = [];
    
    let particleCount = 10; // Fewer particles
    let connectDistance = 50;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const baseSize = 36; // Original size was w-9 -> 36px
      if (rect.width > 0) {
        const scale = rect.width / baseSize;
        particleCount = Math.max(10, Math.round(10 * scale)); // Fewer particles
        connectDistance = Math.min(50 * scale, 150);
      }
      
      particles.length = 0;
      const width = rect.width;
      const height = rect.height;
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6, // Increased speed
          vy: (Math.random() - 0.5) * 0.6, // Increased speed
          radius: Math.random() * 1.0 + 0.5,
        });
      }
    };
    
    resizeCanvas();
    
    const draw = () => {
      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const radius = Math.min(width, height) / 2;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw animation content
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dist = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

          if (dist < connectDistance) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 - dist / connectDistance})`;
            ctx.lineWidth = 0.3;
            ctx.stroke();
          }
        }
      }
      
      // Apply soft circular mask
      ctx.globalCompositeOperation = 'destination-in';
      
      const gradient = ctx.createRadialGradient(centerX, centerY, radius * 0.85, centerX, centerY, radius);
      gradient.addColorStop(0, 'rgba(0,0,0,1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Restore composite operation
      ctx.globalCompositeOperation = 'source-over';
      
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
      <canvas ref={canvasRef} />
    </div>
  );
};

export default NeuralAnimation;