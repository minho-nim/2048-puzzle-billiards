import React, { useEffect, useState } from 'react';

interface ScoreBoardProps {
  score: number;
  record: number;
  scoreAdded: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, record, scoreAdded }) => {
  const [showGain, setShowGain] = useState(false);
  useEffect(() => { setShowGain(scoreAdded > 0); }, [score, scoreAdded]);
  return (
    <div className="grid grid-cols-[auto_auto_minmax(4ch,auto)] items-baseline gap-x-2 gap-y-0.5 select-none py-1 tabular-nums text-[21px] sm:text-[23px] font-black tracking-wide text-black leading-tight">
      <span>최고기록</span><span aria-hidden="true">:</span>
      <span data-record-value className="text-right">{record}</span>
      <span>현재점수</span><span aria-hidden="true">:</span>
      <div className="relative text-right">
        <span data-current-value>{score}</span>
        {showGain && scoreAdded > 0 && (
          <span key={score} onAnimationEnd={() => setShowGain(false)}
            data-score-gain
            className="absolute left-full top-0 ml-1 whitespace-nowrap text-[#36B54A] inline-block origin-left animate-[score-gain_650ms_ease-out_both]">+{scoreAdded}</span>
        )}
      </div>
    </div>
  );
};
