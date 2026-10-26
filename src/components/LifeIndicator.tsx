import React, { useEffect, useRef, useState } from 'react';
import { getBallColor } from '../config/ballColors';

interface LifeIndicatorProps {
  life: number;
  maxLife: number;
  maxBallValue: number;
}

export const LifeIndicator: React.FC<LifeIndicatorProps> = ({ life, maxLife, maxBallValue }) => {
  const items = Array.from({ length: maxLife }, (_, i) => i < life);
  const previousLife = useRef(life);
  const [appearingFrom, setAppearingFrom] = useState<number | null>(null);

  useEffect(() => {
    const previous = previousLife.current;
    previousLife.current = life;
    if (life <= previous) {
      setAppearingFrom(null);
      return;
    }

    setAppearingFrom(previous);
    const timeout = window.setTimeout(() => setAppearingFrom(null), 240);
    return () => window.clearTimeout(timeout);
  }, [life]);

  const color = getBallColor(maxBallValue);

  return (
    <div className="flex items-center gap-2 select-none py-1">
      <span className="text-[19px] sm:text-[20px] font-black text-black tracking-tight">
        생명 :
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {items.map((isActive, index) => (
          <div
            key={index}
            className="w-8 h-8 rounded-full relative transition-all duration-200"
            style={{
              animation: isActive && appearingFrom !== null && index >= appearingFrom
                ? 'life-orb-appear 240ms ease-out both'
                : undefined,
              background: isActive
                ? `radial-gradient(circle at 35% 30%, ${color.gradientStart} 0%, ${color.primary} 45%, ${color.gradientEnd} 100%)`
                : 'radial-gradient(circle at 35% 30%, #A3A3A3 0%, #666666 55%, #383838 100%)',
              boxShadow: isActive
                ? `0 1px 3px ${color.shadowColor}, inset -1px -1px 2px rgba(0,0,0,0.35)`
                : '0 1px 2px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {/* Top-right curved shine highlight as in original game balls */}
            <div
              className="absolute top-0.5 right-1 w-3 h-2 rounded-full"
              style={{
                background: isActive ? 'rgba(255, 255, 255, 0.88)' : 'rgba(255, 255, 255, 0.35)',
                filter: 'blur(0.3px)',
                transform: 'rotate(-20deg)',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
