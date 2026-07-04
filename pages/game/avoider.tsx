// app/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';

export default function AvoiderGame() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // --- State Management ---
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [bestScore, setBestScore] = useState(0);
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [time, setTime] = useState(0);
  const [starsCollected, setStarsCollected] = useState(0);
  const [combo, setCombo] = useState(0);

  // --- Constants (افزایش ۱.۵ برابری سرعت) ---
  const W = 800;
  const H = 600;
  const PLAYER_SIZE = 20;
  const ENEMY_SIZE = 18;
  const STAR_SIZE = 10;
  const PLAYER_SPEED = 9.75; // 6.5 * 1.5
  const BASE_ENEMY_SPEED = 4.8; // 3.2 * 1.5
  const SCROLL_SPEED = 3.3; // 2.2 * 1.5

  // --- Refs for Game Objects ---
  const playerRef = useRef({ x: W / 2, y: H / 2 });
  const enemiesRef = useRef<Array<{ x: number; y: number; dx: number; dy: number; type: 'normal' | 'fast' | 'big' }>>([]);
  const starsRef = useRef<Array<{ x: number; y: number; collected: boolean }>>([]);
  const powerupsRef = useRef<Array<{ x: number; y: number; type: 'extraLife' | 'shield' }>>([]);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; life: number; color: string; size: number }>>([]);
  
  const keysRef = useRef({ up: false, down: false, left: false, right: false });
  const mouseRef = useRef({ x: W / 2, y: H / 2, active: false });
  const gameLoopRef = useRef<number>();
  const frameRef = useRef(0);
  const spawnTimerRef = useRef(0);
  const starSpawnTimerRef = useRef(0);
  const gameTimeRef = useRef(0);
  const isInvincibleRef = useRef(false);
  const invincibleTimerRef = useRef(0);

  // --- Load Best Score from localStorage ---
  useEffect(() => {
    const saved = localStorage.getItem('avoiderBestScore');
    if (saved) {
      setBestScore(parseInt(saved, 10));
    }
  }, []);

  // --- Utility Functions ---
  const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;
  const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x1 - x2, y1 - y2);

  // --- Particle System ---
  const createExplosion = (x: number, y: number, color: string, count: number = 20) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(1, 6);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30 + Math.random() * 20,
        color: color,
        size: randomBetween(2, 6),
      });
    }
  };

  const createStarBurst = (x: number, y: number) => {
    const colors = ['#FFD700', '#FFA500', '#FF6B00', '#FFE44D'];
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = randomBetween(2, 8);
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 20 + Math.random() * 20,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: randomBetween(2, 5),
      });
    }
  };

  // --- Reset Game ---
  const resetGame = () => {
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameState('playing');
    setTime(0);
    setStarsCollected(0);
    setCombo(0);
    playerRef.current = { x: W / 2, y: H / 2 };
    enemiesRef.current = [];
    starsRef.current = [];
    powerupsRef.current = [];
    particlesRef.current = [];
    spawnTimerRef.current = 0;
    starSpawnTimerRef.current = 0;
    gameTimeRef.current = 0;
    frameRef.current = 0;
    isInvincibleRef.current = false;
    invincibleTimerRef.current = 0;
    mouseRef.current.active = false;
  };

  // --- Spawn Functions (افزایش ۱.۵ برابری تعداد موانع) ---
  const spawnEnemy = () => {
    const types: ('normal' | 'fast' | 'big')[] = ['normal', 'normal', 'normal', 'fast', 'big'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let size = ENEMY_SIZE;
    let speed = BASE_ENEMY_SPEED + level * 0.8;
    let color = '#ff3333';
    
    if (type === 'fast') {
      size = ENEMY_SIZE * 0.7;
      speed = (BASE_ENEMY_SPEED + level * 0.75) * 1.9;
      color = '#ff6bff';
    } else if (type === 'big') {
      size = ENEMY_SIZE * 1.6;
      speed = (BASE_ENEMY_SPEED + level * 0.45) * 0.8;
      color = '#ff4444';
    }

    const side = Math.floor(Math.random() * 4);
    let x, y;
    const pad = 30;
    switch (side) {
      case 0: x = randomBetween(pad, W - pad); y = -pad; break;
      case 1: x = W + pad; y = randomBetween(pad, H - pad); break;
      case 2: x = randomBetween(pad, W - pad); y = H + pad; break;
      case 3: x = -pad; y = randomBetween(pad, H - pad); break;
      default: x = randomBetween(0, W); y = randomBetween(0, H);
    }
    
    const angle = Math.atan2(H / 2 - y, W / 2 - x);
    enemiesRef.current.push({
      x,
      y,
      dx: Math.cos(angle) * speed + randomBetween(-0.5, 0.5),
      dy: Math.sin(angle) * speed + randomBetween(-0.5, 0.5),
      type,
    });
    
    // ۵۰٪ شانس اسپاون یک دشمن اضافی (برای افزایش ۱.۵ برابری)
    if (Math.random() < 0.5) {
      const offsetX = randomBetween(-50, 50);
      const offsetY = randomBetween(-50, 50);
      const angle2 = Math.atan2(H / 2 - (y + offsetY), W / 2 - (x + offsetX));
      enemiesRef.current.push({
        x: x + offsetX,
        y: y + offsetY,
        dx: Math.cos(angle2) * speed * 0.9 + randomBetween(-0.5, 0.5),
        dy: Math.sin(angle2) * speed * 0.9 + randomBetween(-0.5, 0.5),
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  };

  const spawnStars = () => {
    if (starsRef.current.length < 15) {
      const x = randomBetween(50, W - 50);
      const y = randomBetween(50, H - 50);
      starsRef.current.push({ x, y, collected: false });
    }
  };

  const spawnPowerup = () => {
    if (powerupsRef.current.length < 2 && Math.random() < 0.02) {
      const type = Math.random() < 0.6 ? 'extraLife' : 'shield';
      powerupsRef.current.push({
        x: randomBetween(50, W - 50),
        y: randomBetween(50, H - 50),
        type,
      });
    }
  };

  // --- Collision Detection ---
  const checkCollisions = () => {
    const player = playerRef.current;
    const enemies = enemiesRef.current;
    
    if (isInvincibleRef.current) return false;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      const size = enemy.type === 'big' ? ENEMY_SIZE * 1.6 : enemy.type === 'fast' ? ENEMY_SIZE * 0.7 : ENEMY_SIZE;
      if (distance(player.x, player.y, enemy.x, enemy.y) < PLAYER_SIZE / 2 + size / 2) {
        createExplosion(player.x, player.y, '#ff3333', 30);
        return true;
      }
    }
    return false;
  };

  // --- Collect Stars ---
  const collectStars = () => {
    const player = playerRef.current;
    let collected = 0;
    
    for (const star of starsRef.current) {
      if (!star.collected && distance(player.x, player.y, star.x, star.y) < PLAYER_SIZE / 2 + STAR_SIZE / 2) {
        star.collected = true;
        collected++;
        const points = 10 + combo * 2;
        setScore(prev => prev + points);
        setStarsCollected(prev => prev + 1);
        setCombo(prev => prev + 1);
        createStarBurst(star.x, star.y);
        
        // Check for extra life
        if (starsCollected % 10 === 9) {
          setLives(prev => Math.min(prev + 1, 5));
          createExplosion(player.x, player.y, '#00ff00', 40);
        }
      }
    }
    return collected;
  };

  // --- Collect Powerups ---
  const collectPowerups = () => {
    const player = playerRef.current;
    for (let i = powerupsRef.current.length - 1; i >= 0; i--) {
      const powerup = powerupsRef.current[i];
      if (distance(player.x, player.y, powerup.x, powerup.y) < PLAYER_SIZE / 2 + 12) {
        if (powerup.type === 'extraLife') {
          setLives(prev => Math.min(prev + 1, 5));
          createExplosion(powerup.x, powerup.y, '#00ff00', 30);
        } else if (powerup.type === 'shield') {
          isInvincibleRef.current = true;
          invincibleTimerRef.current = 180; // 3 seconds at 60fps
          createExplosion(powerup.x, powerup.y, '#00ccff', 30);
        }
        powerupsRef.current.splice(i, 1);
      }
    }
  };

  // --- Game Loop ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Add roundRect if not available
    if (!CanvasRenderingContext2D.prototype.roundRect) {
      CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, r) {
        const radius = Number(r) || 0;
        if (radius > w/2) r = w/2;
        if (radius > h/2) r = h/2;
        this.moveTo(x + radius, y);
        this.lineTo(x + w - radius, y);
        this.quadraticCurveTo(x + w, y, x + w, y + radius);
        this.lineTo(x + w, y + h - radius);
        this.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
        this.lineTo(x + radius, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
        this.closePath();
        return this;
      };
    }

    const gameLoop = () => {
      frameRef.current++;
      gameTimeRef.current += 1/60;

      // --- Update ---
      if (gameState === 'playing') {
        const player = playerRef.current;

        // Player movement with keyboard
        let dx = 0, dy = 0;
        if (keysRef.current.up) dy = -PLAYER_SPEED;
        if (keysRef.current.down) dy = PLAYER_SPEED;
        if (keysRef.current.left) dx = -PLAYER_SPEED;
        if (keysRef.current.right) dx = PLAYER_SPEED;
        
        // Mouse control
        if (mouseRef.current.active) {
          const targetX = mouseRef.current.x;
          const targetY = mouseRef.current.y;
          const dist = distance(player.x, player.y, targetX, targetY);
          if (dist > 5) {
            const speed = Math.min(PLAYER_SPEED * 1.2, dist);
            dx = (targetX - player.x) / dist * speed;
            dy = (targetY - player.y) / dist * speed;
          }
        }

        // Apply movement with diagonal normalization
        if (dx && dy) {
          dx *= 0.707;
          dy *= 0.707;
        }
        player.x = Math.max(PLAYER_SIZE/2, Math.min(W - PLAYER_SIZE/2, player.x + dx));
        player.y = Math.max(PLAYER_SIZE/2, Math.min(H - PLAYER_SIZE/2, player.y + dy));

        // Scroll effect - move everything down faster
        const scrollOffset = SCROLL_SPEED;
        for (const enemy of enemiesRef.current) {
          enemy.y += scrollOffset;
        }
        for (const star of starsRef.current) {
          star.y += scrollOffset * 0.6;
        }
        for (const powerup of powerupsRef.current) {
          powerup.y += scrollOffset * 0.8;
        }

        // Update invincibility
        if (isInvincibleRef.current) {
          invincibleTimerRef.current--;
          if (invincibleTimerRef.current <= 0) {
            isInvincibleRef.current = false;
          }
        }

        // Spawning (افزایش ۱.۵ برابری موانع)
        const spawnRate = Math.max(4, 20 - level * 1.2);
        if (frameRef.current % Math.floor(spawnRate) === 0) {
          // همیشه ۲ دشمن اسپاون کن
          for (let i = 0; i < 2; i++) {
            spawnEnemy();
          }
          // ۳۰٪ شانس اسپاون ۳ دشمن
          if (Math.random() < 0.3 && level > 2) {
            spawnEnemy();
          }
          // ۲۰٪ شانس اسپاون ۴ دشمن در سطوح بالاتر
          if (Math.random() < 0.2 && level > 4) {
            spawnEnemy();
          }
        }

        if (frameRef.current % 20 === 0) {
          spawnStars();
        }

        if (frameRef.current % 40 === 0) {
          spawnPowerup();
        }

        // Enemy movement (افزایش سرعت دشمنان با ۱.۵ برابر)
        for (const enemy of enemiesRef.current) {
          enemy.x += enemy.dx;
          enemy.y += enemy.dy;
          
          // Add more wobble for unpredictability
          enemy.dx += randomBetween(-0.04, 0.04);
          enemy.dy += randomBetween(-0.04, 0.04);
          
          // Speed limit with increased max speed (۱.۵ برابر)
          let maxSpeed = BASE_ENEMY_SPEED + level * 0.6;
          if (enemy.type === 'fast') maxSpeed = (BASE_ENEMY_SPEED + level * 0.75) * 1.9;
          if (enemy.type === 'big') maxSpeed = (BASE_ENEMY_SPEED + level * 0.45) * 0.8;
          
          const currentSpeed = Math.hypot(enemy.dx, enemy.dy);
          if (currentSpeed > maxSpeed) {
            enemy.dx = (enemy.dx / currentSpeed) * maxSpeed;
            enemy.dy = (enemy.dy / currentSpeed) * maxSpeed;
          }
        }

        // Remove off-screen objects
        enemiesRef.current = enemiesRef.current.filter(e => 
          e.x > -100 && e.x < W + 100 && e.y > -100 && e.y < H + 100
        );
        starsRef.current = starsRef.current.filter(s => 
          !s.collected && s.y < H + 50
        );
        powerupsRef.current = powerupsRef.current.filter(p => 
          p.y < H + 50
        );

        // Collect stars and powerups
        collectStars();
        collectPowerups();

        // Collision detection
        if (checkCollisions()) {
          setLives(prev => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameState('gameOver');
              if (score > bestScore) {
                setBestScore(score);
                localStorage.setItem('avoiderBestScore', String(score));
              }
              return 0;
            }
            // Reset position and clear enemies on hit
            playerRef.current = { x: W / 2, y: H / 2 };
            enemiesRef.current = [];
            isInvincibleRef.current = true;
            invincibleTimerRef.current = 90; // 1.5 seconds invincibility
            return newLives;
          });
          setCombo(0);
        }

        // Update level - faster leveling
        const newLevel = Math.floor(score / 30) + 1;
        if (newLevel !== level) {
          setLevel(newLevel);
          createExplosion(W/2, H/2, '#ffd700', 50);
        }

        // Update time
        setTime(prev => prev + 1);

        // Update particles
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

      // --- Draw ---
      ctx.clearRect(0, 0, W, H);

      // Background - scrolling starfield (افزایش سرعت)
      const gradient = ctx.createLinearGradient(0, 0, 0, H);
      gradient.addColorStop(0, '#0a0a1a');
      gradient.addColorStop(0.5, '#0f1a2e');
      gradient.addColorStop(1, '#1a0a2e');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);

      // Stars background (scrolling faster)
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 100; i++) {
        const seed = i * 137.508;
        const x = ((seed + frameRef.current * 0.2) % W);
        const y = ((seed * 3.7 + frameRef.current * 0.12) % H);
        const size = (i % 3) + 0.5;
        ctx.globalAlpha = 0.2 + (i % 5) * 0.1;
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;

      // Grid lines for retro feel
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      for (let i = 0; i < W; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, H);
        ctx.stroke();
      }
      for (let i = 0; i < H; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(W, i);
        ctx.stroke();
      }

      // --- Draw Powerups ---
      for (const powerup of powerupsRef.current) {
        const glow = ctx.createRadialGradient(powerup.x, powerup.y, 2, powerup.x, powerup.y, 20);
        glow.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
        glow.addColorStop(1, 'rgba(0, 255, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(powerup.x, powerup.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = powerup.type === 'extraLife' ? '#00ff00' : '#00ccff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = powerup.type === 'extraLife' ? '#00ff00' : '#00ccff';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerup.type === 'extraLife' ? '❤️' : '🛡️', powerup.x, powerup.y);
        ctx.shadowBlur = 0;
      }

      // --- Draw Stars ---
      for (const star of starsRef.current) {
        if (!star.collected) {
          const pulse = Math.sin(frameRef.current * 0.1 + star.x) * 0.3 + 0.7;
          const glow = ctx.createRadialGradient(star.x, star.y, 2, star.x, star.y, STAR_SIZE * 1.5);
          glow.addColorStop(0, `rgba(255, 215, 0, ${0.3 * pulse})`);
          glow.addColorStop(1, 'rgba(255, 215, 0, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, STAR_SIZE * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10 * pulse;
          ctx.fillStyle = '#FFD700';
          ctx.font = `${STAR_SIZE * 1.8}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', star.x, star.y);
          ctx.shadowBlur = 0;
        }
      }

      // --- Draw Enemies ---
      for (const enemy of enemiesRef.current) {
        const size = enemy.type === 'big' ? ENEMY_SIZE * 1.6 : enemy.type === 'fast' ? ENEMY_SIZE * 0.7 : ENEMY_SIZE;
        let color = '#ff3333';
        let glowColor = 'rgba(255, 50, 50, 0.2)';
        let innerColor = '#ff6666';
        
        if (enemy.type === 'fast') {
          color = '#ff6bff';
          glowColor = 'rgba(255, 107, 255, 0.2)';
          innerColor = '#ff99ff';
        } else if (enemy.type === 'big') {
          color = '#ff4444';
          glowColor = 'rgba(255, 68, 68, 0.3)';
          innerColor = '#ff8888';
        }

        const glow = ctx.createRadialGradient(enemy.x, enemy.y, 2, enemy.x, enemy.y, size * 1.2);
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, size * 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(enemy.x - size/2, enemy.y - size/2, size, size, 3);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.fillStyle = innerColor;
        ctx.beginPath();
        ctx.roundRect(enemy.x - size/4, enemy.y - size/4, size/2, size/2, 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = 'white';
        ctx.fillRect(enemy.x - size/3 - 2, enemy.y - size/4 - 2, 3, 3);
        ctx.fillRect(enemy.x + size/3 - 2, enemy.y - size/4 - 2, 3, 3);
        ctx.fillStyle = 'black';
        ctx.fillRect(enemy.x - size/3 - 1, enemy.y - size/4 - 1, 2, 2);
        ctx.fillRect(enemy.x + size/3 - 1, enemy.y - size/4 - 1, 2, 2);
      }

      // --- Draw Player ---
      const player = playerRef.current;
      const isInvincible = isInvincibleRef.current && Math.floor(frameRef.current / 6) % 2 === 0;

      if (!isInvincible) {
        // Player glow
        const playerGlow = ctx.createRadialGradient(player.x, player.y, 2, player.x, player.y, PLAYER_SIZE * 1.5);
        playerGlow.addColorStop(0, 'rgba(50, 200, 255, 0.2)');
        playerGlow.addColorStop(1, 'rgba(50, 200, 255, 0)');
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(player.x, player.y, PLAYER_SIZE * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Player body
        ctx.shadowColor = '#33ccff';
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#33ccff';
        ctx.beginPath();
        ctx.roundRect(player.x - PLAYER_SIZE/2, player.y - PLAYER_SIZE/2, PLAYER_SIZE, PLAYER_SIZE, 4);
        ctx.fill();

        // Player details
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#88eeff';
        ctx.beginPath();
        ctx.roundRect(player.x - 6, player.y - 3, 12, 6, 2);
        ctx.fill();
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(player.x - 4, player.y - 1, 2, 2);
        ctx.fillRect(player.x + 2, player.y - 1, 2, 2);

        // Ship trail
        ctx.fillStyle = 'rgba(51, 204, 255, 0.15)';
        for (let i = 1; i <= 4; i++) {
          const trailX = player.x - (keysRef.current.left ? 1 : keysRef.current.right ? -1 : 0) * i * 2;
          const trailY = player.y - (keysRef.current.up ? 1 : keysRef.current.down ? -1 : 0) * i * 2;
          ctx.beginPath();
          ctx.roundRect(
            trailX - PLAYER_SIZE/2 + i * 1.5,
            trailY - PLAYER_SIZE/2 + i * 1.5,
            PLAYER_SIZE - i * 3,
            PLAYER_SIZE - i * 3,
            2
          );
          ctx.fill();
        }
      }

      // --- Draw Particles ---
      for (const p of particlesRef.current) {
        ctx.globalAlpha = p.life / 40;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // --- HUD ---
      // Top bar
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(10, 10, 400, 35, 10);
      ctx.fill();

      ctx.font = 'bold 16px "Courier New", monospace';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`امتیاز: ${score}`, 20, 28);
      ctx.fillStyle = '#ff6666';
      ctx.fillText(`❤️`.repeat(lives), 150, 28);
      ctx.fillStyle = '#ffd700';
      ctx.fillText(`مرحله: ${level}`, 230, 28);
      ctx.fillStyle = '#88ddff';
      ctx.fillText(`⭐ ${starsCollected}`, 310, 28);

      // Right HUD
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.beginPath();
      ctx.roundRect(W - 140, 10, 130, 35, 10);
      ctx.fill();
      ctx.fillStyle = '#88ddff';
      ctx.textAlign = 'right';
      ctx.fillText(`⏱️ ${String(Math.floor(time / 60)).padStart(2, '0')}:${String(time % 60).padStart(2, '0')}`, W - 15, 28);

      // Best score
      if (bestScore > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(W - 140, 50, 130, 25, 8);
        ctx.fill();
        ctx.fillStyle = '#ffd700';
        ctx.textAlign = 'right';
        ctx.font = '12px "Courier New", monospace';
        ctx.fillText(`🏆 بهترین: ${bestScore}`, W - 15, 64);
      }

      // Combo display
      if (combo > 2) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.roundRect(W/2 - 60, 50, 120, 30, 8);
        ctx.fill();
        ctx.fillStyle = '#ff6bff';
        ctx.textAlign = 'center';
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillText(`🔥 ${combo}x`, W/2, 68);
      }

      // --- Game Over Overlay ---
      if (gameState === 'gameOver') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, W, H);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#ff3333';
        ctx.shadowBlur = 30;
        ctx.fillStyle = '#ff3333';
        ctx.font = 'bold 56px "Courier New", monospace';
        ctx.fillText('بازی تمام شد!', W/2, H/2 - 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = '28px "Courier New", monospace';
        ctx.fillText(`امتیاز نهایی: ${score}`, W/2, H/2 - 20);

        ctx.fillStyle = '#ffd700';
        ctx.font = '20px "Courier New", monospace';
        ctx.fillText(`⭐ ستاره‌ها: ${starsCollected}`, W/2, H/2 + 30);
        
        if (score >= bestScore && score > 0) {
          ctx.fillStyle = '#ff6bff';
          ctx.font = 'bold 22px "Courier New", monospace';
          ctx.fillText('🎉 رکورد جدید! 🎉', W/2, H/2 + 80);
        }

        ctx.fillStyle = '#88ddff';
        ctx.font = '18px "Courier New", monospace';
        ctx.fillText('برای شروع مجدد کلید R را بزنید', W/2, H/2 + 130);
        ctx.fillText('برای خروج کلیک کنید', W/2, H/2 + 165);
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, score, lives, level, bestScore, starsCollected, combo]);

  // --- Keyboard Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'ArrowUp' || key === 'w') { e.preventDefault(); keysRef.current.up = true; }
      if (key === 'ArrowDown' || key === 's') { e.preventDefault(); keysRef.current.down = true; }
      if (key === 'ArrowLeft' || key === 'a') { e.preventDefault(); keysRef.current.left = true; }
      if (key === 'ArrowRight' || key === 'd') { e.preventDefault(); keysRef.current.right = true; }
      if (key === 'r' || key === 'R') { resetGame(); }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key;
      if (key === 'ArrowUp' || key === 'w') { e.preventDefault(); keysRef.current.up = false; }
      if (key === 'ArrowDown' || key === 's') { e.preventDefault(); keysRef.current.down = false; }
      if (key === 'ArrowLeft' || key === 'a') { e.preventDefault(); keysRef.current.left = false; }
      if (key === 'ArrowRight' || key === 'd') { e.preventDefault(); keysRef.current.right = false; }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // --- Mouse Controls ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current.x = Math.max(0, Math.min(W, (e.clientX - rect.left) * scaleX));
      mouseRef.current.y = Math.max(0, Math.min(H, (e.clientY - rect.top) * scaleY));
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // --- Touch Controls ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      mouseRef.current.x = Math.max(0, Math.min(W, (touch.clientX - rect.left) * scaleX));
      mouseRef.current.y = Math.max(0, Math.min(H, (touch.clientY - rect.top) * scaleY));
      mouseRef.current.active = true;
    };

    const handleTouchStart = (e: TouchEvent) => {
      e.preventDefault();
      handleTouchMove(e);
    };

    const handleTouchEnd = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      canvas.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  // --- Navigation ---
  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a1a] via-[#1a0a2e] to-[#0a0a1a] flex items-center justify-center p-4 font-mono">
      <div className="bg-[#1a1a2e]/80 backdrop-blur-lg rounded-3xl p-4 md:p-6 border border-white/5 shadow-2xl max-w-[850px] w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <h2 className="text-xl font-bold text-white tracking-wider">بازی فرار</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={resetGame}
              className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition uppercase tracking-wider"
            >
              🔄 ریست
            </button>
            <button
              onClick={goHome}
              className="px-3 py-1.5 bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg text-xs hover:bg-blue-500/30 transition uppercase tracking-wider"
            >
              🏠 خونه
            </button>
          </div>
        </div>

        {/* Game Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-auto rounded-2xl border-2 border-blue-500/30"
        />

        {/* Controls Info */}
        <div className="text-center text-gray-400 text-xs mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 rtl">
          <span>⬆️⬇️⬅️➡️ یا WASD</span>
          <span>|</span>
          <span>🖱️ ماوس برای حرکت</span>
          <span>|</span>
          <span>🔄 R برای ریست</span>
          <span>|</span>
          <span>⭐ جمع‌آوری ستاره‌ها</span>
          <span>|</span>
          <span>❤️ هر ۱۰ ستاره یک جان</span>
        </div>
      </div>
    </div>
  );
}