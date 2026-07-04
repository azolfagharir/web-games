'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function MarioGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [bestTime, setBestTime] = useState<number | null>(null);

  // ============================================================
  // تنظیمات نهایی - سرعت پرش بالا، اندازه مناسب
  // ============================================================
  const W = 800;
  const H = 500;
  const GRAVITY = 4; // افزایش جاذبه برای پایین اومدن سریع‌تر (از 2 به 4)
  const JUMP_FORCE = -27; // قدرت پرش (کمی کمتر برای کنترل بهتر)
  const GROUND_Y = 440;
  const MARIO_X = 35;
  const WORLD_SPEED = 14;

  const keys = useRef({ jump: false, shoot: false });
  const frameCount = useRef(0);
  const startTime = useRef(Date.now());
  const gameLoopRef = useRef<number>();

  // ============================================================
  // توابع کمکی
  // ============================================================
  function formatTime(ms: number) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const remainingS = s % 60;
    return `${String(m).padStart(2, '0')}:${String(remainingS).padStart(2, '0')}`;
  }

  function rectCollide(a: any, b: any) {
    return a.x < b.x + b.w && a.x + a.w > b.x &&
      a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ============================================================
  // حلقه بازی
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const saved = localStorage.getItem('marioBestTime');
    if (saved) setBestTime(parseFloat(saved));

    let mario = { x: MARIO_X, y: GROUND_Y - 45, w: 32, h: 45, vy: 0, onGround: false };
    let obstacles: any[] = [];
    let enemies: any[] = [];
    let bullets: any[] = [];
    let currentScore = 0;
    let currentLives = 3;
    let isGameOver = false;
    let nextObstacleX = W + 100;
    let shootCooldown = 0;
    let frame = 0;

    function spawnObstacle() {
      const types = ['cactus', 'box'];
      const type = types[Math.floor(Math.random() * types.length)];
      let w, h;
      if (type === 'cactus') {
        w = randomBetween(18, 35);
        h = randomBetween(30, 55);
      } else {
        w = randomBetween(25, 40);
        h = randomBetween(25, 40);
      }
      obstacles.push({
        x: nextObstacleX,
        y: GROUND_Y - h + 5,
        w, h,
        type
      });
      nextObstacleX += randomBetween(200, 250);
    }

    for (let i = 0; i < 6; i++) spawnObstacle();

    function gameLoop() {
      frame++;
      const elapsed = Date.now() - startTime.current;
      setElapsedTime(elapsed);

      if (!isGameOver) {
        // ===== پرش سریع =====
        if (keys.current.jump && mario.onGround) {
          mario.vy = JUMP_FORCE;
          mario.onGround = false;
        }
        mario.vy += GRAVITY; // جاذبه بیشتر = سقوط سریع‌تر
        if (mario.vy > 25) mario.vy = 25; // افزایش سرعت نهایی سقوط
        mario.y += mario.vy;

        if (mario.y + mario.h >= GROUND_Y) {
          mario.y = GROUND_Y - mario.h;
          mario.vy = 0;
          mario.onGround = true;
        }

        if (mario.y > H + 50) {
          currentLives--;
          setLives(currentLives);
          if (currentLives <= 0) {
            isGameOver = true;
            setGameOver(true);
            if (!bestTime || elapsed < bestTime) {
              localStorage.setItem('marioBestTime', String(elapsed));
              setBestTime(elapsed);
            }
            return;
          }
          mario = { x: MARIO_X, y: GROUND_Y - 45, w: 32, h: 45, vy: 0, onGround: false };
          return;
        }

        // ===== تیراندازی =====
        if (shootCooldown > 0) shootCooldown--;
        if (keys.current.shoot && shootCooldown === 0) {
          bullets.push({
            x: mario.x + mario.w,
            y: mario.y + 18,
            w: 16,
            h: 8,
            speed: 14,
            direction: 1
          });
          shootCooldown = 6;
        }

        for (let i = bullets.length - 1; i >= 0; i--) {
          const b = bullets[i];
          b.x += b.speed * b.direction;
          if (b.x > W || b.x < -20) { bullets.splice(i, 1); continue; }
          for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (!e.alive) continue;
            if (rectCollide(b, e)) {
              e.alive = false;
              enemies.splice(j, 1);
              currentScore += 30;
              setScore(currentScore);
              bullets.splice(i, 1);
              break;
            }
          }
        }

        for (const enemy of enemies) {
          if (!enemy.alive) continue;
          enemy.x -= WORLD_SPEED;
          enemy.x += enemy.speed * enemy.direction;
          if (enemy.x < 20 || enemy.x > W - 20) enemy.direction *= -1;
          if (rectCollide(mario, enemy)) {
            currentLives--;
            setLives(currentLives);
            if (currentLives <= 0) {
              isGameOver = true;
              setGameOver(true);
              if (!bestTime || elapsed < bestTime) {
                localStorage.setItem('marioBestTime', String(elapsed));
                setBestTime(elapsed);
              }
              return;
            }
            mario = { x: MARIO_X, y: GROUND_Y - 45, w: 32, h: 45, vy: 0, onGround: false };
            return;
          }
          if (enemy.x + enemy.w < -50) enemy.alive = false;
        }
        enemies = enemies.filter(e => e.alive);

        for (let i = obstacles.length - 1; i >= 0; i--) {
          const obs = obstacles[i];
          obs.x -= WORLD_SPEED;
          if (obs.x + obs.w < -50) { obstacles.splice(i, 1); continue; }
          if (rectCollide(mario, obs)) {
            currentLives--;
            setLives(currentLives);
            if (currentLives <= 0) {
              isGameOver = true;
              setGameOver(true);
              if (!bestTime || elapsed < bestTime) {
                localStorage.setItem('marioBestTime', String(elapsed));
                setBestTime(elapsed);
              }
              return;
            }
            mario = { x: MARIO_X, y: GROUND_Y - 45, w: 32, h: 45, vy: 0, onGround: false };
            return;
          }
        }

        if (obstacles.length < 7) spawnObstacle();

        if (enemies.length < 4 && Math.random() < 0.015) {
          enemies.push({
            x: W + randomBetween(50, 200),
            y: GROUND_Y - 28 + randomBetween(-20, 10),
            w: 28, h: 28,
            speed: 0.8 + Math.random() * 0.8,
            direction: -1,
            alive: true
          });
        }

        currentScore += 1.5;
        setScore(Math.floor(currentScore));
        if (currentScore % 80 < 0.5 && currentLives < 5) {
          currentLives++;
          setLives(currentLives);
        }
      }

      const c = ctx!;

      c.clearRect(0, 0, W, H);

      const skyGrad = c.createLinearGradient(0, 0, 0, H);
      skyGrad.addColorStop(0, '#4A90D9');
      skyGrad.addColorStop(0.5, '#87CEEB');
      skyGrad.addColorStop(1, '#E8F4FD');
      c.fillStyle = skyGrad;
      c.fillRect(0, 0, W, H);

      c.fillStyle = '#FFD700';
      c.shadowColor = '#FFD700';
      c.shadowBlur = 30;
      c.beginPath();
      c.arc(W - 60, 50, 30, 0, Math.PI * 2);
      c.fill();
      c.shadowBlur = 0;

      c.fillStyle = 'rgba(255,255,255,0.4)';
      for (let i = 0; i < 4; i++) {
        const x = (i * 200 - frame * 0.3) % (W + 100);
        const y = 30 + i * 25;
        c.beginPath();
        c.arc(x, y, 30, 0, Math.PI * 2);
        c.arc(x + 35, y - 8, 25, 0, Math.PI * 2);
        c.arc(x + 60, y + 5, 22, 0, Math.PI * 2);
        c.fill();
      }

      c.fillStyle = '#4a7c59';
      c.fillRect(0, GROUND_Y, W, H - GROUND_Y);
      c.fillStyle = '#5a8c69';
      c.fillRect(0, GROUND_Y, W, 6);

      for (const obs of obstacles) {
        c.shadowColor = 'rgba(0,0,0,0.2)';
        c.shadowBlur = 8;
        if (obs.type === 'cactus') {
          c.fillStyle = '#2d7d2d';
          c.fillRect(obs.x + 4, obs.y, 6, obs.h);
          c.fillRect(obs.x + obs.w - 10, obs.y, 6, obs.h);
          c.fillRect(obs.x, obs.y + 10, obs.w, 8);
          c.fillRect(obs.x + 2, obs.y + 20, obs.w - 4, 8);
        } else {
          c.fillStyle = '#8B7355';
          c.fillRect(obs.x, obs.y, obs.w, obs.h);
          c.fillStyle = '#A08060';
          c.fillRect(obs.x + 2, obs.y + 2, obs.w - 4, 4);
          c.fillRect(obs.x + 2, obs.y + obs.h - 6, obs.w - 4, 4);
        }
        c.shadowBlur = 0;
      }

      for (const enemy of enemies) {
        if (!enemy.alive) continue;
        c.shadowColor = 'rgba(0,0,0,0.2)';
        c.shadowBlur = 8;
        c.fillStyle = '#8B0000';
        c.beginPath();
        c.arc(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, enemy.w / 2, 0, Math.PI * 2);
        c.fill();
        c.shadowBlur = 0;
        c.fillStyle = 'white';
        c.beginPath();
        c.arc(enemy.x + 8, enemy.y + 12, 5, 0, Math.PI * 2);
        c.arc(enemy.x + enemy.w - 8, enemy.y + 12, 5, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = 'black';
        c.beginPath();
        c.arc(enemy.x + 6, enemy.y + 13, 2.5, 0, Math.PI * 2);
        c.arc(enemy.x + enemy.w - 10, enemy.y + 13, 2.5, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = '#5A0000';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(enemy.x + enemy.w / 2, enemy.y + 20, 8, 0.1, Math.PI - 0.1);
        c.stroke();
        c.fillStyle = '#6B3A2A';
        const legOffset = Math.sin(frame * 0.08 + enemy.x) * 2;
        c.fillRect(enemy.x + 2, enemy.y + enemy.h - 4, 8, 4 + legOffset);
        c.fillRect(enemy.x + enemy.w - 10, enemy.y + enemy.h - 4, 8, 4 - legOffset);
        c.shadowBlur = 0;
      }

      for (const b of bullets) {
        c.shadowColor = '#FF6B00';
        c.shadowBlur = 20;
        c.fillStyle = '#FF6B00';
        c.fillRect(b.x, b.y, b.w, b.h);
        c.shadowBlur = 0;
        c.fillStyle = '#FFD700';
        c.beginPath();
        c.arc(b.x + b.w, b.y + b.h / 2, 5, 0, Math.PI * 2);
        c.fill();
      }

      const m = mario;
      c.shadowColor = 'rgba(0,0,0,0.2)';
      c.shadowBlur = 10;
      c.fillStyle = '#E52521';
      c.fillRect(m.x + 2, m.y, m.w - 4, 10);
      c.fillRect(m.x, m.y + 4, m.w, 6);
      c.fillStyle = '#FFDAB9';
      c.fillRect(m.x + 4, m.y + 10, m.w - 8, 12);
      c.fillStyle = 'white';
      c.fillRect(m.x + 18, m.y + 12, 8, 8);
      c.fillStyle = '#222';
      c.fillRect(m.x + 22, m.y + 14, 4, 4);
      c.fillStyle = '#6B3A2A';
      c.fillRect(m.x + 4, m.y + 20, m.w - 8, 4);
      c.fillStyle = '#CC5555';
      c.fillRect(m.x + 20, m.y + 24, 8, 4);
      c.fillStyle = '#E52521';
      c.fillRect(m.x + 2, m.y + 24, m.w - 4, 12);
      c.fillStyle = '#FFD700';
      c.beginPath();
      c.arc(m.x + 8, m.y + 30, 3, 0, Math.PI * 2);
      c.arc(m.x + m.w - 8, m.y + 30, 3, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#0066CC';
      c.fillRect(m.x + 4, m.y + 32, 8, 6);
      c.fillRect(m.x + m.w - 12, m.y + 32, 8, 6);
      c.fillStyle = '#6B3A2A';
      c.fillRect(m.x + 2, m.y + m.h - 4, 10, 4);
      c.fillRect(m.x + m.w - 12, m.y + m.h - 4, 10, 4);
      c.shadowBlur = 0;

      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.roundRect(10, 8, 400, 30, 12);
      c.fill();
      c.fillStyle = 'white';
      c.font = 'bold 15px Tahoma';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(`🪙 ${Math.floor(currentScore)}`, 20, 23);
      c.fillText(`❤️ ${currentLives}`, 120, 23);
      c.fillText(`⏱️ ${formatTime(elapsed)}`, 200, 23);
      c.fillText(`🏆 ${bestTime ? formatTime(bestTime) : '--:--'}`, 300, 23);

      if (isGameOver) {
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillStyle = '#FF4444';
        c.font = 'bold 50px Tahoma';
        c.shadowColor = '#FF4444';
        c.shadowBlur = 30;
        c.fillText('💀 Game Over', W / 2, H / 2 - 40);
        c.shadowBlur = 0;
        c.fillStyle = 'white';
        c.font = '24px Tahoma';
        c.fillText(`امتیاز: ${Math.floor(currentScore)}`, W / 2, H / 2 + 40);
        c.fillStyle = '#ff9ff3';
        c.font = '18px Tahoma';
        c.fillText(`⏱️ زمان: ${formatTime(elapsed)}`, W / 2, H / 2 + 90);
        if (bestTime) {
          c.fillStyle = '#ffdd57';
          c.font = '16px Tahoma';
          c.fillText(`🏆 بهترین: ${formatTime(bestTime)}`, W / 2, H / 2 + 130);
        }
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, w: number, h: number, r: number) {
      if (r > w / 2) r = w / 2;
      if (r > h / 2) r = h / 2;
      this.moveTo(x + r, y);
      this.lineTo(x + w - r, y);
      this.quadraticCurveTo(x + w, y, x + w, y + r);
      this.lineTo(x + w, y + h - r);
      this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      this.lineTo(x + r, y + h);
      this.quadraticCurveTo(x, y + h, x, y + h - r);
      this.lineTo(x, y + r);
      this.quadraticCurveTo(x, y, x + r, y);
      this.closePath();
      return this;
    };

    gameLoop();

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, []);

  // ============================================================
  // کنترل‌های کیبورد
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { keys.current.jump = true;
        e.preventDefault(); }
      if (e.key === 'z' || e.key === 'Z') { keys.current.shoot = true;
        e.preventDefault(); }
      if (e.key === 'r' || e.key === 'R') {
        resetGame();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') { keys.current.jump = false;
        e.preventDefault(); }
      if (e.key === 'z' || e.key === 'Z') { keys.current.shoot = false;
        e.preventDefault(); }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // ============================================================
  // ریست بازی
  // ============================================================
  const resetGame = () => {
    window.location.reload();
  };

  const goHome = () => {
    router.push('/');
  };

  // ============================================================
  // رندر
  // ============================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] flex items-center justify-center p-4">
      <div className="bg-[#1a1a2e]/80 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl max-w-[860px] w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍄</span>
            <h2 className="text-xl font-bold text-white">ماجراجویی ماریو</h2>
            <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">بی‌نهایت</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetGame}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition"
            >
              🔄 ریست
            </button>
            <button
              onClick={goHome}
              className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition"
            >
              🏠 خونه
            </button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="w-full h-auto rounded-2xl border-2 border-blue-500/30"
        />

        <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
          <button
            className="px-6 py-2.5 bg-yellow-500/20 border-2 border-yellow-500/30 text-white rounded-xl text-sm font-bold hover:bg-yellow-500/30 transition active:scale-95"
            onMouseDown={() => keys.current.jump = true}
            onMouseUp={() => keys.current.jump = false}
            onMouseLeave={() => keys.current.jump = false}
            onTouchStart={(e) => { e.preventDefault();
              keys.current.jump = true; }}
            onTouchEnd={(e) => { e.preventDefault();
              keys.current.jump = false; }}
          >
            🦘 پرش
          </button>
          <button
            className="px-6 py-2.5 bg-red-500/20 border-2 border-red-500/30 text-white rounded-xl text-sm font-bold hover:bg-red-500/30 transition active:scale-95"
            onMouseDown={() => keys.current.shoot = true}
            onMouseUp={() => keys.current.shoot = false}
            onMouseLeave={() => keys.current.shoot = false}
            onTouchStart={(e) => { e.preventDefault();
              keys.current.shoot = true; }}
            onTouchEnd={(e) => { e.preventDefault();
              keys.current.shoot = false; }}
          >
            🎯 تیر
          </button>
        </div>

        <div className="text-center text-gray-400 text-xs mt-3">
          <span>🎮 Space ← پرش</span>
          <span className="mx-2">|</span>
          <span>🎯 Z ← تیر</span>
          <span className="mx-2">|</span>
          <span>🔄 R ← ریست</span>
        </div>
      </div>
    </div>
  );
}