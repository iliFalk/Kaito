import React from 'react';
const { useRef, useEffect } = React;

const NeuralAnimation = ({ className }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    const particles = [];
    const particleCount = 50;
    let time = Math.random() * 100;

    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let sphereRadius = 0;

    const shades = ['80,80,80', '100,100,100', '120,120,120', '140,140,140'];

    const createParticle = () => {
      // Originate near the bottom center
      const angle = Math.PI + (Math.random() - 0.5) * Math.PI * 0.8;
      const dist = Math.random() * sphereRadius * 0.4;
      
      return {
        x: centerX + Math.cos(angle) * dist,
        y: centerY + Math.sin(angle) * dist,
        radius: Math.random() * sphereRadius * 0.4 + sphereRadius * 0.1,
        color: shades[Math.floor(Math.random() * shades.length)],
        life: 0,
        maxLife: Math.random() * 150 + 100,
        speed: Math.random() * 0.5 + 0.2,
        drift: - (Math.random() * 0.3 + 0.1), // Upward drift
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
        // Initialize with some life already so they don't all pop in at once
        const p = createParticle();
        p.life = Math.random() * p.maxLife;
        particles.push(p);
      }
    };

    resizeCanvas();

    const draw = () => {
      time += 0.008;

      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, sphereRadius, 0, Math.PI * 2);
      ctx.clip();
      
      // This filter is key to the smoke/metaball effect
      ctx.filter = `blur(${sphereRadius * 0.1}px) contrast(25) brightness(1.0)`;

      particles.forEach((p, index) => {
        // Update particle
        const angle = Math.sin(p.x * 0.01 + time) + Math.cos(p.y * 0.01 + time);
        p.x += Math.cos(angle) * p.speed;
        p.y += Math.sin(angle) * p.speed + p.drift;
        
        p.life++;
        
        const distFromCenter = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));

        if (p.life > p.maxLife || distFromCenter > sphereRadius * 1.5) {
            particles[index] = createParticle();
        }
        
        // Draw particle
        ctx.beginPath();
        // Fade in at the start, fade out at the end
        const opacity = Math.sin((p.life / p.maxLife) * Math.PI);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        
        gradient.addColorStop(0, `rgba(${p.color}, ${opacity * 0.8})`);
        gradient.addColorStop(0.5, `rgba(${p.color}, ${opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(${p.color}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore(); // This removes the filter and clipping path
      
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
    React.createElement('div', { ref: containerRef, className: className ?? "w-9 h-9" },
      React.createElement('canvas', { ref: canvasRef, style: { borderRadius: '50%' } })
    )
  );
};

export default NeuralAnimation;
