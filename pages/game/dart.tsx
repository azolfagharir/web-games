'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function DartGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [shots, setShots] = useState<any[]>([]);

  // ============================================================
  // تنظیمات
  // ============================================================
  const W = 650;
  const H = 500;
  const TARGET_RADIUS = 110;
  const MAX_ATTEMPTS = 3;
  const MOVE_SPEED = 20.5; // سرعت ثابت و مناسب

  const targetRef = useRef({
    x: W / 2,
    y: H / 2,
    radius: TARGET_RADIUS,
    dx: MOVE_SPEED  ,
    dy: MOVE_SPEED 
  });

  const aimRef = useRef({ x: W / 2, y: H / 2 });
  const particlesRef = useRef<any[]>([]);
  const isAnimatingRef = useRef(false);
  const showResultTimerRef = useRef(0);
  const frameRef = useRef(0);
  const gameLoopRef = useRef<number>();

  // ============================================================
  // توابع کمکی
  // ============================================================
  function randomBetween(min: number, max: number) {
    return Math.random() * (max - min) + min;
  }

  function distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  function getScoreByRadius(dist: number) {
    const ratio = dist / TARGET_RADIUS;
    if (ratio <= 0.06) return 50;
    if (ratio <= 0.15) return 25;
    if (ratio <= 0.25) return 20;
    if (ratio <= 0.35) return 18;
    if (ratio <= 0.45) return 16;
    if (ratio <= 0.55) return 14;
    if (ratio <= 0.65) return 12;
    if (ratio <= 0.75) return 10;
    if (ratio <= 0.85) return 8;
    if (ratio <= 0.95) return 6;
    return 4;
  }

  function getRingColor(score: number): string {
    const colors: Record<number, string> = {
      50: '#FFD700', 25: '#FF6B00', 20: '#FF4444',
      18: '#FF69B4', 16: '#9B59B6', 14: '#3498DB',
      12: '#2ECC71', 10: '#F1C40F', 8: '#E67E22',
      6: '#1ABC9C', 4: '#95A5A6'
    };
    return colors[score] || '#666';
  }

  function createExplosion(x: number, y: number, color: string) {
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(1, 6);
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 25 + Math.random() * 20,
        maxLife: 45,
        size: randomBetween(2, 6),
        color: color
      });
    }
  }

  // ============================================================
  // شلیک
  // ============================================================
  const shoot = () => {
    if (gameOver || isAnimatingRef.current) return;
    if (attempts >= MAX_ATTEMPTS) {
      setGameOver(true);
      return;
    }

    const aim = aimRef.current;
    const target = targetRef.current;
    const dist = distance(aim.x, aim.y, target.x, target.y);

    let points = 0;
    let hit = false;

    if (dist <= TARGET_RADIUS) {
      points = getScoreByRadius(dist);
      setScore(prev => prev + points);
      setHits(prev => prev + 1);
      hit = true;
      createExplosion(aim.x, aim.y, getRingColor(points));
    } else {
      setMisses(prev => prev + 1);
      hit = false;
      createExplosion(aim.x, aim.y, '#ff6b6b');
    }

    setShots(prev => [...prev, { x: aim.x, y: aim.y, points, hit, dist }]);
    setAttempts(prev => prev + 1);

    isAnimatingRef.current = true;
    showResultTimerRef.current = 40;

    if (attempts + 1 >= MAX_ATTEMPTS) {
      setTimeout(() => {
        setGameOver(true);
      }, 500);
    }
  };

  // ============================================================
  // حلقه بازی
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const target = targetRef.current;
    const aim = aimRef.current;

    function updateParticles() {
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
        p.size *= 0.97;
        if (p.life <= 0 || p.size < 0.3) {
          particlesRef.current.splice(i, 1);
        }
      }
    }

    function gameLoop() {
      frameRef.current++;

      // حرکت سیبل با سرعت ثابت
      if (!gameOver && !isAnimatingRef.current) {
        target.x += target.dx;
        target.y += target.dy;

        // برخورد با دیوارها - فقط جهت عوض میشه، سرعت ثابت میمونه
        if (target.x - target.radius < 0 || target.x + target.radius > W) {
          target.dx *= -1;
          target.x = Math.max(target.radius, Math.min(W - target.radius, target.x));
        }
        if (target.y - target.radius < 0 || target.y + target.radius > H) {
          target.dy *= -1;
          target.y = Math.max(target.radius, Math.min(H - target.radius, target.y));
        }

        // گاهی جهت رو کمی تغییر بده (اما سرعت ثابت)
        if (Math.random() < 0.005) {
          const angle = (Math.random() - 0.5) * 0.5;
          const currentSpeed = Math.sqrt(target.dx * target.dx + target.dy * target.dy);
          target.dx = Math.cos(Math.atan2(target.dy, target.dx) + angle) * currentSpeed;
          target.dy = Math.sin(Math.atan2(target.dy, target.dx) + angle) * currentSpeed;
        }
      }

      updateParticles();

      if (isAnimatingRef.current) {
        showResultTimerRef.current--;
        if (showResultTimerRef.current <= 0) {
          isAnimatingRef.current = false;
        }
      }

      // ===== رسم =====
      const c = ctx!;

      c.clearRect(0, 0, W, H);

      // پس‌زمینه
      const bgGrad = c.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 350);
      bgGrad.addColorStop(0, '#1a1a4e');
      bgGrad.addColorStop(0.5, '#14143a');
      bgGrad.addColorStop(1, '#0a0a1a');
      c.fillStyle = bgGrad;
      c.fillRect(0, 0, W, H);

      // ستاره‌ها
      c.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 80; i++) {
        const sx = (i * 37 + 13) % W;
        const sy = (i * 53 + 7) % H;
        const size = (i % 3) + 0.5;
        c.beginPath();
        c.arc(sx, sy, size, 0, Math.PI * 2);
        c.fill();
      }

      // نشانه‌گیری
      c.strokeStyle = 'rgba(255,255,255,0.08)';
      c.lineWidth = 1;
      c.setLineDash([5, 10]);
      c.beginPath();
      c.moveTo(aim.x - 30, aim.y);
      c.lineTo(aim.x + 30, aim.y);
      c.moveTo(aim.x, aim.y - 30);
      c.lineTo(aim.x, aim.y + 30);
      c.stroke();
      c.setLineDash([]);

      c.fillStyle = 'rgba(255,255,255,0.1)';
      c.beginPath();
      c.arc(aim.x, aim.y, 4, 0, Math.PI * 2);
      c.fill();

      // سیبل
      c.shadowColor = 'rgba(255,215,0,0.15)';
      c.shadowBlur = 30;

      const cx = target.x;
      const cy = target.y;
      const r = target.radius;

      const rings = [
        { outer: 1.0, inner: 0.85, label: 4, color: '#95A5A6' },
        { outer: 0.85, inner: 0.75, label: 6, color: '#1ABC9C' },
        { outer: 0.75, inner: 0.65, label: 8, color: '#E67E22' },
        { outer: 0.65, inner: 0.55, label: 10, color: '#F1C40F' },
        { outer: 0.55, inner: 0.45, label: 12, color: '#2ECC71' },
        { outer: 0.45, inner: 0.35, label: 14, color: '#3498DB' },
        { outer: 0.35, inner: 0.25, label: 16, color: '#9B59B6' },
        { outer: 0.25, inner: 0.15, label: 18, color: '#FF69B4' },
        { outer: 0.15, inner: 0.06, label: 20, color: '#FF4444' },
      ];

      for (const ring of rings) {
        c.beginPath();
        c.arc(cx, cy, r * ring.outer, 0, Math.PI * 2);
        c.arc(cx, cy, r * ring.inner, 0, Math.PI * 2, true);
        c.closePath();
        c.fillStyle = ring.color;
        c.fill();
        c.strokeStyle = 'rgba(255,255,255,0.05)';
        c.lineWidth = 1;
        c.stroke();
      }

      c.shadowColor = 'rgba(255,215,0,0.5)';
      c.shadowBlur = 20;
      c.fillStyle = '#FFD700';
      c.beginPath();
      c.arc(cx, cy, r * 0.06, 0, Math.PI * 2);
      c.fill();

      c.shadowBlur = 10;
      c.fillStyle = '#FF6B00';
      c.beginPath();
      c.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
      c.fill();

      c.shadowBlur = 0;
      c.fillStyle = '#FF6B00';
      c.font = 'bold 10px Tahoma';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('25', cx, cy - r * 0.11);

      c.fillStyle = 'rgba(255,255,255,0.15)';
      c.font = 'bold 10px Tahoma';
      const labelRadius = r * 0.92;
      const labels = [4, 6, 8, 10, 12, 14, 16, 18, 20];
      for (let i = 0; i < labels.length; i++) {
        const angle = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        const lx = cx + Math.cos(angle) * labelRadius;
        const ly = cy + Math.sin(angle) * labelRadius;
        const alpha = 0.08 + (i / labels.length) * 0.07;
        c.fillStyle = `rgba(255,255,255,${alpha})`;
        c.fillText(String(labels[i]), lx, ly);
      }

      c.shadowBlur = 0;

      // نمایش تیرهای قبلی
      for (const shot of shots) {
        const isHit = shot.hit;
        const pointsNum = typeof shot.points === 'number' ? shot.points : 0;
        const color = isHit ? getRingColor(pointsNum) : '#ff6b6b';
        const size = isHit ? 6 : 8;

        c.fillStyle = color;
        c.shadowColor = color;
        c.shadowBlur = 10;
        c.beginPath();
        c.arc(shot.x, shot.y, size, 0, Math.PI * 2);
        c.fill();

        if (isHit && pointsNum > 0) {
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,0.6)';
          c.font = 'bold 10px Tahoma';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText(String(pointsNum), shot.x, shot.y - 18);
        } else {
          c.shadowBlur = 0;
          c.fillStyle = 'rgba(255,255,255,0.4)';
          c.font = 'bold 14px Tahoma';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('✗', shot.x, shot.y - 18);
        }
        c.shadowBlur = 0;
      }

      // ذرات
      for (const p of particlesRef.current) {
        c.globalAlpha = p.life / p.maxLife;
        c.fillStyle = p.color;
        c.beginPath();
        c.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;

      // اطلاعات روی صفحه
      c.fillStyle = 'rgba(0,0,0,0.3)';
      c.beginPath();
      c.roundRect(10, 8, 180, 22, 10);
      c.fill();

      c.fillStyle = 'rgba(255,255,255,0.3)';
      c.font = '11px Tahoma';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      c.fillText(`🎯 ${score} | 🔫 ${attempts}/${MAX_ATTEMPTS}`, 18, 19);

      // Game Over
      if (gameOver) {
        c.fillStyle = 'rgba(0,0,0,0.75)';
        c.fillRect(0, 0, W, H);

        c.textAlign = 'center';
        c.textBaseline = 'middle';

        c.fillStyle = '#FFD700';
        c.font = 'bold 48px Tahoma';
        c.shadowColor = '#FFD700';
        c.shadowBlur = 40;
        c.fillText('🎯 بازی تمام شد!', W / 2, H / 2 - 70);
        c.shadowBlur = 0;

        c.fillStyle = 'white';
        c.font = '28px Tahoma';
        c.fillText(`امتیاز نهایی: ${score}`, W / 2, H / 2);

        c.fillStyle = '#88ddff';
        c.font = '18px Tahoma';
        c.fillText(`🎯 اصابت: ${hits} | ❌ خطا: ${misses}`, W / 2, H / 2 + 50);

        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.font = '14px Tahoma';
        let shotDetails = shots.map((s, i) => {
          return s.hit ? `تیر ${i+1}: ${s.points} امتیاز` : `تیر ${i+1}: خطا`;
        }).join(' | ');
        c.fillText(shotDetails, W / 2, H / 2 + 90);

        c.fillStyle = '#aaa';
        c.font = '16px Tahoma';
        c.fillText('🔄 R یا دکمه جدید برای شروع مجدد', W / 2, H / 2 + 140);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }

    // اضافه کردن roundRect
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
  }, [gameOver, attempts, hits, misses, score, shots]);

  // ============================================================
  // رویدادها
  // ============================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      aimRef.current.x = Math.max(0, Math.min(W, (e.clientX - rect.left) * scaleX));
      aimRef.current.y = Math.max(0, Math.min(H, (e.clientY - rect.top) * scaleY));
    };

    const handleClick = () => {
      if (!gameOver) shoot();
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      aimRef.current.x = Math.max(0, Math.min(W, (touch.clientX - rect.left) * scaleX));
      aimRef.current.y = Math.max(0, Math.min(H, (touch.clientY - rect.top) * scaleY));
      if (!gameOver) shoot();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      aimRef.current.x = Math.max(0, Math.min(W, (touch.clientX - rect.left) * scaleX));
      aimRef.current.y = Math.max(0, Math.min(H, (touch.clientY - rect.top) * scaleY));
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, [gameOver, shoot]);

  // ============================================================
  // کنترل‌های کیبورد
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Space') {
        e.preventDefault();
        if (!gameOver) shoot();
      }
      if (e.key === 'r' || e.key === 'R') {
        window.location.reload();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameOver, shoot]);

  // ============================================================
  // ریست
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
      <div className="bg-[#1a1a2e]/80 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl max-w-[700px] w-full">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎯</span>
            <h2 className="text-xl font-bold text-white">تیراندازی به سیبل</h2>
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
          width={650}
          height={500}
          className="w-full h-auto rounded-2xl border-2 border-blue-500/30"
        />

        <div className="text-center text-gray-400 text-xs mt-3">
          <span>🎯 Space یا کلیک برای شلیک</span>
          <span className="mx-2">|</span>
          <span>🔄 R ← ریست</span>
          <span className="mx-2">|</span>
          <span>🎯 ۳ تا فرصت داری!</span>
        </div>
      </div>
    </div>
  );
}