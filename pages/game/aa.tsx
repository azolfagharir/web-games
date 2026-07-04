'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type GameStatus = 'playing' | 'won' | 'lost';

type Pin = {
  id: number;
  angle: number; // زاویه محلی pin نسبت به دایره مرکزی
  isDefault: boolean;
};

type FlyingPin = {
  id: number;
  y: number;
};

export default function AAGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [level, setLevel] = useState(1);
  const [bestLevel, setBestLevel] = useState(1);
  const [remainingArrows, setRemainingArrows] = useState(0);
  const [gameState, setGameState] = useState<GameStatus>('playing');

  // ابعاد canvas
  const WIDTH = 800;
  const HEIGHT = 1000;

  // مرکز بازی
  const CENTER_X = WIDTH / 2;
  const CENTER_Y = 390;

  // اجزای بصری
  const CENTER_RADIUS = 82;
  const PIN_LENGTH = 155;
  const PIN_HEAD_RADIUS = 16;
  const PIN_LINE_WIDTH = 3;

  // مختصات تیر شلیک‌شونده از پایین
  const START_SHOOT_Y = HEIGHT - 210;

  // سرعت‌ها
  const SHOOT_SPEED = 28;

  // آستانه برخورد زاویه‌ای
  const COLLISION_THRESHOLD = 0.22;

  const stateRef = useRef<{
    level: number;
    gameState: GameStatus;
    rotationAngle: number;
    rotationSpeed: number;
    direction: 1 | -1;
    pins: Pin[];
    waitingPins: number[];
    currentShootingPin: FlyingPin | null;
  }>({
    level: 1,
    gameState: 'playing',
    rotationAngle: 0,
    rotationSpeed: 0.012,
    direction: 1,
    pins: [],
    waitingPins: [],
    currentShootingPin: null,
  });

  const normalizeAngleDiff = (a: number, b: number) => {
    let diff = a - b;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return diff;
  };

  // خواندن رکورد
  useEffect(() => {
    const saved = localStorage.getItem('aaBestLevel');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setBestLevel(parsed);
      }
    }
  }, []);

  const initLevel = useCallback((lvl: number) => {
    const s = stateRef.current;

    s.level = lvl;
    s.gameState = 'playing';
    s.rotationAngle = 0;
    s.currentShootingPin = null;

    // مرحله 1 آسان باشد
    // با هر مرحله تعداد pinهای پیش‌فرض و pinهای قابل شلیک افزایش پیدا کند
    const defaultPinCount = Math.min(1 + (lvl - 1), 18);
    const shootableCount = Math.min(3 + (lvl - 1), 30);

    // سرعت چرخش تدریجی زیاد شود
    s.rotationSpeed = Math.min(0.012 + (lvl - 1) * 0.0012, 0.035);

    // تغییر جهت در مراحل بالاتر برای تنوع
    s.direction = lvl < 4 ? 1 : lvl % 2 === 0 ? 1 : -1;

    const initialPins: Pin[] = [];

    if (defaultPinCount === 1) {
      // مرحله اول: فقط یک pin در بالا تا جای شلیک پایین باز باشد
      initialPins.push({
        id: -1,
        angle: -Math.PI / 2,
        isDefault: true,
      });
    } else {
      const step = (Math.PI * 2) / defaultPinCount;
      for (let i = 0; i < defaultPinCount; i++) {
        initialPins.push({
          id: -1 - i,
          angle: -Math.PI / 2 + i * step,
          isDefault: true,
        });
      }
    }

    s.pins = initialPins;

    const waiting: number[] = [];
    for (let i = 1; i <= shootableCount; i++) {
      waiting.push(i);
    }
    s.waitingPins = waiting;

    setLevel(lvl);
    setGameState('playing');
    setRemainingArrows(waiting.length);
  }, []);

  const shoot = useCallback(() => {
    const s = stateRef.current;

    if (s.gameState !== 'playing') return;
    if (s.currentShootingPin) return;
    if (s.waitingPins.length === 0) return;

    const nextId = s.waitingPins.shift();
    if (nextId === undefined) return;

    s.currentShootingPin = {
      id: nextId,
      y: START_SHOOT_Y,
    };

    setRemainingArrows(s.waitingPins.length);
  }, [START_SHOOT_Y]);

  useEffect(() => {
    initLevel(1);
  }, [initLevel]);

  useEffect(() => {
    let animationId = 0;

    const update = () => {
      const s = stateRef.current;

      if (s.gameState !== 'playing') return;

      s.rotationAngle += s.rotationSpeed * s.direction;

      if (s.currentShootingPin) {
        s.currentShootingPin.y -= SHOOT_SPEED;

        // وقتی سر pin به نقطه اتصال برسد
        if (s.currentShootingPin.y <= CENTER_Y + CENTER_RADIUS + PIN_LENGTH) {
          // pin از پایین وارد می‌شود، زاویه جهانی آن پایین دایره است
          const hitAngleWorld = Math.PI / 2;

          // ذخیره زاویه محلی نسبت به چرخش مرکز
          const localAngle = hitAngleWorld - s.rotationAngle;

          let collided = false;

          for (const pin of s.pins) {
            const diff = normalizeAngleDiff(localAngle, pin.angle);
            if (Math.abs(diff) < COLLISION_THRESHOLD) {
              collided = true;
              break;
            }
          }

          if (collided) {
            s.pins.push({
              id: s.currentShootingPin.id,
              angle: localAngle,
              isDefault: false,
            });

            s.currentShootingPin = null;
            s.gameState = 'lost';
            setGameState('lost');
            return;
          }

          s.pins.push({
            id: s.currentShootingPin.id,
            angle: localAngle,
            isDefault: false,
          });

          s.currentShootingPin = null;

          if (s.waitingPins.length === 0) {
            s.gameState = 'won';
            setGameState('won');

            const nextUnlockedLevel = s.level + 1;
            if (nextUnlockedLevel > bestLevel) {
              setBestLevel(nextUnlockedLevel);
              localStorage.setItem('aaBestLevel', String(nextUnlockedLevel));
            }
          }
        }
      }
    };

    const drawPin = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      label: string | number,
      mainColor: string,
      textColor: string
    ) => {
      ctx.beginPath();
      ctx.arc(x, y, PIN_HEAD_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();

      ctx.fillStyle = textColor;
      ctx.font = 'bold 16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(label), x, y);
    };

    const render = (ctx: CanvasRenderingContext2D) => {
      const s = stateRef.current;

      ctx.clearRect(0, 0, WIDTH, HEIGHT);

      const lost = s.gameState === 'lost';
      const bgColor = lost ? '#ff1744' : '#f5f5f0';
      const mainColor = lost ? '#ffffff' : '#111111';
      const textOnPin = lost ? '#ff1744' : '#f5f5f0';

      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // رسم pinهای چسبیده به دایره
      ctx.save();
      ctx.translate(CENTER_X, CENTER_Y);
      ctx.rotate(s.rotationAngle);

      ctx.strokeStyle = mainColor;
      ctx.lineWidth = PIN_LINE_WIDTH;

      for (const pin of s.pins) {
        const endX = Math.cos(pin.angle) * (CENTER_RADIUS + PIN_LENGTH);
        const endY = Math.sin(pin.angle) * (CENTER_RADIUS + PIN_LENGTH);

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      for (const pin of s.pins) {
        const endX = Math.cos(pin.angle) * (CENTER_RADIUS + PIN_LENGTH);
        const endY = Math.sin(pin.angle) * (CENTER_RADIUS + PIN_LENGTH);

        ctx.beginPath();
        ctx.arc(endX, endY, PIN_HEAD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();

        if (!pin.isDefault && pin.id > 0) {
          ctx.save();
          ctx.translate(endX, endY);
          ctx.rotate(-s.rotationAngle);

          ctx.fillStyle = textOnPin;
          ctx.font = 'bold 16px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(pin.id), 0, 0);

          ctx.restore();
        }
      }

      // دایره مرکزی
      ctx.beginPath();
      ctx.arc(0, 0, CENTER_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = mainColor;
      ctx.fill();

      ctx.restore();

      // متن وسط
      ctx.fillStyle = textOnPin;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.font = 'bold 86px Arial';
      ctx.fillText(String(s.level), CENTER_X, CENTER_Y - 12);

      ctx.font = 'bold 22px Arial';
      if (s.gameState === 'lost') {
        ctx.fillText('FAILED', CENTER_X, CENTER_Y + 44);
      } else if (s.gameState === 'won') {
        ctx.fillText('CLEARED', CENTER_X, CENTER_Y + 44);
      } else {
        ctx.fillText('LEVEL', CENTER_X, CENTER_Y + 44);
      }

      // تیر در حال پرواز
      if (s.currentShootingPin) {
        ctx.beginPath();
        ctx.moveTo(CENTER_X, s.currentShootingPin.y);
        ctx.lineTo(CENTER_X, s.currentShootingPin.y + PIN_LENGTH);
        ctx.strokeStyle = mainColor;
        ctx.lineWidth = PIN_LINE_WIDTH;
        ctx.stroke();

        drawPin(
          ctx,
          CENTER_X,
          s.currentShootingPin.y,
          s.currentShootingPin.id,
          mainColor,
          textOnPin
        );
      }

      // صف تیرهای پایین
      const queueSpacing = 50;
      const visibleQueueCount = Math.min(s.waitingPins.length, 8);

      for (let i = 0; i < visibleQueueCount; i++) {
        const y = START_SHOOT_Y + i * queueSpacing;
        drawPin(ctx, CENTER_X, y, s.waitingPins[i], mainColor, textOnPin);
      }
    };

    const loop = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      update();
      render(ctx);

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => cancelAnimationFrame(animationId);
  }, [
    WIDTH,
    HEIGHT,
    CENTER_X,
    CENTER_Y,
    CENTER_RADIUS,
    PIN_LENGTH,
    PIN_HEAD_RADIUS,
    PIN_LINE_WIDTH,
    START_SHOOT_Y,
    SHOOT_SPEED,
    COLLISION_THRESHOLD,
    bestLevel,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();

        const s = stateRef.current;
        if (s.gameState === 'playing') {
          shoot();
        } else if (s.gameState === 'lost') {
          initLevel(s.level);
        } else if (s.gameState === 'won') {
          initLevel(s.level + 1);
        }
      }

      if (e.key === 'r' || e.key === 'R') {
        initLevel(stateRef.current.level);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shoot, initLevel]);

  const handleCanvasAction = () => {
    const s = stateRef.current;

    if (s.gameState === 'playing') {
      shoot();
    } else if (s.gameState === 'lost') {
      initLevel(s.level);
    } else if (s.gameState === 'won') {
      initLevel(s.level + 1);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-[520px] rounded-3xl border border-neutral-700 bg-neutral-800 p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <span className="rounded-lg bg-neutral-700 px-3 py-1 text-sm font-bold text-yellow-400">
              🏆 Best: {bestLevel}
            </span>
            <span className="rounded-lg bg-neutral-700 px-3 py-1 text-sm font-bold text-cyan-400">
              🎯 Left: {remainingArrows}
            </span>
            <span className="rounded-lg bg-neutral-700 px-3 py-1 text-sm font-bold text-lime-400">
              Level: {level}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => initLevel(stateRef.current.level)}
              className="rounded-lg border border-red-500/30 bg-red-600/20 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-600/30"
            >
              Reset
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg border border-blue-500/30 bg-blue-600/20 px-3 py-1 text-xs font-semibold text-blue-400 transition hover:bg-blue-600/30"
            >
              Home
            </button>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[#f5f5f0] aspect-[4/5]">
          <canvas
            ref={canvasRef}
            width={WIDTH}
            height={HEIGHT}
            onClick={handleCanvasAction}
            onTouchStart={handleCanvasAction}
            className="block h-full w-full cursor-pointer touch-none"
          />
        </div>

        <div className="mt-4 flex justify-between px-2 text-center text-xs text-neutral-400">
          <span>⌨️ Space = Shoot / Continue</span>
          <span>🔄 R = Restart</span>
        </div>

        {gameState === 'won' && (
          <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-center text-sm font-semibold text-green-400">
            مرحله با موفقیت تمام شد. با Space یا کلیک برو مرحله بعد.
          </div>
        )}

        {gameState === 'lost' && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm font-semibold text-red-400">
            باختی. با Space یا کلیک دوباره تلاش کن.
          </div>
        )}
      </div>
    </div>
  );
}
