import React from 'react';
import { RotateCcw, Home, Trophy, Sparkles, Target } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  score: number;
  record: number;
  maxBall: number;
  totalMerges: number;
  onRestart: () => void;
  onHome: () => void;
  onReplay: () => void;
  replayCount: number;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  score,
  record,
  maxBall,
  totalMerges,
  onRestart,
  onHome,
  onReplay,
  replayCount,
}) => {
  if (!isOpen) return null;

  const isNewRecord = score >= record && score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs select-none">
      <div className="bg-white border-[3.5px] border-black rounded-xl w-full max-w-sm p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-5">
          <div className="inline-block bg-black text-white px-4 py-1 rounded font-black text-xl tracking-wider mb-2">
            GAME OVER
          </div>
          {isNewRecord && (
            <div className="text-sm font-black text-[#24A85C] animate-pulse">
              🎉 새로운 최고 기록 달성! 🎉
            </div>
          )}
        </div>

        <div className="space-y-2.5 mb-6">
          <div className="bg-[#F5F5F5] border-2 border-black p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-600">SCORE</span>
            <span className="text-2xl font-black text-black">{score.toLocaleString()}</span>
          </div>

          <div className="bg-[#F5F5F5] border-2 border-black p-3 rounded-lg flex items-center justify-between">
            <span className="text-sm font-bold text-neutral-600 flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-[#24A85C]" />
              BEST RECORD
            </span>
            <span className="text-2xl font-black text-[#24A85C]">{record.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-white border-2 border-black p-2.5 rounded-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-neutral-500">MAX BALL</div>
                <div className="font-black text-base text-black">{maxBall}</div>
              </div>
            </div>

            <div className="bg-white border-2 border-black p-2.5 rounded-lg flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-neutral-500">TOTAL MERGES</div>
                <div className="font-black text-base text-black">{totalMerges}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <button onClick={onReplay} disabled={replayCount === 0}
            className="w-full py-2.5 border-2 border-black rounded-lg font-bold disabled:opacity-30 cursor-pointer">리플레이 저장</button>
          <button
            onClick={onRestart}
            className="w-full py-3 bg-black text-white font-bold text-base rounded-lg border-2 border-black hover:bg-neutral-800 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-5 h-5" />
            다시 시작
          </button>

          <button
            onClick={onHome}
            className="w-full py-2.5 bg-white text-black font-bold text-sm rounded-lg border-2 border-black hover:bg-neutral-100 active:scale-98 transition-transform flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            홈으로
          </button>
        </div>
      </div>
    </div>
  );
};
