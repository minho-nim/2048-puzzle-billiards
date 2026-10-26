import React, { useEffect, useRef } from 'react';

interface GameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  labelledBy: string;
  children: React.ReactNode;
}

export const GameDialog: React.FC<GameDialogProps> = ({ isOpen, onClose, labelledBy, children }) => {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!isOpen || !dialog) return;
    dialog.showModal();
    return () => dialog.close();
  }, [isOpen]);

  return (
    <dialog ref={dialogRef} aria-labelledby={labelledBy}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      className="fixed inset-0 m-auto w-[calc(100%_-_1.5rem)] max-w-[370px] max-h-[calc(100dvh_-_2rem)] overflow-y-auto bg-white text-black border-[3px] border-black rounded-lg p-4 sm:p-5 shadow-2xl backdrop:bg-black/60">
      {children}
    </dialog>
  );
};
