import { useMemo } from 'react';
import { generateStars } from '@/utils/helpers';

export default function StarryBackground() {
  const stars = useMemo(() => generateStars(120), []);
  const shootingStars = useMemo(
    () => [
      { id: 1, top: '10%', left: '-10%', delay: '0s' },
      { id: 2, top: '30%', left: '-20%', delay: '3s' },
      { id: 3, top: '55%', left: '-5%', delay: '7s' },
      { id: 4, top: '75%', left: '-15%', delay: '11s' },
    ],
    []
  );

  return (
    <div className="stars-bg">
      <div className="absolute inset-0 bg-starry-sky" />
      <div className="absolute inset-0 bg-nebula-glow opacity-60" />

      {stars.map((star) => (
        <div
          key={star.id}
          className="star animate-twinkle"
          style={{
            left: `${star.left}%`,
            top: `${star.top}%`,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
          }}
        />
      ))}

      {shootingStars.map((s) => (
        <div
          key={s.id}
          className="shooting-star animate-shooting-star"
          style={{
            top: s.top,
            left: s.left,
            animationDelay: s.delay,
            animationIterationCount: 'infinite',
          }}
        />
      ))}

      <div
        className="absolute w-96 h-96 rounded-full blur-3xl opacity-30 animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(114,9,183,0.5) 0%, transparent 70%)',
          top: '10%',
          left: '5%',
        }}
      />
      <div
        className="absolute w-80 h-80 rounded-full blur-3xl opacity-25 animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(76,201,240,0.5) 0%, transparent 70%)',
          bottom: '20%',
          right: '10%',
          animationDelay: '3s',
        }}
      />
      <div
        className="absolute w-64 h-64 rounded-full blur-3xl opacity-20 animate-float-slow"
        style={{
          background: 'radial-gradient(circle, rgba(247,37,133,0.5) 0%, transparent 70%)',
          top: '50%',
          right: '30%',
          animationDelay: '5s',
        }}
      />
    </div>
  );
}
