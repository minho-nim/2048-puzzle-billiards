import React from 'react';
import { Crown, Award, Home, Volume2, VolumeX } from 'lucide-react';

interface GameHeaderProps {
  onOpenHelp: () => void;
  onOpenRecords: () => void;
  onOpenAchievements: () => void;
  onHomeClick: () => void;
  onToggleSound: () => void;
  soundEnabled: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  onOpenHelp,
  onOpenRecords,
  onOpenAchievements,
  onHomeClick,
  onToggleSound,
  soundEnabled,
}) => {
  return (
    <header className="w-full flex items-center justify-between px-2 pt-3 pb-1 select-none">
      {/* Left button group */}
      <div className="flex items-center gap-2.5">
        {/* Help button */}
        <button
          onClick={onOpenHelp}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-[2.5px] border-black rounded-[4px] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-transform shadow-xs cursor-pointer"
          title="도움말"
          aria-label="도움말"
        >
          <span className="text-[22px] font-black text-black leading-none select-none">?</span>
        </button>

        {/* Crown button (Records) */}
        <button
          onClick={onOpenRecords}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-[2.5px] border-black rounded-[4px] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-transform shadow-xs cursor-pointer"
          title="기록 및 통계"
          aria-label="기록"
        >
          <Crown className="w-6 h-6 text-black fill-black" strokeWidth={1.5} />
        </button>

        {/* Medal button (Achievements) */}
        <button
          onClick={onOpenAchievements}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-[2.5px] border-black rounded-[4px] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-transform shadow-xs cursor-pointer"
          title="업적"
          aria-label="업적"
        >
          <Award className="w-6 h-6 text-black" strokeWidth={2.4} />
        </button>
      </div>

      {/* Right button group */}
      <div className="flex items-center gap-2.5">
        {/* Home button */}
        <button
          onClick={onHomeClick}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-[2.5px] border-black rounded-[4px] flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-transform shadow-xs cursor-pointer"
          title="새 게임 / 처음으로"
          aria-label="새 게임"
        >
          <Home className="w-6 h-6 text-black fill-black" strokeWidth={1.5} />
        </button>

        {/* Speaker / Sound button */}
        <button
          onClick={onToggleSound}
          className="w-10 h-10 sm:w-11 sm:h-11 bg-white border-[2.5px] border-black rounded-full flex items-center justify-center hover:bg-neutral-100 active:scale-95 transition-transform shadow-xs cursor-pointer"
          title={soundEnabled ? '소리 끄기' : '소리 켜기'}
          aria-label="소리 설정"
        >
          {soundEnabled ? (
            <Volume2 className="w-6 h-6 text-black fill-black" strokeWidth={1.5} />
          ) : (
            <VolumeX className="w-6 h-6 text-neutral-400" strokeWidth={2} />
          )}
        </button>
      </div>
    </header>
  );
};
