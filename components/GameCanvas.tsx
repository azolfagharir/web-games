'use client';

import { useEffect, useRef } from 'react';
import { GameState } from '@/types/game';
import {
  CANVAS_W, CANVAS_H, ROAD_W, ROAD_L, 
  CAR_W, CAR_H, CAR_Y, formatTime 
} from '@/utils/helpers';

interface GameCanvasProps {
  gameState: GameState;
}

export default function GameCanvas({ gameState }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const { 
        carX, obstacles, powerups, particles, level, 
        gameOver, gameOverReason, score, startTime, 
        bestTime, combo, shakeAmount 
      } = gameState;
      
      ctx.save();
      
      // Shake effect
      if (shakeAmount > 0.5) {
        const shakeX = (Math.random() - 0.5) * shakeAmount;
        const shakeY = (Math.random() - 0.5) * shakeAmount;
        ctx.translate(shakeX, shakeY);
      }
      
      ctx.clearRect(-10, -10, CANVAS_W + 20, CANVAS_H + 20);

      // Road
      const grad = ctx.createLinearGradient(ROAD_L, 0, ROAD_L + ROAD_W, 0);
      grad.addColorStop(0, '#2a2a44');
      grad.addColorStop(0.5, '#3a3a5a');
      grad.addColorStop(1, '#2a2a44');
      ctx.fillStyle = grad;
      ctx.fillRect(ROAD_L, 0, ROAD_W, CANVAS_H);

      // Road lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.setLineDash([20, 15]);
      ctx.beginPath();
      ctx.moveTo(CANVAS_W / 2, 0);
      ctx.lineTo(CANVAS_W / 2, CANVAS_H);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.strokeStyle = '#ffdd57';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ROAD_L, 0);
      ctx.lineTo(ROAD_L, CANVAS_H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(ROAD_L + ROAD_W, 0);
      ctx.lineTo(ROAD_L + ROAD_W, CANVAS_H);
      ctx.stroke();

      // Particles
      for (const p of particles) {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      // Obstacles
      for (const o of obstacles) {
        ctx.shadowColor = o.color === '#7bed9f' ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.3)';
        ctx.shadowBlur = 15;
        ctx.fillStyle = o.color;
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.shadowBlur = 0;

        if (o.color === '#7bed9f') {
          ctx.fillStyle = '#fff';
          ctx.font = '20px Tahoma';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', o.x + o.w / 2, o.y + o.h / 2);
        }
      }

      // Powerups
      for (const p of powerups) {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + p.w / 2, p.y + p.h / 2, p.w / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '14px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.type === 'fuel' ? '⛽' : p.type === 'shield' ? '🛡️' : '🌟', p.x + p.w / 2, p.y + p.h / 2 + 1);
      }

      // Player car
      ctx.shadowColor = '#00aaff';
      ctx.shadowBlur = 25;
      ctx.fillStyle = '#00ccff';
      ctx.fillRect(carX, CAR_Y, CAR_W, CAR_H);
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#88ddff';
      ctx.fillRect(carX + 5, CAR_Y - 2, CAR_W - 10, 16);
      ctx.fillRect(carX + 5, CAR_Y + CAR_H - 14, CAR_W - 10, 12);

      ctx.fillStyle = '#ffdd44';
      ctx.fillRect(carX + 3, CAR_Y - 4, 8, 5);
      ctx.fillRect(carX + CAR_W - 11, CAR_Y - 4, 8, 5);
      ctx.fillStyle = '#ff3333';
      ctx.fillRect(carX + 3, CAR_Y + CAR_H - 3, 8, 5);
      ctx.fillRect(carX + CAR_W - 11, CAR_Y + CAR_H - 3, 8, 5);

      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(carX - 4, CAR_Y + 8, 6, 14);
      ctx.fillRect(carX + CAR_W - 2, CAR_Y + 8, 6, 14);
      ctx.fillRect(carX - 4, CAR_Y + CAR_H - 22, 6, 14);
      ctx.fillRect(carX + CAR_W - 2, CAR_Y + CAR_H - 22, 6, 14);

      // Combo
      if (combo > 1) {
        ctx.fillStyle = '#ffdd57';
        ctx.font = 'bold 24px Tahoma';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.shadowColor = '#ffdd57';
        ctx.shadowBlur = 20;
        ctx.fillText(`🔥 x${combo}`, CANVAS_W / 2, 10);
        ctx.shadowBlur = 0;
      }

      // Level
      ctx.fillStyle = 'rgba(255,255,255,0.03)';
      ctx.font = 'bold 55px Tahoma';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('Lv.' + level, CANVAS_W / 2, 50);

      // Game Over
      if (gameOver) {
        ctx.fillStyle = 'rgba(0,0,0,0.88)';
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.textBaseline = 'middle';

        ctx.fillStyle = '#ff4444';
        ctx.font = 'bold 40px Tahoma';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff4444';
        ctx.shadowBlur = 30;
        ctx.fillText(gameOverReason || '💥 تصادف!', CANVAS_W / 2, CANVAS_H / 2 - 80);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#fff';
        ctx.font = '24px Tahoma';
        ctx.fillText('امتیاز: ' + score, CANVAS_W / 2, CANVAS_H / 2 - 15);

        ctx.fillStyle = '#88ddff';
        ctx.font = '18px Tahoma';
        ctx.fillText('مرحله ' + level, CANVAS_W / 2, CANVAS_H / 2 + 40);

        ctx.fillStyle = '#ff9ff3';
        ctx.font = '18px Tahoma';
        const elapsed = Date.now() - startTime;
        ctx.fillText('⏱️ زمان: ' + formatTime(elapsed), CANVAS_W / 2, CANVAS_H / 2 + 85);

        if (bestTime) {
          ctx.fillStyle = '#ffdd57';
          ctx.font = '16px Tahoma';
          ctx.fillText('🏆 بهترین: ' + formatTime(bestTime), CANVAS_W / 2, CANVAS_H / 2 + 130);
        }
      }

      ctx.restore();
    };

    draw();

    // No animation loop needed - parent handles it
  }, [gameState]);

  return <canvas ref={canvasRef} width={CANVAS_W} height={CANVAS_H} className="game-canvas" />;
}