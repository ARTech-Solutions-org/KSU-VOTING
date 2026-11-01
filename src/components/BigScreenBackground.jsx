import React, { useEffect, useRef } from 'react';

export default function BigScreenBackground({ rippleTrigger }) {
  const canvasRef = useRef(null);
  const rippleRef = useRef({ active: false, radius: 0, maxRadius: 1200, alpha: 0, x: 960, y: 540 });

  // Trigger ripple when rippleTrigger prop changes
  useEffect(() => {
    if (rippleTrigger) {
      rippleRef.current = {
        active: true,
        radius: 40,
        maxRadius: 1600,
        alpha: 0.7,
        x: 960, // center
        y: 600,
      };
    }
  }, [rippleTrigger]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    const width = (canvas.width = 1920);
    const height = (canvas.height = 1080);

    // Subtle ambient floating particles (clean and unobtrusive)
    const particleCount = 45;
    const particles = [];
    const colors = ['rgba(0, 242, 254, ', 'rgba(39, 179, 115, ', 'rgba(255, 255, 255, '];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * width,
        y: 350 + Math.random() * (height - 350), // Confined strictly to lower gradient
        size: Math.random() * 2 + 0.8,
        speedY: -(Math.random() * 0.35 + 0.1),
        speedX: (Math.random() - 0.5) * 0.15,
        opacity: Math.random() * 0.4 + 0.15,
        colorPrefix: colors[Math.floor(Math.random() * colors.length)],
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Render floating particles
      for (let i = 0; i < particleCount; i++) {
        const p = particles[i];
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulse += 0.025;

        // Wrap around within gradient area
        if (p.y < 340) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        const currentOpacity = p.opacity * (0.6 + 0.4 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.colorPrefix}${currentOpacity})`;
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Render expanding circular ripple only on vote
      const r = rippleRef.current;
      if (r.active) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(0, 242, 254, ${r.alpha})`;
        ctx.lineWidth = 5 * (1 - r.radius / r.maxRadius);
        ctx.shadowColor = '#00f2fe';
        ctx.shadowBlur = 20;
        ctx.stroke();

        if (r.radius > 80) {
          ctx.beginPath();
          ctx.arc(r.x, r.y, r.radius - 60, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(39, 179, 115, ${r.alpha * 0.6})`;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        ctx.restore();

        r.radius += 20;
        r.alpha *= 0.96;
        if (r.radius >= r.maxRadius || r.alpha < 0.01) {
          r.active = false;
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 bg-[#081a2e]">
      {/* Background requested by user: assets/background/background-pattern.png with majestic pattern drift */}
      <img
        src="/assets/background/background-pattern.png"
        alt="KSU Event Background"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none animate-pattern-drift"
      />

      {/* Subtle ambient light sweep across stage */}
      <div className="stage-light-sweep absolute inset-0 pointer-events-none" />

      {/* GPU Canvas for subtle particles and vote ripple only */}
      <canvas
        ref={canvasRef}
        width={1920}
        height={1080}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  );
}
