import React from 'react';
import { GameDialog } from './GameDialog';

interface ResetGameDialogProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export const ResetGameDialog: React.FC<ResetGameDialogProps> = ({ isOpen, onCancel, onConfirm }) => (
  <GameDialog isOpen={isOpen} onClose={onCancel} labelledBy="reset-game-title">
    <h2 id="reset-game-title" className="text-xl font-black mb-3">게임 진행 초기화</h2>
    <p className="font-bold leading-relaxed">현재 게임 진행이 초기화됩니다.<br />처음부터 다시 시작하시겠습니까?</p>
    <p className="text-sm text-neutral-600 mt-2">최고 기록과 업적은 유지됩니다.</p>
    <div className="flex gap-2 mt-5">
      <button type="button" autoFocus onClick={onCancel}
        className="flex-1 border-2 border-black rounded py-2.5 font-bold cursor-pointer hover:bg-neutral-100">취소</button>
      <button type="button" onClick={onConfirm}
        className="flex-1 border-2 border-black rounded py-2.5 bg-black text-white font-bold cursor-pointer hover:bg-neutral-800">확인</button>
    </div>
  </GameDialog>
);
