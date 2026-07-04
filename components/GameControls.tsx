'use client';

interface GameControlsProps {
  onLeftPress: (pressed: boolean) => void;
  onRightPress: (pressed: boolean) => void;
}

export default function GameControls({ onLeftPress, onRightPress }: GameControlsProps) {
  return (
    <div className="flex justify-center gap-4 mt-1">
      <button
        className="bg-white/10 border-2 border-white/20 text-white text-3xl px-8 py-3 rounded-2xl min-w-[80px] transition-all active:scale-90 active:bg-white/25 hover:bg-white/15 hover:border-white/30"
        onMouseDown={() => onLeftPress(true)}
        onMouseUp={() => onLeftPress(false)}
        onMouseLeave={() => onLeftPress(false)}
        onTouchStart={(e) => { e.preventDefault(); onLeftPress(true); }}
        onTouchEnd={(e) => { e.preventDefault(); onLeftPress(false); }}
        onTouchCancel={(e) => { e.preventDefault(); onLeftPress(false); }}
      >
        ◀
      </button>
      <button
        className="bg-white/10 border-2 border-white/20 text-white text-3xl px-8 py-3 rounded-2xl min-w-[80px] transition-all active:scale-90 active:bg-white/25 hover:bg-white/15 hover:border-white/30"
        onMouseDown={() => onRightPress(true)}
        onMouseUp={() => onRightPress(false)}
        onMouseLeave={() => onRightPress(false)}
        onTouchStart={(e) => { e.preventDefault(); onRightPress(true); }}
        onTouchEnd={(e) => { e.preventDefault(); onRightPress(false); }}
        onTouchCancel={(e) => { e.preventDefault(); onRightPress(false); }}
      >
        ▶
      </button>
    </div>
  );
}