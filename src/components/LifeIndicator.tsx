import React, { useLayoutEffect, useRef } from 'react';
import { getBallColor } from '../config/ballColors';

interface LifeIndicatorProps {
  life: number;
  maxLife: number;
  maxBallValue: number;
  revision: number;
  changedSlots: number[];
}

export const LifeIndicator: React.FC<LifeIndicatorProps> = ({ life, maxLife, maxBallValue, revision, changedSlots }) => {
  const items = Array.from({ length: maxLife }, (_, i) => i < life);
  const orbs = useRef(new Map<number, HTMLDivElement>());

  useLayoutEffect(() => {
    for (const index of changedSlots) {
      const orb = orbs.current.get(index);
      if (!orb) continue;
      orb.getAnimations().forEach((animation) => animation.cancel());
      orb.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(1.35)', offset: 0.35 },
        { transform: 'scale(1)' },
      ], { duration: 260, easing: 'ease-out' });
    }
  }, [revision, changedSlots]);

  const color = getBallColor(maxBallValue);

  return (
    <div className="flex items-center gap-2 select-none py-1" role="status" aria-label={`생명 ${life} / ${maxLife}`}>
      <span className="text-[16px] sm:text-[18px] font-black text-black tracking-tight whitespace-nowrap">
        생명 :
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {items.map((isActive, index) => (
          <div
            key={index}
            data-life-slot={index}
            ref={(element) => { if (element) orbs.current.set(index, element); else orbs.current.delete(index); }}
            className="w-5 h-5 sm:w-5.5 sm:h-5.5 shrink-0 rounded-full relative"
            style={{
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
              className="absolute top-0.5 right-1 w-2 h-1.5 rounded-full"
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
