import React, { useEffect, useMemo, useRef } from 'react';
import { GameState, Vector2 } from '../types';
import * as Constants from '../constants';
import { 
  PLAYER_SPRITE, 
  PLAYER_RUN_1,
  PLAYER_RUN_2,
  PLAYER_JUMP,
  ENEMY_STANDARD_SPRITE, 
  ENEMY_STANDARD_MOVE_2,
  ENEMY_FLYING_SPRITE, 
  ENEMY_FLYING_2,
  PICKUP_HEALTH, 
  PICKUP_AMMO, 
  PICKUP_INVINCIBILITY, 
  PICKUP_HOMING,
  TILE_BRICK,
  TILE_DIRT,
  TILE_GRASS,
  SPRITE_GUN,
  SpriteGrid
} from '../services/spriteAssets';

interface GameCanvasProps {
  gameState: GameState | null;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  directorMessage: string;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameState, canvasRef, directorMessage }) => {
  // Cache for patterns
  const patternsRef = useRef<{ brick: CanvasPattern | null, dirt: CanvasPattern | null, grass: CanvasPattern | null }>({ brick: null, dirt: null, grass: null });

  // Initialize Patterns once
  useEffect(() => {
    const createPattern = (grid: SpriteGrid, colorMap: Record<number, string>, scale: number = 2): CanvasPattern | null => {
      const canvas = document.createElement('canvas');
      const cols = grid[0].length;
      const rows = grid.length;
      canvas.width = cols * scale;
      canvas.height = rows * scale;
      const ctx = canvas.getContext('2d');
      if(!ctx) return null;
      
      for(let r=0; r<rows; r++){
        for(let c=0; c<cols; c++){
          const val = grid[r][c];
          if(val !== 0 && colorMap[val]) {
            ctx.fillStyle = colorMap[val];
            ctx.fillRect(c*scale, r*scale, scale, scale);
          }
        }
      }
      return ctx.createPattern(canvas, 'repeat');
    };

    const brickColors = {
      1: Constants.COLORS.PLATFORM_BRICK_BASE,
      2: Constants.COLORS.PLATFORM_BRICK_HIGHLIGHT,
      3: Constants.COLORS.PLATFORM_BRICK_SHADOW,
    };
    
    const dirtColors = {
      1: Constants.COLORS.PLATFORM_DIRT_BASE,
      2: Constants.COLORS.PLATFORM_DIRT_HIGHLIGHT,
    };

    const grassColors = {
      1: Constants.COLORS.PLATFORM_GRASS
    };

    // Scale 4 for 8x8 grid -> 32x32px visual tile size on screen
    patternsRef.current.brick = createPattern(TILE_BRICK, brickColors, 4);
    patternsRef.current.dirt = createPattern(TILE_DIRT, dirtColors, 4);
    patternsRef.current.grass = createPattern(TILE_GRASS, grassColors, 4);

  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameState) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper: Draw Pixel Sprite
    const drawSprite = (
      ctx: CanvasRenderingContext2D,
      grid: SpriteGrid,
      x: number,
      y: number,
      width: number,
      height: number,
      primaryColor: string,
      flipX: boolean = false
    ) => {
      const rows = grid.length;
      const cols = grid[0].length;
      const pixelW = width / cols;
      const pixelH = height / rows;

      ctx.save();
      // If flipX, we translate and scale -1, 1.
      // But we need to pivot around the center of the sprite destination
      if (flipX) {
        ctx.translate(x + width, y);
        ctx.scale(-1, 1);
        ctx.translate(-x, -y); // Move back so drawing at x,y works
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          if (cell === 0) continue;

          // If standard rendering (no context flip), just calculate pos
          const drawX = x + c * pixelW;
          const drawY = y + r * pixelH;

          if (cell === 1) {
            ctx.fillStyle = primaryColor;
          } else if (cell === 2) {
            ctx.fillStyle = '#ffffff'; // White/Highlight
          } else if (cell === 3) {
            ctx.fillStyle = '#1e293b'; // Dark Accent (Slate-800)
          }

          // Draw pixel slightly larger to prevent sub-pixel gaps
          ctx.fillRect(Math.floor(drawX), Math.floor(drawY), Math.ceil(pixelW), Math.ceil(pixelH));
        }
      }
      ctx.restore();
    };

    // Clear Screen (Black Sky)
    ctx.fillStyle = Constants.COLORS.SKY;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Camera Transform
    ctx.translate(-gameState.cameraOffset.x, -gameState.cameraOffset.y);

    const now = performance.now();

    // --- Draw Platforms ---
    gameState.platforms.forEach(plat => {
      // Heuristic to detect Ground (Mud + Grass) vs Floating (Brick/Machine)
      // Ground in constants is at y:800
      const isGround = plat.y >= 750;

      if (isGround) {
        // Draw Mud (Dirt) Body
        if (patternsRef.current.dirt) {
          ctx.fillStyle = patternsRef.current.dirt;
          ctx.save();
          ctx.translate(plat.x, plat.y);
          ctx.fillRect(0, 0, plat.width, plat.height);
          ctx.restore();
        } else {
           ctx.fillStyle = Constants.COLORS.PLATFORM_DIRT_BASE;
           ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        }
        
        // Draw Grass Top
        if (patternsRef.current.grass) {
           const grassHeight = 16;
           ctx.fillStyle = patternsRef.current.grass;
           ctx.save();
           // FIX: Align grass visual top with platform physical top (remove -8 offset)
           // This prevents the player's feet from appearing "inside" the grass.
           ctx.translate(plat.x, plat.y); 
           ctx.fillRect(0, 0, plat.width, grassHeight);
           ctx.restore();
        }

      } else {
        // Draw Bricks (Machine)
        if (patternsRef.current.brick) {
          ctx.fillStyle = patternsRef.current.brick;
          ctx.save();
          ctx.translate(plat.x, plat.y);
          ctx.fillRect(0, 0, plat.width, plat.height);
          ctx.restore();
        } else {
          ctx.fillStyle = Constants.COLORS.PLATFORM_BRICK_BASE;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        }
        // No grass on floating platforms
      }
    });

    // --- Draw Pickups ---
    gameState.pickups.forEach(p => {
      let sprite = PICKUP_AMMO;
      if (p.type === 'HEALTH') sprite = PICKUP_HEALTH;
      else if (p.type === 'INVINCIBILITY') sprite = PICKUP_INVINCIBILITY;
      else if (p.type === 'HOMING') sprite = PICKUP_HOMING;

      // Bobbing animation
      const bobOffset = Math.sin(now / 200) * 3;
      
      // Glow background
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      
      drawSprite(ctx, sprite, p.pos.x, p.pos.y + bobOffset, p.width, p.height, p.color);
      
      ctx.shadowBlur = 0;
    });

    // --- Draw Enemies ---
    gameState.enemies.forEach(e => {
      // Determine direction for flipping
      const isFacingLeft = (e.type === 'FLYING' && e.direction === -1) || (e.type === 'STANDARD' && e.vel.x < 0);
      
      let sprite = ENEMY_STANDARD_SPRITE;

      if (e.type === 'FLYING') {
        // Fly Cycle (2 frames)
        const frame = Math.floor(now / 100) % 2;
        sprite = frame === 0 ? ENEMY_FLYING_SPRITE : ENEMY_FLYING_2;
      } else {
        // Standard Enemy
        if (!e.isGrounded) {
           sprite = ENEMY_STANDARD_MOVE_2; // Jump/Fall frame
        } else if (Math.abs(e.vel.x) > 0.1) {
           // Run Cycle (2 frames)
           const frame = Math.floor(now / 150) % 2;
           sprite = frame === 0 ? ENEMY_STANDARD_SPRITE : ENEMY_STANDARD_MOVE_2;
        } else {
           sprite = ENEMY_STANDARD_SPRITE; // Idle
        }
      }

      drawSprite(
        ctx, 
        sprite, 
        e.pos.x, 
        e.pos.y, 
        e.width, 
        e.height, 
        e.color, 
        isFacingLeft
      );
      
      // Health bar above enemy
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(e.pos.x, e.pos.y - 8, e.width, 3);
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(e.pos.x, e.pos.y - 8, (e.hp / e.maxHp) * e.width, 3);
    });

    // --- Draw Players ---
    gameState.players.forEach(p => {
      let color = p.color;
      let shadowColor = 'transparent';
      
      if (p.isInvincible) {
        color = Constants.COLORS.PLAYER_INVINCIBLE;
        shadowColor = Constants.COLORS.PLAYER_INVINCIBLE;
      } else if (p.isHoming) {
        color = Constants.COLORS.PLAYER_HOMING;
        shadowColor = Constants.COLORS.PLAYER_HOMING;
      }

      ctx.shadowBlur = p.isInvincible || p.isHoming ? 15 : 0;
      ctx.shadowColor = shadowColor;

      // Determine Flip based on facing angle
      const isFacingLeft = Math.abs(p.facingAngle) > Math.PI / 2;

      // --- ANIMATION SELECTION ---
      let playerSprite = PLAYER_SPRITE;
      
      if (!p.isGrounded) {
        playerSprite = PLAYER_JUMP;
      } else if (Math.abs(p.vel.x) > 0.1) {
        // Run Cycle: 4 beats (Stride A -> Idle -> Stride B -> Idle) for smoothness
        // 100ms per frame
        const frame = Math.floor(now / 100) % 4;
        if (frame === 0) playerSprite = PLAYER_RUN_1;
        else if (frame === 1) playerSprite = PLAYER_SPRITE;
        else if (frame === 2) playerSprite = PLAYER_RUN_2;
        else playerSprite = PLAYER_SPRITE;
      } else {
        playerSprite = PLAYER_SPRITE; // Idle
      }

      drawSprite(
        ctx, 
        playerSprite, 
        p.pos.x, 
        p.pos.y, 
        p.width, 
        p.height, 
        color, 
        isFacingLeft
      );

      ctx.shadowBlur = 0; // Reset
      
      // --- Draw Gun (NES Style) ---
      const centerX = p.pos.x + p.width / 2;
      const centerY = p.pos.y + p.height / 2;
      
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(p.facingAngle);
      
      if (Math.abs(p.facingAngle) > Math.PI / 2) {
         ctx.scale(1, -1); // Flip vertically so the "top" of the gun is still up
      }

      // Draw gun offset from center
      const gunDist = 12;
      drawSprite(ctx, SPRITE_GUN, gunDist, -6, 20, 12, '#94a3b8'); // Slate-400 grey
      
      ctx.restore();

      // Name Tag
      ctx.fillStyle = '#fff';
      ctx.font = '10px "Press Start 2P", monospace'; // Generic fallback to monospace if font not loaded
      ctx.textAlign = 'center';
      ctx.fillText(p.name, centerX, p.pos.y - 12);
    });

    // --- Draw Projectiles ---
    gameState.projectiles.forEach(p => {
      ctx.fillStyle = p.color;
      
      // Draw as little squares instead of circles for NES vibe
      const size = 6;
      ctx.fillRect(p.pos.x - size/2, p.pos.y - size/2, size, size);
      
      // Trail effect
      ctx.fillStyle = `${p.color}66`; // 40% opacity
      ctx.fillRect(p.pos.x - p.vel.x * 0.2 - size/2, p.pos.y - p.vel.y * 0.2 - size/2, size * 0.8, size * 0.8);
    });

    ctx.restore();

  }, [gameState]);

  if (!gameState) return null;

  const localPlayer = gameState.players.find(p => p.isLocal);
  
  return (
    <div className="relative w-full h-full bg-black">
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
        className="block"
        style={{ imageRendering: 'pixelated' }} // Ensure sharp scaling
      />
      
      {/* Time Display */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
        <div className="text-2xl font-mono font-bold px-4 py-2 rounded border-2 border-slate-700 bg-slate-900 text-cyan-400 shadow-lg">
          TIME: {Math.floor(gameState.survivalTime)}
        </div>
      </div>
      
      {/* HUD Overlay */}
      {localPlayer && (
        <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none font-mono">
          <div className="bg-slate-900 border-2 border-slate-600 p-4 rounded shadow-xl">
            <h2 className="text-xl font-bold text-blue-400 mb-2 border-b border-slate-700 pb-1">P1 STATUS</h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">LIFE</span>
                <div className="flex gap-1 text-red-500 text-xl">
                  {"♥".repeat(localPlayer.lives)}
                </div>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">AMMO</span>
                <span className="text-yellow-400 text-lg">{localPlayer.ammo.toString().padStart(2, '0')}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">KILLS</span>
                <span className="text-red-400 text-lg">{localPlayer.kills.toString().padStart(3, '0')}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-slate-400">PTS</span>
                <span className="text-green-400 text-lg">{localPlayer.score.toString().padStart(6, '0')}</span>
              </div>
            </div>
          </div>
          
          {/* Status Effects */}
          {localPlayer.isInvincible && (
            <div className="bg-amber-500 border-2 border-white text-white p-2 rounded shadow-lg animate-pulse text-center font-bold">
               *** STAR POWER ***
            </div>
          )}
           {localPlayer.isHoming && (
            <div className="bg-pink-600 border-2 border-white text-white p-2 rounded shadow-lg animate-pulse text-center font-bold">
               [ HOMING ON ]
            </div>
          )}
          
          {directorMessage && (
             <div className="bg-black border-l-4 border-purple-500 p-2 mt-2 max-w-md animate-bounce">
               <span className="text-purple-400 font-bold text-xs block">>>> MESSAGE</span>
               <p className="text-sm text-white uppercase">{directorMessage}</p>
             </div>
          )}
        </div>
      )}

      {/* Enemy Count */}
      {gameState.enemies.length > 0 && (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 pointer-events-none font-mono">
          <div className="bg-red-900 border-2 border-red-500 p-2 px-4 rounded shadow-lg">
             <span className="text-white text-sm font-bold">ENEMIES: {gameState.enemies.length.toString().padStart(2, '0')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;