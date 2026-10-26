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
    <div className="flex flex-col items-center justify-center select-none py-1">
      <div className="text-[21px] sm:text-[23px] font-black tracking-wide text-black leading-tight">
        최고기록 : {record}
      </div>
      <div className="text-[21px] sm:text-[23px] font-black tracking-wide text-black leading-tight mt-0.5 flex items-baseline">
        <span>현재점수 : {score}</span>
        {showGain && scoreAdded > 0 && (
          <span key={score} onAnimationEnd={() => setShowGain(false)}
            data-score-gain
            className="ml-1 text-[#36B54A] inline-block origin-left animate-[score-gain_650ms_ease-out_both]">+{scoreAdded}</span>
        )}
      </div>
    </div>
  );
};
