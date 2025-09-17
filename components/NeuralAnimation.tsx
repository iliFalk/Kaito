import React, { useRef, useEffect } from 'react';

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
    let time = 0;
    
    let width = 0;
    let height = 0;

    const resizeCanvas = () => {
        const dpr = window.devicePixelRatio || 1;
        const rect = container.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        if (width > 0 && height > 0) {
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            canvas.style.width = `${width}px`;
            canvas.style.height = `${height}px`;
        }
    };

    resizeCanvas();
    
    const draw = () => {
      time += 0.02;

      if (width === 0 || height === 0) {
        animationFrameId = requestAnimationFrame(draw);
        return;
      }
      
      const dpr = window.devicePixelRatio || 1;

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Scale for DPR
      ctx.save();
      ctx.scale(dpr, dpr);

      const centerX = width / 2;
      const centerY = height / 2;
      const sphereRadius = Math.min(width, height) / 2 * 0.98;

      // --- Glass Sphere and Clipping ---
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.save(); // Save before clipping
      ctx.clip();

      // Fill the background of the sphere
      ctx.fillStyle = '#2b2b2b';
      ctx.fillRect(0, 0, width, height);

      // --- Water Drawing ---
      ctx.save(); // Save before rotating

      // Rocking motion
      const rockAngle = Math.sin(time * 1.5) * 0.05;
      ctx.translate(centerX, centerY);
      ctx.rotate(rockAngle);
      ctx.translate(-centerX, -centerY);

      // Water path
      const waterLevel = centerY + sphereRadius * 0.2;
      const waveAmplitude = sphereRadius * 0.05;
      const waveFrequency = 10 / width;
      const waveSpeed = 4;

      ctx.beginPath();
      // Start outside the visible sphere to ensure it fills corner to corner during rocking
      const startX = centerX - sphereRadius * 1.5;
      const endX = centerX + sphereRadius * 1.5;
      ctx.moveTo(startX, height + 10);
      ctx.lineTo(endX, height + 10);
      ctx.lineTo(endX, waterLevel);

      // Wavy surface
      for (let x = endX; x >= startX; x--) {
          const waveY = waterLevel + Math.sin(x * waveFrequency + time * waveSpeed) * waveAmplitude;
          ctx.lineTo(x, waveY);
      }
      ctx.closePath();
      
      // Water gradient
      const waterGradient = ctx.createLinearGradient(0, centerY, 0, height);
      waterGradient.addColorStop(0, 'rgba(59, 130, 246, 0.7)');
      waterGradient.addColorStop(1, 'rgba(30, 64, 175, 0.9)');
      ctx.fillStyle = waterGradient;
      ctx.fill();

      ctx.restore(); // Restore from rotation
      ctx.restore(); // Restore from clipping

      // --- Glass highlight ---
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      
      const highlightGradient = ctx.createRadialGradient(
        centerX - sphereRadius * 0.4, 
        centerY - sphereRadius * 0.4, 
        sphereRadius * 0.1, 
        centerX, 
        centerY, 
        sphereRadius
      );
      highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      highlightGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = highlightGradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore(); // Restore from scaling
      
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