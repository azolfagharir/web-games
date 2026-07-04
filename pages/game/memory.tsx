// app/page.tsx (یا مسیر دلخواه شما)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';

// --- Types ---
type CardType = {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
};

// --- Emojis for Cards ---
const EMOJIS = ['🚀', '🌟', '🎯', '🎨', '🌈', '🍕', '🎵', '📚', '🐱', '🦄', '🍀', '🎮'];

// --- Helper Functions ---
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// --- Main Component ---
export default function MemoryGame() {
  const router = useRouter();
  const [cards, setCards] = useState<CardType[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [gameStatus, setGameStatus] = useState<'idle' | 'playing' | 'won'>('idle');
  const [timer, setTimer] = useState(0);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // --- Constants ---
  const TOTAL_PAIRS = 12; // 24 cards
  const GRID_SIZE = 4; // 4x4 grid for 16 cards, or we can use 6x4 for 24
  const COLS = 6;
  const ROWS = 4;

  // --- Load Best Score ---
  useEffect(() => {
    const saved = localStorage.getItem('memoryMatchBestScore');
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  // --- Initialize Game ---
  const initializeGame = useCallback(() => {
    const selectedEmojis = shuffleArray(EMOJIS).slice(0, TOTAL_PAIRS);
    const deck = shuffleArray([
      ...selectedEmojis.map((emoji, index) => ({
        id: index * 2,
        emoji,
        isFlipped: false,
        isMatched: false,
      })),
      ...selectedEmojis.map((emoji, index) => ({
        id: index * 2 + 1,
        emoji,
        isFlipped: false,
        isMatched: false,
      })),
    ]);
    setCards(deck);
    setFlippedIndices([]);
    setMoves(0);
    setMatches(0);
    setTimer(0);
    setGameStatus('playing');
    setIsLocked(false);
  }, []);

  // --- Timer Logic ---
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (gameStatus === 'playing') {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (gameStatus === 'won') {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [gameStatus]);

  // --- Save Best Score ---
  useEffect(() => {
    if (gameStatus === 'won') {
      const currentScore = moves;
      if (bestScore === null || currentScore < bestScore) {
        setBestScore(currentScore);
        localStorage.setItem('memoryMatchBestScore', String(currentScore));
      }
    }
  }, [gameStatus, moves, bestScore]);

  // --- Card Click Handler ---
  const handleCardClick = (index: number) => {
    // Prevent actions if game is not playing, card is locked, or card is already flipped/matched
    if (
      isLocked ||
      gameStatus !== 'playing' ||
      cards[index].isFlipped ||
      cards[index].isMatched ||
      flippedIndices.includes(index)
    ) {
      return;
    }

    // Flip the card
    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);
    setFlippedIndices((prev) => [...prev, index]);

    // If two cards are flipped, check for a match
    if (flippedIndices.length === 1) {
      const firstIndex = flippedIndices[0];
      const secondIndex = index;
      const firstCard = newCards[firstIndex];
      const secondCard = newCards[secondIndex];

      // Increment moves
      setMoves((prev) => prev + 1);

      // Check for match
      if (firstCard.emoji === secondCard.emoji) {
        // Match found
        newCards[firstIndex].isMatched = true;
        newCards[secondIndex].isMatched = true;
        setCards(newCards);
        setFlippedIndices([]);
        setMatches((prev) => prev + 1);

        // Check for win
        if (matches + 1 === TOTAL_PAIRS) {
          setGameStatus('won');
        }
      } else {
        // No match: lock board and flip cards back after a delay
        setIsLocked(true);
        setTimeout(() => {
          const resetCards = [...cards];
          resetCards[firstIndex].isFlipped = false;
          resetCards[secondIndex].isFlipped = false;
          setCards(resetCards);
          setFlippedIndices([]);
          setIsLocked(false);
        }, 800);
      }
    }
  };

  // --- Reset Game ---
  const resetGame = () => {
    initializeGame();
  };

  // --- Go Home ---
  const goHome = () => {
    router.push('/');
  };

  // --- Format Time ---
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // --- Initialize game on mount ---
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 flex items-center justify-center p-4 font-sans">
      <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 md:p-8 border border-white/20 shadow-2xl max-w-3xl w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🧠</span>
            <h1 className="text-2xl font-bold text-white tracking-tight">بازی حافظه</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="px-4 py-2 bg-yellow-500/20 border border-yellow-500/40 text-yellow-300 rounded-xl text-sm hover:bg-yellow-500/30 transition-all duration-200 font-medium"
            >
              🔄 شروع مجدد
            </button>
            <button
              onClick={goHome}
              className="px-4 py-2 bg-blue-500/20 border border-blue-500/40 text-blue-300 rounded-xl text-sm hover:bg-blue-500/30 transition-all duration-200 font-medium"
            >
              🏠 خونه
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-300">حرکات</p>
            <p className="text-xl font-bold text-white">{moves}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-300">جفت‌ها</p>
            <p className="text-xl font-bold text-white">{matches}/{TOTAL_PAIRS}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-300">زمان</p>
            <p className="text-xl font-bold text-white font-mono">{formatTime(timer)}</p>
          </div>
          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
            <p className="text-xs text-gray-300">بهترین</p>
            <p className="text-xl font-bold text-yellow-400 font-mono">
              {bestScore !== null ? bestScore : '-'}
            </p>
          </div>
        </div>

        {/* Game Board */}
        <div className="relative">
          <div
            className="grid gap-3 md:gap-4"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
            }}
          >
            {cards.map((card, index) => (
              <div
                key={card.id}
                onClick={() => handleCardClick(index)}
                className={`
                  aspect-square rounded-2xl cursor-pointer transition-all duration-300 transform
                  flex items-center justify-center text-4xl md:text-5xl
                  ${
                    card.isFlipped || card.isMatched
                      ? 'bg-gradient-to-br from-white to-gray-100 shadow-lg scale-100 rotate-0'
                      : 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg hover:scale-105 hover:shadow-xl rotate-0'
                  }
                  ${
                    card.isMatched
                      ? 'opacity-60 cursor-default scale-95 bg-gradient-to-br from-green-300 to-emerald-400'
                      : ''
                  }
                  ${!card.isFlipped && !card.isMatched ? 'hover:-rotate-3' : ''}
                  border-2 border-white/30 transition-all duration-300
                `}
                style={{
                  transformStyle: 'preserve-3d',
                }}
              >
                <div
                  className={`
                    w-full h-full flex items-center justify-center transition-all duration-300
                    ${card.isFlipped || card.isMatched ? 'rotate-0' : 'rotate-180'}
                  `}
                >
                  {card.isFlipped || card.isMatched ? card.emoji : '❓'}
                </div>
              </div>
            ))}
          </div>

          {/* Overlay for win */}
          {gameStatus === 'won' && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6">
              <div className="text-center space-y-4">
                <div className="text-8xl animate-bounce">🎉</div>
                <h2 className="text-4xl md:text-5xl font-bold text-white">تبریک!</h2>
                <p className="text-xl text-yellow-300">شما بازی را با <span className="font-bold">{moves}</span> حرکت به پایان رساندید!</p>
                {bestScore !== null && moves === bestScore && (
                  <p className="text-2xl text-yellow-400 font-bold animate-pulse">🏆 رکورد جدید! 🏆</p>
                )}
                <button
                  onClick={resetGame}
                  className="mt-4 px-8 py-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white text-lg font-bold rounded-xl hover:scale-105 transition-all duration-200 shadow-xl"
                >
                  بازی دوباره
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center text-gray-300 text-sm mt-6 space-x-4">
          <span>🔄 کارت‌ها را برگردانید و جفت‌های مشابه را پیدا کنید</span>
          <span className="hidden sm:inline">|</span>
          <span>🧠 با کمترین حرکت ممکن برنده شوید</span>
        </div>
      </div>
    </div>
  );
}