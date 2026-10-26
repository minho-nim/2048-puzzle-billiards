import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(4); // Default to slide 4 or 1

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs select-none">
      <div className="bg-white border-[3.5px] border-black rounded-lg w-full max-w-[370px] p-4 sm:p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded border-2 border-black flex items-center justify-center hover:bg-neutral-100 cursor-pointer"
          aria-label="닫기"
        >
          <X className="w-4 h-4 text-black" strokeWidth={2.5} />
        </button>

        {/* Header */}
        <div className="text-center mb-1">
          <h2 className="text-[20px] font-black text-black">게임 방법</h2>
          <div className="text-[14px] font-bold text-neutral-500 mt-0.5">
            {currentPage} / 5
          </div>
        </div>

        {/* Content Box with thick black border mirroring screenshot */}
        <div className="border-[14px] border-black bg-white p-3 sm:p-4 my-2 min-h-[300px] flex flex-col items-center justify-center text-center">
          {/* Slide 1 */}
          {currentPage === 1 && (
            <div className="w-full flex flex-col items-center justify-between h-full py-2 space-y-4">
              <div className="text-[17px] font-black text-[#E87A00]">
                원하는 공을 터치하고...
              </div>

              {/* Aiming visual */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-radial from-[#FF6B7F] via-[#F22D48] to-[#CC1630] flex items-center justify-center text-white font-black text-xl shadow-md">
                  2
                </div>
                {/* Aim line */}
                <div className="absolute top-1/2 left-1/2 w-20 h-0.5 border-t-2 border-dashed border-[#38B6FF] origin-left -rotate-45" />
                <div className="absolute -top-1 right-2 w-10 h-10 rounded-full border-2 border-[#38B6FF] bg-[#38B6FF]/30" />
              </div>

              <div className="text-[16px] font-black text-[#E87A00]">
                ...드래그하여 조준합니다.
              </div>
            </div>
          )}

          {/* Slide 2 */}
          {currentPage === 2 && (
            <div className="w-full flex flex-col items-center justify-between h-full py-2 space-y-4">
              <div className="text-[17px] font-black text-[#E87A00]">
                손을 떼면...
              </div>

              {/* Billiard Bounce visual */}
              <div className="relative w-36 h-36 border border-neutral-300 rounded bg-neutral-50 flex items-center justify-center overflow-hidden">
                <div className="absolute bottom-3 left-4 w-12 h-12 rounded-full bg-radial from-[#7C8CFF] via-[#4558FA] to-[#1E2ECC] flex items-center justify-center text-white font-black text-lg shadow-md">
                  32
                </div>
                {/* Arrow ricochet */}
                <div className="text-3xl text-neutral-400 font-bold select-none">
                  ⚡ ↗ ↘
                </div>
              </div>

              <div className="text-[16px] font-black text-[#E87A00]">
                ...당구공처럼 튕기며 발사됩니다.
              </div>
            </div>
          )}

          {/* Slide 3 (Exact replica of image_6e74fb0f.png) */}
          {currentPage === 3 && (
            <div className="w-full flex flex-col items-center justify-between h-full py-1">
              <div className="text-[17px] font-black text-[#E87A00] mb-3">
                같은 숫자의 공끼리 부딪히면...
              </div>

              <div className="flex items-center justify-center gap-5 my-2">
                {/* Left combination */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    {/* 2 with black text */}
                    <div className="w-9 h-9 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] flex items-center justify-center text-black font-black text-sm shadow-sm relative">
                      <div className="absolute top-0.5 right-1 w-2.5 h-1.5 rounded-full bg-white/70" />
                      2
                    </div>
                    <span className="font-black text-base text-black">+</span>
                    {/* 2 with white text */}
                    <div className="w-9 h-9 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] flex items-center justify-center text-white font-black text-sm shadow-sm relative">
                      <div className="absolute top-0.5 right-1 w-2.5 h-1.5 rounded-full bg-white/70" />
                      2
                    </div>
                  </div>

                  {/* Down Arrow */}
                  <div className="my-2 text-neutral-500 font-black text-lg">
                    ▼
                  </div>

                  {/* 4 with white text */}
                  <div className="w-10 h-10 rounded-full bg-radial from-[#FF70C0] via-[#ED168D] to-[#A00055] flex items-center justify-center text-white font-black text-base shadow-sm relative">
                    <div className="absolute top-0.5 right-1 w-3 h-1.5 rounded-full bg-white/70" />
                    4
                  </div>
                </div>

                {/* Right combination */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5">
                    <div className="w-9 h-9 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] flex items-center justify-center text-white font-black text-sm shadow-sm relative">
                      <div className="absolute top-0.5 right-1 w-2.5 h-1.5 rounded-full bg-white/70" />
                      2
                    </div>
                    <span className="font-black text-base text-black">+</span>
                    <div className="w-9 h-9 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] flex items-center justify-center text-white font-black text-sm shadow-sm relative">
                      <div className="absolute top-0.5 right-1 w-2.5 h-1.5 rounded-full bg-white/70" />
                      2
                    </div>
                  </div>

                  <div className="my-2 text-neutral-500 font-black text-lg">
                    ▼
                  </div>

                  {/* 4 with black text */}
                  <div className="w-10 h-10 rounded-full bg-radial from-[#FF70C0] via-[#ED168D] to-[#A00055] flex items-center justify-center text-black font-black text-base shadow-sm relative">
                    <div className="absolute top-0.5 right-1 w-3 h-1.5 rounded-full bg-white/70" />
                    4
                  </div>
                </div>
              </div>

              <div className="text-[17px] font-black text-[#E87A00] mt-3">
                ...하나로 합쳐집니다.
              </div>
            </div>
          )}

          {/* Slide 4 (Exact replica of image_79cf0d05.png) */}
          {currentPage === 4 && (
            <div className="w-full flex flex-col items-center justify-between h-full py-1 space-y-2.5">
              {/* Row 1 */}
              <div>
                <div className="text-[15px] font-black text-[#E87A00]">
                  공이 보충될 때마다...
                </div>
                <div className="text-[15px] font-black text-[#D93845] mb-1">
                  생명 1개를 사용합니다.
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <span className="text-neutral-500 font-bold px-1">➔</span>
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#BDBDBD] via-[#757575] to-[#424242] shadow-xs" />
                </div>
              </div>

              {/* Row 2 */}
              <div>
                <div className="text-[15px] font-black text-[#E87A00]">
                  합체에 성공할 때마다...
                </div>
                <div className="text-[15px] font-black text-[#24A85C] mb-1">
                  합체 1회마다 생명 1개를 회복합니다.
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#BDBDBD] via-[#757575] to-[#424242] shadow-xs" />
                  <span className="text-neutral-500 font-bold px-1">➔</span>
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                </div>
              </div>

              {/* Row 3 */}
              <div>
                <div className="text-[15px] font-black text-[#E87A00]">
                  최고 공 숫자가 새 기록을 만들면...
                </div>
                <div className="text-[15px] font-black text-[#6366F1] mb-1">
                  최대 생명이 1개 증가합니다.
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <span className="text-neutral-500 font-bold px-1">➔</span>
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                  <div className="w-6 h-6 rounded-full bg-radial from-[#FF7A8F] via-[#F22D48] to-[#BA0E24] shadow-xs" />
                </div>
              </div>
            </div>
          )}

          {/* Slide 5 */}
          {currentPage === 5 && (
            <div className="w-full flex flex-col items-center justify-between h-full py-2 space-y-4">
              <div className="text-[17px] font-black text-[#E87A00]">
                연쇄 합성을 노려보세요!
              </div>

              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-radial from-[#FFD768] via-[#FFB800] to-[#C78B00] flex items-center justify-center text-black font-black text-sm shadow-md">
                  2048
                </div>
                <div className="text-sm font-bold text-neutral-700 text-left">
                  합성할수록 점수가 폭발적으로 증가합니다!
                </div>
              </div>

              <div className="text-[16px] font-black text-[#E87A00]">
                최고 기록을 경신해 보세요!
              </div>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mt-2 pt-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="w-10 h-8 rounded border-2 border-black flex items-center justify-center hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer font-bold"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-3 h-3 rounded-full border border-black transition-colors ${
                  currentPage === page ? 'bg-black' : 'bg-neutral-200'
                }`}
              />
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(5, p + 1))}
            disabled={currentPage === 5}
            className="w-10 h-8 rounded border-2 border-black flex items-center justify-center hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer font-bold"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
