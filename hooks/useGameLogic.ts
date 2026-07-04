import { useState, useEffect, useCallback } from 'react';
import { Obstacle, Powerup, Particle, GameState } from '@/types/game';
import {
  formatTime, randomColor, collide, CANVAS_W, CANVAS_H,
  CAR_W, CAR_H, ROAD_W, ROAD_L, CAR_Y, MAX_LIVES, MAX_FUEL
} from '@/utils/helpers';

export function useGameLogic(gameType: string = 'racing') {
  const storageKey = `carBestAdvanced_${gameType}`;
  
  const [gameState, setGameState] = useState<GameState>({
    carX: CANVAS_W / 2 - CAR_W / 2,
    speed: 2.5,
    score: 0,
    level: 1,
    gameOver: false,
    gameOverReason: '',
    obstacles: [],
    powerups: [],
    particles: [],
    fuel: MAX_FUEL,
    lives: MAX_LIVES,
    combo: 0,
    comboDisplay: 0,
    shakeAmount: 0,
    leftPressed: false,
    rightPressed: false,
    startTime: Date.now(),
    elapsedTime: 0,
    bestTime: null,
  });

  const [bestTime, setBestTime] = useState<number | null>(null);

  // بارگذاری بهترین زمان از localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = parseFloat(saved);
        setBestTime(parsed);
        setGameState(prev => ({ ...prev, bestTime: parsed }));
      }
    }
  }, [storageKey]);

  // ایجاد مانع جدید
  const createObstacle = useCallback((): Obstacle => {
    const w = 26 + Math.random() * 28;
    const h = 26 + Math.random() * 28;
    const x = ROAD_L + 10 + Math.random() * (ROAD_W - w - 20);
    return {
      x, 
      y: -h - Math.random() * 200,
      w, 
      h,
      color: randomColor(),
      scored: false,
      moving: Math.random() < 0.2,
      moveDir: Math.random() < 0.5 ? 1 : -1,
      moveSpeed: 0.3 + Math.random() * 1,
      originalX: x
    };
  }, []);

  // ایجاد پاورآپ
  const createPowerup = useCallback((): Powerup => {
    const types = ['fuel', 'shield', 'score'] as const;
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 18;
    const x = ROAD_L + 20 + Math.random() * (ROAD_W - 40);
    return {
      x, 
      y: -size,
      w: size, 
      h: size,
      type,
      color: type === 'fuel' ? '#ffdd57' : type === 'shield' ? '#00ddff' : '#ff6bff'
    };
  }, []);

  // ایجاد ذرات
  const createParticles = useCallback((x: number, y: number, color: string, count = 20): Particle[] => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        x, 
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 25 + Math.random() * 25,
        maxLife: 50,
        size: 2 + Math.random() * 3,
        color
      });
    }
    return newParticles;
  }, []);

  // ریست بازی
  const resetGame = useCallback(() => {
    const initialObstacles: Obstacle[] = [];
    for (let i = 0; i < 3; i++) {
      const o = createObstacle();
      o.y = -50 - i * 220;
      initialObstacles.push(o);
    }

    setGameState({
      carX: CANVAS_W / 2 - CAR_W / 2,
      speed: 2.5,
      score: 0,
      level: 1,
      gameOver: false,
      gameOverReason: '',
      obstacles: initialObstacles,
      powerups: [],
      particles: [],
      fuel: MAX_FUEL,
      lives: MAX_LIVES,
      combo: 0,
      comboDisplay: 0,
      shakeAmount: 0,
      leftPressed: false,
      rightPressed: false,
      startTime: Date.now(),
      elapsedTime: 0,
      bestTime: bestTime,
    });
  }, [createObstacle, bestTime]);

  // به‌روزرسانی بازی
  const updateGame = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver) return prev;

      // ===== مصرف سوخت =====
      let newFuel = prev.fuel - (0.03 + prev.level * 0.01);
      if (newFuel < 0) {
        newFuel = 0;
        return {
          ...prev,
          fuel: 0,
          gameOver: true,
          gameOverReason: '⛽ بنزین تموم شد!',
          particles: [...prev.particles, ...createParticles(CANVAS_W / 2, CANVAS_H / 2, '#ff6b6b', 60)]
        };
      }

      // ===== افزایش سطح =====
      let newLevel = Math.floor(prev.score / 300) + 1;
      let newSpeed = prev.speed;
      if (newLevel !== prev.level) {
        newSpeed = 2.5 + (newLevel - 1) * 0.5;
        newFuel = Math.min(MAX_FUEL, newFuel + 25);
      }

      // ===== حرکت ماشین =====
      let newCarX = prev.carX;
      if (prev.leftPressed && newCarX > ROAD_L) newCarX -= 5;
      if (prev.rightPressed && newCarX + CAR_W < ROAD_L + ROAD_W) newCarX += 5;

      // ===== حرکت موانع =====
      const newObstacles = prev.obstacles.map(o => {
        let newY = o.y + newSpeed;
        let newX = o.x;
        if (o.moving) {
          newX += o.moveDir * o.moveSpeed;
          if (newX < ROAD_L + 5 || newX + o.w > ROAD_L + ROAD_W - 5) {
            o.moveDir *= -1;
          }
        }
        return { ...o, y: newY, x: newX };
      });

      // ===== حرکت پاورآپ‌ها =====
      const newPowerups = prev.powerups.map(p => ({ ...p, y: p.y + newSpeed }));

      // ===== افزایش امتیاز =====
      let newScore = prev.score + 1;

      // ===== برخورد =====
      const car = { x: newCarX, y: CAR_Y, w: CAR_W, h: CAR_H };
      let newLives = prev.lives;
      let newObstaclesAfterCollision = [...newObstacles];
      let newPowerupsAfterCollision = [...newPowerups];
      let newParticles = [...prev.particles];
      let newCombo = prev.combo;
      let newComboDisplay = prev.comboDisplay;
      let newShakeAmount = prev.shakeAmount;
      let newFuelAfterCollision = newFuel;
      let newScoreAfterCollision = newScore;

      // ===== بررسی برخورد با موانع =====
      for (let i = newObstaclesAfterCollision.length - 1; i >= 0; i--) {
        const o = newObstaclesAfterCollision[i];
        
        // امتیاز از موانع سبز (کامبو)
        if (o.color === '#7bed9f' && !o.scored) {
          if (car.y + car.h < o.y + 5) {
            o.scored = true;
            newCombo++;
            const bonus = (5 + prev.level * 2) * (1 + newCombo * 0.15);
            newScoreAfterCollision += bonus * 10;
            newParticles = [...newParticles, ...createParticles(o.x + o.w / 2, o.y, '#7bed9f', 12)];
            newComboDisplay = newCombo;
            newFuelAfterCollision = Math.min(MAX_FUEL, newFuelAfterCollision + 5);
          }
        }

        // برخورد با موانع غیرسبز
        if (o.color !== '#7bed9f' && collide(car, o)) {
          newLives--;
          newShakeAmount = 8;
          newParticles = [...newParticles, ...createParticles(newCarX + CAR_W / 2, CAR_Y + CAR_H / 2, '#ff4444', 25)];
          newObstaclesAfterCollision.splice(i, 1);
          newSpeed = Math.max(1.5, newSpeed - 0.3);

          // اگر جان‌ها تمام شد
          if (newLives <= 0) {
            const elapsed = Date.now() - prev.startTime;
            // ذخیره بهترین زمان
            if (!bestTime || elapsed < bestTime) {
              localStorage.setItem(storageKey, String(elapsed));
              setBestTime(elapsed);
            }
            return {
              ...prev,
              carX: newCarX,
              speed: newSpeed,
              score: Math.floor(newScoreAfterCollision / 10),
              level: newLevel,
              gameOver: true,
              gameOverReason: '💥 تصادف!',
              obstacles: newObstaclesAfterCollision,
              powerups: newPowerupsAfterCollision,
              particles: [...newParticles, ...createParticles(CANVAS_W / 2, CANVAS_H / 2, '#ff4444', 70)],
              fuel: newFuelAfterCollision,
              lives: newLives,
              combo: newCombo,
              comboDisplay: newComboDisplay,
              shakeAmount: newShakeAmount,
              elapsedTime: elapsed,
              bestTime: bestTime || elapsed,
            };
          }
        }
      }

      // ===== بررسی برخورد با پاورآپ‌ها =====
      for (let i = newPowerupsAfterCollision.length - 1; i >= 0; i--) {
        const p = newPowerupsAfterCollision[i];
        const pRect = { x: p.x, y: p.y, w: p.w, h: p.h };
        if (collide(car, pRect)) {
          if (p.type === 'fuel') {
            newFuelAfterCollision = Math.min(MAX_FUEL, newFuelAfterCollision + 35);
            newParticles = [...newParticles, ...createParticles(p.x + p.w / 2, p.y + p.h / 2, '#ffdd57', 15)];
          } else if (p.type === 'shield') {
            newParticles = [...newParticles, ...createParticles(p.x + p.w / 2, p.y + p.h / 2, '#00ddff', 25)];
          } else if (p.type === 'score') {
            newScoreAfterCollision += 400;
            newParticles = [...newParticles, ...createParticles(p.x + p.w / 2, p.y + p.h / 2, '#ff6bff', 25)];
          }
          newPowerupsAfterCollision.splice(i, 1);
        }
      }

      // ===== حذف اشیاء خارج از صفحه =====
      const filteredObstacles = newObstaclesAfterCollision.filter(o => o.y < CANVAS_H + 100);
      const filteredPowerups = newPowerupsAfterCollision.filter(p => p.y < CANVAS_H + 50);

      // ===== تولید موانع جدید =====
      const target = Math.min(5, 3 + Math.floor(newLevel / 1.5));
      let finalObstacles = [...filteredObstacles];
      
      if (finalObstacles.length < target) {
        const o = createObstacle();
        if (finalObstacles.length > 0) {
          const last = finalObstacles[finalObstacles.length - 1];
          o.y = last.y - 180 - Math.random() * 80;
        }
        finalObstacles.push(o);
      }

      // تولید تصادفی موانع
      if (Math.random() < 0.015 + newLevel * 0.002 && finalObstacles.length < 6) {
        finalObstacles.push(createObstacle());
      }

      // ===== تولید پاورآپ‌ها =====
      let finalPowerups = [...filteredPowerups];
      if (Math.random() < 0.006 + newLevel * 0.001 && finalPowerups.length < 3) {
        finalPowerups.push(createPowerup());
      }

      // ===== به‌روزرسانی ذرات =====
      const updatedParticles = newParticles
        .map(p => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.08,
          life: p.life - 1,
          size: p.size * 0.98
        }))
        .filter(p => p.life > 0 && p.size > 0.3);

      // ===== کاهش اثر شیک =====
      if (newShakeAmount > 0) newShakeAmount *= 0.9;
      if (newShakeAmount < 0.1) newShakeAmount = 0;

      // ===== زمان سپری شده =====
      const elapsed = Date.now() - prev.startTime;

      return {
        ...prev,
        carX: newCarX,
        speed: newSpeed,
        score: Math.floor(newScoreAfterCollision / 10),
        level: newLevel,
        obstacles: finalObstacles,
        powerups: finalPowerups,
        particles: updatedParticles,
        fuel: newFuelAfterCollision,
        lives: newLives,
        combo: newCombo,
        comboDisplay: newComboDisplay,
        shakeAmount: newShakeAmount,
        elapsedTime: elapsed,
        bestTime: bestTime || null,
      };
    });
  }, [createObstacle, createPowerup, createParticles, bestTime, storageKey]);

  return {
    gameState,
    resetGame,
    updateGame,
    setLeftPressed: (pressed: boolean) => {
      setGameState(prev => ({ ...prev, leftPressed: pressed }));
    },
    setRightPressed: (pressed: boolean) => {
      setGameState(prev => ({ ...prev, rightPressed: pressed }));
    },
  };
}