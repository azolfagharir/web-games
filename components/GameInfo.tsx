'use client';

import { GameState } from '@/types/game';
import { formatTime, MAX_FUEL } from '@/utils/helpers';

interface GameInfoProps {
  gameState: GameState;
  onReset: () => void;
  onBackHome: () => void;
}

export default function GameInfo({ gameState, onReset, onBackHome }: GameInfoProps) {
  const fuelPercent = (gameState.fuel / MAX_FUEL) * 100;
  const fuelColor = fuelPercent < 30 
    ? 'bg-gradient-to-r from-red-600 to-red-400' 
    : 'bg-gradient-to-r from-[#ff6b6b] to-[#ffdd57]';
  const livesDisplay = '❤️'.repeat(gameState.lives) + '🖤'.repeat(3 - gameState.lives);

  return (
    <div className="grid grid-cols-4 gap-1.5 text-white p-2 bg-white/5 rounded-xl border border-white/5">
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">امتیاز</span>
        <span className="font-bold text-sm block mt-0.5 text-[#ffdd57]">{gameState.score}</span>
      </div>
      
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">مرحله</span>
        <span className="font-bold text-sm block mt-0.5 text-[#88ddff]">{gameState.level}</span>
      </div>
      
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">⛽ بنزین</span>
        <span className="font-bold text-sm block mt-0.5 text-[#ff6b6b]">{Math.floor(gameState.fuel)}</span>
        <div className="w-full h-1 bg-white/10 rounded-full mt-1 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-300 ${fuelColor}`} style={{ width: fuelPercent + '%' }} />
        </div>
      </div>
      
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">❤️ جان</span>
        <span className="font-bold text-sm block mt-0.5 text-[#ff6b6b]">{livesDisplay}</span>
      </div>
      
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">زمان</span>
        <span className="font-bold text-sm block mt-0.5 text-[#ff9ff3]">{formatTime(gameState.elapsedTime)}</span>
      </div>
      
      <div className="bg-white/5 rounded-xl p-1.5 text-center border border-white/5">
        <span className="text-[8px] uppercase tracking-wider opacity-50 block">🏆 بهترین</span>
        <span className="font-bold text-sm block mt-0.5 text-[#ffdd57]">{gameState.bestTime ? formatTime(gameState.bestTime) : '--:--'}</span>
      </div>
      
      <button 
        className="bg-gradient-to-br from-[#ff6b6b] to-red-600 text-white border-none px-2 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,107,107,0.4)] active:scale-95" 
        onClick={onReset}
      >
        🔄 جدید
      </button>
      
      <button 
        className="bg-white/10 text-white border border-white/20 px-2 py-1.5 rounded-xl text-[11px] font-bold cursor-pointer transition-all hover:bg-white/20 active:scale-95" 
        onClick={onBackHome}
      >
        🏠 خونه
      </button>
    </div>
  );
}