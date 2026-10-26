import React from 'react';
import { X, Trophy, Target, Sparkles, Gamepad2 } from 'lucide-react';
import { getStoredRecord, getStoredStats } from '../utils/storage';

interface RecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecordModal: React.FC<RecordModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const record = getStoredRecord();
  const stats = getStoredStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border-[3px] border-black rounded-lg w-full max-w-sm p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-5 h-5 text-black" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-2 mb-4 border-b-2 border-black pb-2">
          <Trophy className="w-6 h-6 text-[#24A85C]" strokeWidth={2.5} />
          <h2 className="text-xl font-black text-black">나의 최고 기록</h2>
        </div>

        <div className="bg-[#F5F5F5] border-2 border-black p-4 rounded-md mb-4 text-center">
          <div className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-1">
            BEST RECORD
          </div>
          <div className="text-3xl font-black text-[#24A85C]">
            {record.toLocaleString()}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-white border-2 border-black p-2.5 rounded flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-neutral-500">최대 달성 공</div>
              <div className="font-black text-black text-base">{stats.maxBallAchieved}</div>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-2.5 rounded flex items-center gap-2.5">
            <Target className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-neutral-500">누적 합성 수</div>
              <div className="font-black text-black text-base">{stats.totalMerges.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-2.5 rounded flex items-center gap-2.5">
            <Gamepad2 className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-neutral-500">총 발사 횟수</div>
              <div className="font-black text-black text-base">{stats.totalShots.toLocaleString()}</div>
            </div>
          </div>

          <div className="bg-white border-2 border-black p-2.5 rounded flex items-center gap-2.5">
            <Trophy className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-[11px] font-bold text-neutral-500">플레이 게임 수</div>
              <div className="font-black text-black text-base">{stats.gamesPlayed.toLocaleString()}</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-black text-white font-bold rounded border-2 border-black hover:bg-neutral-800 active:scale-98 transition-transform cursor-pointer"
        >
          닫기
        </button>
      </div>
    </div>
  );
};
