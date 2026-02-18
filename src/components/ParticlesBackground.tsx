import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  opacity: number;
  hue: number;
}

interface ParticlesBackgroundProps {
  /** Number of particles (default: 50) */
  count?: number;
  /** Base color hue for particles (0-360, default: 180 for cyan) */
  baseHue?: number;
  /** Hue variation range (default: 60) */
  hueRange?: number;
  /** Minimum particle size in px (default: 1) */
  minSize?: number;
  /** Maximum particle size in px (default: 3) */
  maxSize?: number;
  /** Speed multiplier (default: 1) */
  speed?: number;
}

/**
 * Animated particles background compatible with React
 * Optimized version of the landing page particle system
 */
export function ParticlesBackground({
  count = 50,
  baseHue = 180,
  hueRange = 60,
  minSize = 1,
  maxSize = 3,
  speed = 1,
}: ParticlesBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Initialize particles
    particlesRef.current = Array.from({ length: count }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: minSize + Math.random() * (maxSize - minSize),
      speedY: (0.05 + Math.random() * 0.15) * speed,
      speedX: (Math.random() - 0.5) * 0.1 * speed,
      opacity: 0.2 + Math.random() * 0.3,
      hue: baseHue + (Math.random() - 0.5) * hueRange,
    }));

    // Create particle elements
    const elements = particlesRef.current.map((particle) => {
      const el = document.createElement("div");
      el.className = "particle-dot";
      el.style.cssText = `
        position: absolute;
        width: ${particle.size}px;
        height: ${particle.size}px;
        background: hsl(${particle.hue}, 100%, 60%);
        border-radius: 50%;
        opacity: ${particle.opacity};
        pointer-events: none;
        will-change: transform;
      `;
      container.appendChild(el);
      return el;
    });

    // Animation loop
    const animate = () => {
      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.y -= particle.speedY;
        particle.x += particle.speedX;

        // Wrap around
        if (particle.y < -10) {
          particle.y = 110;
          particle.x = Math.random() * 100;
        }
        if (particle.x < -5) particle.x = 105;
        if (particle.x > 105) particle.x = -5;

        // Apply transform
        elements[i].style.transform =
          `translate(${particle.x}vw, ${particle.y}vh)`;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      elements.forEach((el) => el.remove());
    };
  }, [count, baseHue, hueRange, minSize, maxSize, speed]);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
