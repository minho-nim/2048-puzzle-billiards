import React, { useState, useEffect } from 'react';
import { GameHeader } from './components/GameHeader';
import { ScoreBoard } from './components/ScoreBoard';
import { LifeIndicator } from './components/LifeIndicator';
import { GameCanvas } from './components/GameCanvas';
import { HelpModal } from './components/HelpModal';
import { RecordModal } from './components/RecordModal';
import { AchievementModal } from './components/AchievementModal';
import { GameOverModal } from './components/GameOverModal';
import { ResetGameDialog } from './components/ResetGameDialog';
import { gameEngine } from './engine/gameEngine';
import { GameState, Achievement } from './types/game';
import { Award } from 'lucide-react';

export default function App() {
  const [gameState, setGameState] = useState<GameState>(gameEngine.getState());
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isAchievementOpen, setIsAchievementOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [recentAchievement, setRecentAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    // Start game engine loop
    gameEngine.start();

    // Subscribe to state updates
    const unsubscribeState = gameEngine.subscribe((newState) => {
      setGameState(newState);
    });

    // Subscribe to achievement popups
    const unsubscribeAchievement = gameEngine.subscribeAchievement((ach) => {
      setRecentAchievement(ach);
      setTimeout(() => {
        setRecentAchievement((prev) => (prev?.id === ach.id ? null : prev));
      }, 3500);
    });

    return () => {
      gameEngine.checkpoint();
      gameEngine.stop();
      unsubscribeState();
      unsubscribeAchievement();
    };
  }, []);

  useEffect(() => {
    const checkpointAndStop = () => {
      gameEngine.checkpoint();
      gameEngine.stop();
    };
    const onVisibilityChange = () => {
      if (document.hidden) checkpointAndStop();
      else if (!isResetOpen) gameEngine.start();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', checkpointAndStop);
    window.addEventListener('pageshow', onVisibilityChange);
    onVisibilityChange();
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pagehide', checkpointAndStop);
      window.removeEventListener('pageshow', onVisibilityChange);
    };
  }, [isResetOpen]);

  const handleRestart = () => {
    gameEngine.initGame();
    setRecentAchievement(null);
  };

  const requestReset = () => {
    gameEngine.cancelAim();
    gameEngine.stop();
    setIsResetOpen(true);
  };

  const cancelReset = () => {
    setIsResetOpen(false);
    gameEngine.start();
  };

  const confirmReset = () => {
    handleRestart();
    setIsResetOpen(false);
    gameEngine.start();
  };

  const handleToggleSound = () => {
    gameEngine.toggleSound();
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F5F5] text-neutral-900 flex flex-col items-center justify-between py-2 sm:py-4 px-3 select-none overflow-x-hidden font-sans">
      {/* Centered Arcade Device Column */}
      <div className="w-full max-w-[500px] flex flex-col items-center justify-start flex-1">
        {/* Top Header Buttons */}
        <GameHeader
          onOpenHelp={() => setIsHelpOpen(true)}
          onOpenRecords={() => setIsRecordOpen(true)}
          onOpenAchievements={() => setIsAchievementOpen(true)}
          onHomeClick={requestReset}
          onToggleSound={handleToggleSound}
          soundEnabled={gameState.soundEnabled}
        />

        {/* Score & Record Display */}
        <div className="my-2 sm:my-3">
          <ScoreBoard score={gameState.score} record={gameState.record} scoreAdded={gameState.turnScoreGained} />
        </div>

        {/* Life & Board Container */}
        <div className="w-full flex flex-col items-start">
          {/* Life Indicator directly above board */}
          <div className="mb-1.5 px-0.5">
            <LifeIndicator life={gameState.life} maxLife={gameState.maxLife}
              maxBallValue={gameState.balls.find((ball) => ball.isBlackNumber)?.value ?? 2}
              revision={gameState.lifeRevision} changedSlots={gameState.lifeChangedSlots} />
          </div>

          {/* Main 2D Billiard Board */}
          <GameCanvas />
        </div>
      </div>

      {/* Achievement Toast Banner */}
      {recentAchievement && (
        <div className="fixed bottom-6 z-40 bg-black text-white border-2 border-amber-400 px-4 py-2.5 rounded-lg shadow-xl flex items-center gap-3 animate-bounce">
          <Award className="w-6 h-6 text-amber-400 shrink-0" strokeWidth={2.5} />
          <div>
            <div className="text-[11px] font-bold text-amber-300">업적 달성!</div>
            <div className="text-sm font-black text-white">{recentAchievement.title}</div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ResetGameDialog isOpen={isResetOpen} onCancel={cancelReset} onConfirm={confirmReset} />
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
      <RecordModal isOpen={isRecordOpen} onClose={() => setIsRecordOpen(false)} />
      <AchievementModal
        isOpen={isAchievementOpen}
        onClose={() => setIsAchievementOpen(false)}
        achievements={gameEngine.getAchievements()}
      />
      <GameOverModal
        isOpen={gameState.phase === 'gameover'}
        score={gameState.score}
        record={gameState.record}
        maxBall={gameState.maxBallValue}
        totalMerges={gameState.merges}
        onRestart={handleRestart}
        onHome={requestReset}
      />
    </div>
  );
}
