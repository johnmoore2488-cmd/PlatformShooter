import React, { useEffect } from 'react';
import { GameState, GameMode } from '../types';
import * as Constants from '../constants';

interface GameCanvasProps {
  gameState: GameState | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  directorMessage: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, canvasRef, directorMessage }) => {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear
    ctx.fillStyle = '#0f172a'; // BG Color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Camera Transform
    ctx.translate(-gameState.cameraOffset.x, -gameState.cameraOffset.y);

    // Draw Platforms
    ctx.fillStyle = Constants.COLORS.PLATFORM;
    gameState.platforms.forEach(plat => {
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      // Top border highlight
      ctx.fillStyle = '#475569';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);
      ctx.fillStyle = Constants.COLORS.PLATFORM;
    });

    // Draw Pickups
    gameState.pickups.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
      // Glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
      ctx.shadowBlur = 0;
    });

    // Draw Enemies
    gameState.enemies.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.fillRect(e.pos.x, e.pos.y, e.width, e.height);
      
      // Health bar above enemy
      ctx.fillStyle = 'red';
      ctx.fillRect(e.pos.x, e.pos.y - 12, e.width, 4);
      ctx.fillStyle = 'green';
      ctx.fillRect(e.pos.x, e.pos.y - 12, (e.hp / e.maxHp) * e.width, 4);

      // Attack Cooldown (Reload) Bar below enemy
      const cooldownPct = Math.max(0, e.attackCooldown / Constants.ENEMY_FIRE_RATE);
      ctx.fillStyle = '#4b5563'; // gray bg
      ctx.fillRect(e.pos.x, e.pos.y + e.height + 4, e.width, 3);
      ctx.fillStyle = '#e2e8f0'; // white progress
      ctx.fillRect(e.pos.x, e.pos.y + e.height + 4, (1 - cooldownPct) * e.width, 3);
    });

    // Draw Players
    gameState.players.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.fillRect(p.pos.x, p.pos.y, p.width, p.height);
      
      // Draw Gun (Direction)
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      const centerX = p.pos.x + p.width / 2;
      const centerY = p.pos.y + p.height / 2;
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(
        centerX + Math.cos(p.facingAngle) * 30,
        centerY + Math.sin(p.facingAngle) * 30
      );
      ctx.stroke();

      // Name Tag
      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(p.name, centerX, p.pos.y - 15);
    });

    // Draw Projectiles
    gameState.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.pos.x, p.pos.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

  }, [gameState]);

  if (!gameState) return null;

  const localPlayer = gameState.players.find(p => p.isLocal);
  const isPvp = gameState.players.length > 1; // Basic check or pass prop
  
  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block"
      />
      
      {/* Time Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        {isPvp ? (
           <div className={`text-4xl font-mono font-bold px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 backdrop-blur-sm ${gameState.timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {Math.ceil(gameState.timeLeft)}s
           </div>
        ) : (
           <div className="text-4xl font-mono font-bold px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-700 backdrop-blur-sm text-cyan-400">
              SURVIVED: {gameState.survivalTime.toFixed(1)}s
           </div>
        )}
      </div>
      
      {/* HUD Overlay */}
      {localPlayer && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
          <div className="bg-slate-800/80 p-4 rounded-lg border border-slate-600 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-blue-400">STATUS</h2>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase">Lives</span>
                <div className="flex gap-1 text-red-500 text-xl">
                  {"♥".repeat(localPlayer.lives)}
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase">Ammo</span>
                <span className="text-yellow-400 font-mono text-xl">{localPlayer.ammo} / {localPlayer.maxAmmo}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase">Kills</span>
                <span className="text-red-400 font-mono text-xl">{localPlayer.kills}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 uppercase">Score</span>
                <span className="text-green-400 font-mono text-xl">{localPlayer.score}</span>
              </div>
            </div>
          </div>
          
          {directorMessage && (
             <div className="bg-black/60 p-2 rounded border-l-4 border-purple-500 max-w-md animate-pulse">
               <span className="text-purple-300 font-bold text-xs uppercase block mb-1">Objective</span>
               <p className="text-sm italic text-white">{directorMessage}</p>
             </div>
          )}
        </div>
      )}

      {/* Enemy Count (for PvE) */}
      {!isPvp && gameState.enemies.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none">
          <div className="bg-red-900/80 p-1 px-4 rounded-full border border-red-700">
             <span className="text-red-200 text-sm font-bold">{gameState.enemies.length} HOSTILES</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;