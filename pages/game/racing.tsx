'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGameLogic } from '@/hooks/useGameLogic';
import GameCanvas from '@/components/GameCanvas';
import GameInfo from '@/components/GameInfo';
import GameControls from '@/components/GameControls';

export default function RacingGame() {
  const router = useRouter();
  const {
    gameState,
    resetGame,
    updateGame,
    setLeftPressed,
    setRightPressed,
  } = useGameLogic('racing');

  // Game loop
  useEffect(() => {
    let animationId: number;
    
    const loop = () => {
      updateGame();
      animationId = requestAnimationFrame(loop);
    };
    
    loop();
    
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [updateGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLeftPressed(true);
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        setRightPressed(true);
        e.preventDefault();
      }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setLeftPressed(false);
        e.preventDefault();
      }
      if (e.key === 'ArrowRight') {
        setRightPressed(false);
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setLeftPressed, setRightPressed, resetGame]);

  const handleBackHome = () => {
    router.push('/');
  };

  return (
    <div className="game-page">
      <div className="game-wrapper">
        <div className="game-canvas-wrapper">
          {/* gameType="racing" حذف شد */}
          <GameCanvas gameState={gameState} />
        </div>
        
        <div className="game-info-wrapper">
          <GameInfo 
            gameState={gameState} 
            onReset={resetGame}
            onBackHome={handleBackHome}
          />
        </div>
        
        <div className="game-controls-wrapper">
          <GameControls
            onLeftPress={setLeftPressed}
            onRightPress={setRightPressed}
          />
        </div>
      </div>
    </div>
  );
}