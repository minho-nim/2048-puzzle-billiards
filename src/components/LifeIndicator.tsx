import React from 'react';

interface LifeIndicatorProps {
  life: number;
  maxLife: number;
}

export const LifeIndicator: React.FC<LifeIndicatorProps> = ({ life, maxLife }) => {
  const items = Array.from({ length: maxLife }, (_, i) => i < life);

  return (
    <div className="flex items-center gap-2 select-none py-1">
      <span className="text-[19px] sm:text-[20px] font-black text-black tracking-tight">
        생명 :
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {items.map((isActive, index) => (
          <div
            key={index}
            className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-full relative transition-all duration-200"
            style={{
              background: isActive
                ? 'radial-gradient(circle at 35% 30%, #70C5FF 0%, #168DE3 45%, #0B4E85 100%)'
                : 'radial-gradient(circle at 35% 30%, #A3A3A3 0%, #666666 55%, #383838 100%)',
              boxShadow: isActive
                ? '0 1px 3px rgba(22, 141, 227, 0.4), inset -1px -1px 2px rgba(0,0,0,0.35)'
                : '0 1px 2px rgba(0,0,0,0.2), inset -1px -1px 2px rgba(0,0,0,0.4)',
            }}
          >
            {/* Top-right curved shine highlight as in original game balls */}
            <div
              className="absolute top-0.5 left-1 w-2 h-1.5 rounded-full"
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
