import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { GameDialog } from './GameDialog';
import { getBallColor } from '../config/ballColors';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const pages = [
  {
    title: '조작과 발사',
    lines: [
      '직접 조작하는 공은 검은 글씨 공 하나입니다.',
      '판의 어느 곳에서든 드래그해 조준하고, 손을 떼면 당긴 반대 방향으로 발사됩니다.',
      '짧게 당겨도 길게 당겨도 발사 세기는 같습니다. 가볍게 탭하기만 하면 발사되지 않습니다.',
    ],
  },
  {
    title: '합체와 점수',
    lines: [
      '같은 숫자끼리 닿으면 숫자가 두 배인 공 하나로 합쳐집니다. 다른 숫자 공은 서로 튕깁니다.',
      '검은 글씨 공이 합쳐지면 새 공도 검은 글씨입니다. 흰 글씨끼리 합치면 흰 글씨가 유지됩니다.',
      '합체로 만들어진 공의 숫자만큼 점수를 얻습니다. 초록 +점수는 잠깐 커졌다 줄어들며 사라집니다.',
    ],
  },
  {
    title: '생명 회복과 감소',
    lines: [
      '합체가 일어나는 순간, 합체 1회마다 생명 1개를 회복합니다.',
      '검은 글씨 공이 합쳐져 커지면 최대 생명과 현재 생명이 각각 추가로 1 증가합니다.',
      '회복은 최대 생명까지만 적용됩니다. 초과 회복분은 다음 턴으로 보관되지 않습니다.',
      '공이 모두 멈춘 뒤 새 2공이 보충되는 순간 생명 1개를 사용합니다. 변동한 칸은 커졌다 원래 크기로 돌아옵니다.',
    ],
  },
  {
    title: '새 2공 보충',
    lines: [
      '턴이 끝나면 먼저 2공 1개를 보충합니다.',
      '그 뒤 판 전체에서 같은 숫자 쌍이 하나도 없을 때만 2공을 1개 더 보충합니다.',
      '2공이 이미 하나 있었다면 새 2공 하나로 쌍이 만들어지므로 추가로 더 생성하지 않습니다.',
      '2공이 두 개 보충되어도 생명은 그 턴에 1개만 사용합니다. 생성·합체 공은 살짝 커졌다 원래 크기로 돌아옵니다.',
    ],
  },
  {
    title: '마지막 기회와 초기화',
    lines: [
      '게임은 생명 1개로 시작합니다. 생명이 0이 되면 마지막 샷을 한 번 더 할 수 있습니다.',
      '마지막 샷에서도 합체로 생명을 회복할 수 있습니다. 회복하지 못하면 게임이 끝납니다.',
      '홈 버튼을 누르면 진행 초기화 안내가 나타납니다. 확인을 눌렀을 때만 공 배치·현재 점수·생명이 초기화됩니다.',
      '취소하면 이어서 플레이합니다. 초기화해도 최고 기록과 업적은 유지됩니다.',
    ],
  },
];

function BallIcon({ value, controlled = false }: { value: number; controlled?: boolean }) {
  const color = getBallColor(value);
  return (
    <span className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-black text-lg shadow-sm"
      style={{
        background: `radial-gradient(circle at 35% 25%, ${color.gradientStart}, ${color.primary} 60%, ${color.gradientEnd})`,
        color: controlled ? '#000' : '#FFF',
      }}>{value}</span>
  );
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  useEffect(() => { if (isOpen) setCurrentPage(0); }, [isOpen]);
  const page = pages[currentPage];

  return (
    <GameDialog isOpen={isOpen} onClose={onClose} labelledBy="game-help-title">
      <div className="flex items-center justify-between mb-3">
        <h2 id="game-help-title" className="text-xl font-black">게임 설명</h2>
        <button type="button" onClick={onClose} autoFocus aria-label="게임 설명 닫기"
          className="w-8 h-8 border-2 border-black rounded flex items-center justify-center cursor-pointer hover:bg-neutral-100">
          <X className="w-4 h-4" />
        </button>
      </div>

      <section className="border-[8px] border-black p-3 sm:p-4 bg-neutral-50">
        <h3 className="text-lg font-black mb-3">{page.title}</h3>
        {currentPage === 0 && (
          <div className="flex items-center justify-center gap-3 mb-3">
            <BallIcon value={32} controlled /><span className="font-bold">검은 글씨 공을 조작</span>
          </div>
        )}
        {currentPage === 1 && (
          <div className="space-y-2 mb-3 text-center font-bold" aria-label="검은 공과 흰 공 합체 시 검은 공 유지, 흰 공끼리 합체 시 흰 공 유지">
            <div className="flex justify-center items-center gap-1.5">
              <BallIcon value={2} controlled /> + <BallIcon value={2} /> → <BallIcon value={4} controlled />
            </div>
            <div className="flex justify-center items-center gap-1.5">
              <BallIcon value={2} /> + <BallIcon value={2} /> → <BallIcon value={4} />
            </div>
          </div>
        )}
        <ul className="space-y-2.5 text-sm leading-relaxed font-medium">
          {page.lines.map((line) => (
            <li key={line} className="flex gap-2"><span aria-hidden="true">•</span><span>{line}</span></li>
          ))}
        </ul>
      </section>

      <nav aria-label="게임 설명 페이지" className="flex items-center justify-between mt-4">
        <button type="button" onClick={() => setCurrentPage((page) => page - 1)}
          disabled={currentPage === 0} aria-label="이전 설명"
          className="w-10 h-9 border-2 border-black rounded flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 cursor-pointer">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex gap-2 items-center">
          {pages.map((page, index) => (
            <button key={page.title} type="button" onClick={() => setCurrentPage(index)}
              aria-label={`${index + 1}페이지: ${page.title}`} aria-current={index === currentPage ? 'page' : undefined}
              className={`w-3 h-3 rounded-full border border-black cursor-pointer ${index === currentPage ? 'bg-black' : 'bg-neutral-200'}`} />
          ))}
          <span className="text-xs tabular-nums ml-1">{currentPage + 1} / {pages.length}</span>
        </div>
        <button type="button" onClick={() => setCurrentPage((page) => page + 1)}
          disabled={currentPage === pages.length - 1} aria-label="다음 설명"
          className="w-10 h-9 border-2 border-black rounded flex items-center justify-center disabled:opacity-30 hover:bg-neutral-100 cursor-pointer">
          <ChevronRight className="w-5 h-5" />
        </button>
      </nav>
    </GameDialog>
  );
};
