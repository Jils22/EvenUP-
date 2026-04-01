import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  velocity: number;
}

const COLORS = ['#C08FF5', '#42E3D0', '#E7BE29', '#F86161', '#FFFFFF'];

export function Confetti({ trigger }: { trigger: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) {
      setParticles([]);
      return;
    }

    const newParticles: Particle[] = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: 50, // center %
      y: 50, // center %
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 8 + 4,
      angle: Math.random() * 360,
      velocity: Math.random() * 15 + 10,
    }));

    setParticles(newParticles);

    const timer = setTimeout(() => setParticles([]), 3000);
    return () => clearTimeout(timer);
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti confetti-animate"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            backgroundColor: p.color,
            width: `${p.size}px`,
            height: `${p.size}px`,
            '--tx': `${Math.cos(p.angle) * p.velocity * 20}px`,
            '--ty': `${Math.sin(p.angle) * p.velocity * 20}px`,
          } as any}
        />
      ))}
      <style>{`
        .confetti-animate {
          animation: confetti-explode 2.5s cubic-bezier(0.1, 1, 0.3, 1) forwards;
        }
        @keyframes confetti-explode {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx), var(--ty)) rotate(720deg) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
