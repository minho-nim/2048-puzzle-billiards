import React from 'react';

interface ScoreBoardProps {
  score: number;
  record: number;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ score, record }) => {
  return (
    <div className="flex flex-col items-center justify-center select-none py-1">
      <div className="text-[21px] sm:text-[23px] font-black tracking-wide text-[#24A85C] leading-tight">
        최고기록 : {record}
      </div>
      <div className="text-[21px] sm:text-[23px] font-black tracking-wide text-[#000000] leading-tight mt-0.5">
        현재점수 : {score}
      </div>
    </div>
  );
};
