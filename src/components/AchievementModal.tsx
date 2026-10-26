import React from 'react';
import { X, Award, CheckCircle2, Circle } from 'lucide-react';
import { Achievement } from '../types/game';

interface AchievementModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievements: Achievement[];
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  isOpen,
  onClose,
  achievements,
}) => {
  if (!isOpen) return null;

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border-[3px] border-black rounded-lg w-full max-w-sm max-h-[85vh] flex flex-col p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-black" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 mb-2 border-b-2 border-black pb-2">
          <Award className="w-6 h-6 text-black" strokeWidth={2.4} />
          <h2 className="text-xl font-black text-black">업적 현황</h2>
          <span className="ml-auto text-xs font-bold bg-neutral-200 text-black px-2 py-0.5 rounded border border-black">
            {unlockedCount} / {achievements.length}
          </span>
        </div>

        <div className="overflow-y-auto space-y-2 py-2 pr-1 flex-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded border-2 transition-colors flex items-center gap-3 ${
                ach.unlocked
                  ? 'border-black bg-amber-50/50'
                  : 'border-neutral-300 bg-neutral-50 opacity-60'
              }`}
            >
              {ach.unlocked ? (
                <CheckCircle2 className="w-6 h-6 text-[#24A85C] shrink-0" strokeWidth={2.5} />
              ) : (
                <Circle className="w-6 h-6 text-neutral-400 shrink-0" strokeWidth={2} />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-black flex items-center gap-1.5">
                  {ach.title}
                  {ach.unlocked && (
                    <span className="text-[10px] bg-[#24A85C] text-white px-1.5 py-0.2 rounded font-black">
                      달성
                    </span>
                  )}
                </div>
                <div className="text-xs text-neutral-600 truncate">{ach.description}</div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="mt-3 w-full py-2.5 bg-black text-white font-bold rounded border-2 border-black hover:bg-neutral-800 active:scale-98 transition-transform cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
