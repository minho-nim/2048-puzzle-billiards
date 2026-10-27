import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { getBallColor } from '../config/ballColors';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const titles = ['조준', '발사', '합체', '생명'];

function Ball({ value, controlled = false, size = 48 }: { value: number; controlled?: boolean; size?: number }) {
  const color = getBallColor(value);
  return (
    <span className="relative inline-flex shrink-0 items-center justify-center rounded-full font-black"
      style={{
        width: size, height: size, fontSize: size * 0.48,
        background: `radial-gradient(circle at 35% 25%, ${color.gradientStart}, ${color.primary} 60%, ${color.gradientEnd})`,
        color: controlled ? '#000' : '#FFF',
        boxShadow: '-2px 4px 0 rgba(0,0,0,.15)',
      }}>
      <span className="absolute top-[12%] right-[12%] w-[52%] h-[25%] rotate-[24deg] rounded-full bg-white/35" />
      <span className="relative">{value}</span>
    </span>
  );
}

function Lives({ active, total }: { active: number; total: number }) {
  return (
    <span className="inline-flex gap-1.5" aria-label={`생명 ${active} / ${total}`}>
      {Array.from({ length: total }, (_, index) => (
        <span key={index} className="w-5 h-5 rounded-full relative"
          style={{ background: index < active
            ? 'radial-gradient(circle at 35% 25%, #9A9AFF, #6559FF 65%, #5144DA)'
            : '#888' }}>
          {index < active && <span className="absolute top-0.5 right-0.5 w-3 h-1.5 rounded-full bg-white/35 rotate-[20deg]" />}
        </span>
      ))}
    </span>
  );
}

function MergePicture({ controlled }: { controlled: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-1 font-black text-lg">
        <Ball value={2} controlled={controlled} size={36} /><span>+</span><Ball value={2} size={36} />
      </div>
      <span className="text-2xl text-neutral-400" aria-hidden="true">↓</span>
      <Ball value={4} controlled={controlled} size={50} />
    </div>
  );
}

const caption = 'text-[17px] font-black text-[#D57800] text-center leading-snug';
const note = 'text-[14px] font-bold text-neutral-600 text-center leading-snug';

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => { if (isOpen) setCurrentPage(0); }, [isOpen]);

  return (
    <GameDialog isOpen={isOpen} onClose={onClose} labelledBy="game-help-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="game-help-title" className="text-xl font-black">게임 설명</h2>
        <button type="button" onClick={onClose} autoFocus aria-label="게임 설명 닫기"
          className="w-8 h-8 border-2 border-black rounded flex items-center justify-center cursor-pointer hover:bg-neutral-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <section aria-label={titles[currentPage]} className="border-[10px] border-black bg-neutral-50 h-[340px] sm:h-[370px] px-2 py-4 flex flex-col items-center justify-between">
        {currentPage === 0 && <>
          <p className={caption}>원하는 곳을 누르면<br />바로 조준!</p>
          <div className="relative w-[210px] h-[170px]" role="img" aria-label="손을 오른쪽 아래로 움직이면 공도 오른쪽 아래를 향합니다">
            <svg viewBox="0 0 210 170" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <path d="M105 75 L178 138" stroke="#38B6FF" strokeWidth="3" strokeDasharray="6 5" fill="none" />
              <path d="M166 137 L178 138 L177 126" stroke="#38B6FF" strokeWidth="3" fill="none" />
              <path d="M104 105 L138 135 M126 134 L138 135 L137 123" stroke="#D57800" strokeWidth="3" fill="none" />
            </svg>
            <div className="absolute left-[76px] top-[46px]"><Ball value={32} controlled size={58} /></div>
            <Hand className="absolute left-[148px] top-[137px] w-8 h-8 text-black fill-white" />
          </div>
          <p className={note}>손을 떼면 그쪽으로 발사!</p>
        </>}

        {currentPage === 1 && <>
          <p className={caption}>손을 떼면 발사!</p>
          <div className="relative w-[200px] h-[176px] border-[7px] border-black bg-[#F2F2F2]" role="img" aria-label="공이 앞으로 나가 벽에 부딪혀 튕깁니다">
            <svg viewBox="0 0 186 162" className="absolute inset-0 w-full h-full" aria-hidden="true">
              <path d="M38 125 L135 22 L164 78 M155 73 L164 78 L165 67" stroke="#6C6CFF" strokeWidth="5" fill="none" strokeLinejoin="round" />
            </svg>
            <div className="absolute left-3 bottom-2"><Ball value={32} controlled size={48} /></div>
          </div>
          <p className={note}>짧게 당겨도 같은 세기!</p>
        </>}

        {currentPage === 2 && <>
          <p className={caption}>같은 숫자끼리 만나면…</p>
          <div className="flex gap-6 items-center" role="img" aria-label="검은 2와 흰 2는 검은 4로, 흰 2끼리는 흰 4로 합쳐집니다">
            <MergePicture controlled /><MergePicture controlled={false} />
          </div>
          <p className={caption}>두 배로 합체!</p>
        </>}

        {currentPage === 3 && <>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] font-black text-[#24A85C]">합체하면 생명 +1</p>
            <div className="flex gap-3 items-center"><Lives active={1} total={2} /><span aria-hidden="true">→</span><Lives active={2} total={2} /></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] font-black text-[#8544DB] text-center">검은 글씨 공이 커지면<br />최대 +1</p>
            <div className="flex gap-3 items-center"><Lives active={2} total={2} /><span aria-hidden="true">→</span><Lives active={3} total={3} /></div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[15px] font-black text-[#D93845]">새 공이 생기면 생명 −1</p>
            <div className="flex gap-3 items-center"><Lives active={2} total={2} /><span aria-hidden="true">→</span><Lives active={1} total={2} /></div>
          </div>
          <p className="text-xs font-bold text-neutral-500">회복은 최대 생명까지만!</p>
        </>}

      </section>

      <nav aria-label="게임 설명 페이지" className="flex items-center justify-between mt-4">
        <button type="button" onClick={() => setCurrentPage((page) => page - 1)}
          disabled={currentPage === 0} aria-label="이전 설명"
          className="w-10 h-9 border-2 border-black rounded flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2 items-center">
          {titles.map((title, index) => (
            <button key={title} type="button" onClick={() => setCurrentPage(index)}
              aria-label={`${index + 1}페이지: ${title}`} aria-current={index === currentPage ? 'page' : undefined}
              className={`w-3 h-3 rounded-full border border-black cursor-pointer ${index === currentPage ? 'bg-black' : 'bg-neutral-200'}`} />
          ))}
          <span className="text-xs tabular-nums ml-1">{currentPage + 1} / {titles.length}</span>
        </div>
        <button type="button" onClick={() => setCurrentPage((page) => page + 1)}
          disabled={currentPage === titles.length - 1} aria-label="다음 설명"
          className="w-10 h-9 border-2 border-black rounded flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </GameDialog>
  );
};
