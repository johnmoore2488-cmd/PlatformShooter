import { useState, useEffect, useRef, useCallback } from 'react';
import {
  GameState,
  Player,
  Projectile,
  Enemy,
  Pickup,
  Vector2,
  GameMode,
  WaveConfig
} from '../types';
import * as Constants from '../constants';
import { generateWaveConfig } from '../services/geminiService';

interface GameEngineProps {
  mode: GameMode;
  onGameOver: (result: string) => void;
}

export const useGameEngine = ({ mode, onGameOver }: GameEngineProps) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [directorMessage, setDirectorMessage] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Mutable state for performance (avoiding react state in loop)
  const stateRef = useRef<GameState>({
    players: [],
    projectiles: [],
    enemies: [],
    pickups: [],
    platforms: Constants.MAP_PLATFORMS,
    cameraOffset: { x: 0, y: 0 },
    wave: 1,
    isGameOver: false,
    survivalTime: 0
  });

  const inputRef = useRef({
    left: false,
    right: false,
    up: false,
    mouse: { x: 0, y: 0 },
    mouseDown: false,
  });

  const localPlayerIdRef = useRef<string>('');
  const lastSpawnTimeRef = useRef<number>(0);
  const nextPickupWaveTimeRef = useRef<number>(0);

  // --- Helpers ---
  const checkCollision = (obj1: any, obj2: any) => {
    const getRect = (obj: any) => ({
      x: obj.pos ? obj.pos.x : obj.x,
      y: obj.pos ? obj.pos.y : obj.y,
      width: obj.width,
      height: obj.height
    });
    
    const r1 = getRect(obj1);
    const r2 = getRect(obj2);

    return (
      r1.x < r2.x + r2.width &&
      r1.x + r1.width > r2.x &&
      r1.y < r2.y + r2.height &&
      r1.y + r1.height > r2.y
    );
  };

  const getNearestEnemy = (pos: Vector2, enemies: Enemy[]): Enemy | null => {
    let nearest: Enemy | null = null;
    let minDistSq = Infinity;
    
    for (const enemy of enemies) {
      const dx = enemy.pos.x - pos.x;
      const dy = enemy.pos.y - pos.y;
      const distSq = dx*dx + dy*dy;
      if (distSq < minDistSq) {
        minDistSq = distSq;
        nearest = enemy;
      }
    }
    return nearest;
  };

  const spawnProjectile = (player: Player) => {
    if (player.ammo <= 0) return;
    
    player.ammo--;
    const angle = player.facingAngle;
    const speed = Constants.PROJECTILE_SPEED;
    
    const projectile: Projectile = {
      id: Math.random().toString(36).substring(7),
      ownerId: player.id,
      source: 'PLAYER',
      pos: { 
        x: player.pos.x + player.width/2, 
        y: player.pos.y + player.height/2 
      },
      vel: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      width: 10,
      height: 10,
      color: player.isHoming ? Constants.COLORS.PROJECTILE_HOMING : Constants.COLORS.PROJECTILE,
      damage: 1,
      isHoming: player.isHoming
    };

    stateRef.current.projectiles.push(projectile);
  };

  // --- Initialization ---
  useEffect(() => {
    const initGame = async () => {
      const localId = Math.random().toString(36).substring(7);
      localPlayerIdRef.current = localId;

      const initialPlayer: Player = {
        id: localId,
        isLocal: true,
        pos: { x: 100, y: 700 },
        vel: { x: 0, y: 0 },
        width: Constants.PLAYER_SIZE,
        height: Constants.PLAYER_SIZE,
        color: Constants.COLORS.PLAYER_LOCAL,
        lives: Constants.INITIAL_LIVES,
        ammo: Constants.MAX_AMMO,
        maxAmmo: Constants.MAX_AMMO,
        isGrounded: false,
        facingAngle: 0,
        name: 'Hero',
        score: 0,
        kills: 0,
        invincibleUntil: 0,
        isInvincible: false,
        homingUntil: 0,
        isHoming: false
      };

      stateRef.current.players = [initialPlayer];
      stateRef.current.survivalTime = 0;
      stateRef.current.isGameOver = false;
      stateRef.current.enemies = [];
      stateRef.current.projectiles = [];
      stateRef.current.pickups = []; 
      lastSpawnTimeRef.current = 0;
      
      const now = performance.now();
      lastTimeRef.current = now;
      nextPickupWaveTimeRef.current = now + 10000;

      if (mode === GameMode.PVE) {
        setDirectorMessage("Survive.");
      }

      requestRef.current = requestAnimationFrame(gameLoop);
    };

    initGame();

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // --- Input Listeners ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') inputRef.current.left = true;
      if (e.key === 'd' || e.key === 'ArrowRight') inputRef.current.right = true;
      if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') inputRef.current.up = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'ArrowLeft') inputRef.current.left = false;
      if (e.key === 'd' || e.key === 'ArrowRight') inputRef.current.right = false;
      if (e.key === 'w' || e.key === 'ArrowUp' || e.key === ' ') inputRef.current.up = false;
    };
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        inputRef.current.mouse.x = e.clientX - rect.left;
        inputRef.current.mouse.y = e.clientY - rect.top;
      }
    };
    const handleMouseDown = () => { inputRef.current.mouseDown = true; };
    const handleMouseUp = () => { inputRef.current.mouseDown = false; };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // --- Game Loop ---
  const gameLoop = useCallback(async (time: number) => {
    const deltaTime = (time - lastTimeRef.current) / 16.67; // Normalize to ~60FPS
    const rawDeltaSeconds = (time - lastTimeRef.current) / 1000;
    lastTimeRef.current = time;

    const state = stateRef.current;
    if (state.isGameOver) return;

    if (mode === GameMode.PVE) {
        state.survivalTime += rawDeltaSeconds;
    }

    // 1. Update Local Player
    const localPlayer = state.players.find(p => p.isLocal);
    if (localPlayer) {
      localPlayer.isInvincible = time < localPlayer.invincibleUntil;
      localPlayer.isHoming = time < localPlayer.homingUntil;

      if (localPlayer.lives <= 0) {
          // handled at end
      } else {
        // Physics X
        if (inputRef.current.left) localPlayer.vel.x -= Constants.MOVE_SPEED;
        if (inputRef.current.right) localPlayer.vel.x += Constants.MOVE_SPEED;
        
        localPlayer.vel.x *= Constants.FRICTION;
        localPlayer.vel.x = Math.max(Math.min(localPlayer.vel.x, Constants.MAX_SPEED), -Constants.MAX_SPEED);
        
        // Physics Y
        localPlayer.vel.y += Constants.GRAVITY;
        
        // Jump
        if (inputRef.current.up && localPlayer.isGrounded) {
          localPlayer.vel.y = Constants.JUMP_FORCE;
          localPlayer.isGrounded = false;
        }

        // Apply Velocity
        localPlayer.pos.x += localPlayer.vel.x * deltaTime;
        localPlayer.pos.y += localPlayer.vel.y * deltaTime;

        // Angle Calculation
        const worldMouseX = inputRef.current.mouse.x + state.cameraOffset.x;
        const worldMouseY = inputRef.current.mouse.y + state.cameraOffset.y;
        localPlayer.facingAngle = Math.atan2(
          worldMouseY - (localPlayer.pos.y + localPlayer.height/2),
          worldMouseX - (localPlayer.pos.x + localPlayer.width/2)
        );

        // Shooting
        if (inputRef.current.mouseDown) {
           inputRef.current.mouseDown = false; 
           spawnProjectile(localPlayer);
        }

        // Platform Collisions
        localPlayer.isGrounded = false;
        state.platforms.forEach(plat => {
          const playerFeet = localPlayer.pos.y + localPlayer.height;
          const catchThreshold = Math.max(30, plat.height) + Math.max(0, localPlayer.vel.y * deltaTime);

          if (
            playerFeet > plat.y && 
            playerFeet < plat.y + catchThreshold && 
            localPlayer.pos.x + localPlayer.width > plat.x &&
            localPlayer.pos.x < plat.x + plat.width &&
            localPlayer.vel.y >= 0 
          ) {
            localPlayer.isGrounded = true;
            localPlayer.vel.y = 0;
            localPlayer.pos.y = plat.y - localPlayer.height;
          }
        });

        // World Bounds
        if (localPlayer.pos.y > Constants.WORLD_HEIGHT) {
           localPlayer.lives -= 1;
           localPlayer.pos = { x: 100, y: 700 };
           localPlayer.vel = { x: 0, y: 0 };
        }
        if (localPlayer.pos.x < 0) localPlayer.pos.x = 0;
        if (localPlayer.pos.x > Constants.WORLD_WIDTH) localPlayer.pos.x = Constants.WORLD_WIDTH;
      }
    }

    // 2. Camera Update
    if (localPlayer) {
      const targetX = localPlayer.pos.x - window.innerWidth / 2;
      const targetY = localPlayer.pos.y - window.innerHeight / 2;
      state.cameraOffset.x += (targetX - state.cameraOffset.x) * 0.1;
      state.cameraOffset.y += (targetY - state.cameraOffset.y) * 0.1;
      state.cameraOffset.x = Math.max(0, Math.min(state.cameraOffset.x, Constants.WORLD_WIDTH - window.innerWidth));
      state.cameraOffset.y = Math.max(0, Math.min(state.cameraOffset.y, Constants.WORLD_HEIGHT - window.innerHeight));
    }

    // 3. Projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
      const proj = state.projectiles[i];

      // Homing Logic
      if (proj.isHoming && proj.source === 'PLAYER' && localPlayer) {
        // Changed: Target nearest enemy to PLAYER instead of nearest to PROJECTILE
        const target = getNearestEnemy(localPlayer.pos, state.enemies);
        if (target) {
          // Steer bullet velocity towards target
          const targetAngle = Math.atan2(
            (target.pos.y + target.height/2) - proj.pos.y,
            (target.pos.x + target.width/2) - proj.pos.x
          );
          // Current angle
          const currentAngle = Math.atan2(proj.vel.y, proj.vel.x);
          
          // Simple Lerp angle (not perfect wrapping but works for simple homing)
          let newAngle = currentAngle + (targetAngle - currentAngle) * 0.1;
          
          // Recalculate velocity
          const speed = Math.sqrt(proj.vel.x * proj.vel.x + proj.vel.y * proj.vel.y);
          proj.vel.x = Math.cos(newAngle) * speed;
          proj.vel.y = Math.sin(newAngle) * speed;
        }
      }

      proj.pos.x += proj.vel.x * deltaTime;
      proj.pos.y += proj.vel.y * deltaTime;

      // Despawn
      if (proj.pos.x < 0 || proj.pos.x > Constants.WORLD_WIDTH || proj.pos.y < 0 || proj.pos.y > Constants.WORLD_HEIGHT) {
        state.projectiles.splice(i, 1);
        continue;
      }

      // Hit Check (PvE)
      if (mode === GameMode.PVE) {
        let hit = false;
        if (proj.source === 'PLAYER') {
          state.enemies.forEach(enemy => {
             if (!hit && checkCollision(proj, enemy)) {
               enemy.hp -= 1; 
               hit = true;
               const owner = state.players.find(p => p.id === proj.ownerId);
               if (owner) owner.score += 10;
             }
          });
        }
        if (!hit && proj.source === 'ENEMY' && localPlayer) {
           if (checkCollision(proj, localPlayer)) {
              if (!localPlayer.isInvincible) {
                localPlayer.lives -= 1;
              }
              hit = true;
           }
        }
        if (hit) {
           state.projectiles.splice(i, 1);
           continue;
        }
      }
    }

    // 4. PvE Endless Logic
    if (mode === GameMode.PVE && localPlayer) {
      // Difficulty Scaling Algorithm
      const targetEnemyCount = 1 + Math.floor(state.survivalTime / 15);
      // Cap standard enemy HP at 3
      let calculatedHp = 1 + Math.floor(state.survivalTime / 10);
      const currentEnemyMaxHp = Math.min(calculatedHp, 3);
      
      const spawnFlyingEnemy = calculatedHp >= 3 && Math.random() < 0.3; // 30% chance to spawn flyer if difficulty is maxed

      // Spawn Logic
      if (state.enemies.length < targetEnemyCount && (time - lastSpawnTimeRef.current) > 2000) {
         lastSpawnTimeRef.current = time;
         
         if (spawnFlyingEnemy) {
            // Spawn Flying Enemy
            const direction = Math.random() < 0.5 ? 1 : -1;
            const startX = direction === 1 ? -50 : Constants.WORLD_WIDTH + 50;
            const startY = Math.random() * (Constants.FLYING_ENEMY_HEIGHT_MAX - Constants.FLYING_ENEMY_HEIGHT_MIN) + Constants.FLYING_ENEMY_HEIGHT_MIN;
            
            // Passes increase with difficulty (time)
            const passes = 1 + Math.floor((state.survivalTime - 30) / 20); // Adds 1 pass every 20s after difficulty cap

            state.enemies.push({
               id: Math.random().toString(),
               type: 'FLYING',
               pos: { x: startX, y: startY },
               vel: { x: direction * Constants.FLYING_ENEMY_SPEED, y: 0 },
               width: Constants.FLYING_ENEMY_SIZE,
               height: Constants.FLYING_ENEMY_SIZE,
               hp: 2, // Flyers only have 2 HP
               maxHp: 2,
               color: Constants.COLORS.ENEMY_FLYING,
               attackCooldown: Math.random() * 2000 + 1000,
               isGrounded: false,
               direction: direction,
               passesRemaining: Math.max(1, Math.min(passes, 5))
            });
         } else {
            // Spawn Standard Enemy
            let spawnX = Math.random() * Constants.WORLD_WIDTH;
            if (Math.abs(spawnX - localPlayer.pos.x) < 400) {
               spawnX = (spawnX + Constants.WORLD_WIDTH / 2) % Constants.WORLD_WIDTH;
            }

            state.enemies.push({
               id: Math.random().toString(),
               type: 'STANDARD',
               pos: { x: spawnX, y: 100 },
               vel: { x: 0, y: 0 },
               width: Constants.ENEMY_SIZE,
               height: Constants.ENEMY_SIZE,
               hp: currentEnemyMaxHp,
               maxHp: currentEnemyMaxHp,
               color: Constants.COLORS.ENEMY,
               attackCooldown: Math.random() * 2000 + 1000,
               isGrounded: false
            });
         }
      }

      // Enemy AI
      for (let i = state.enemies.length - 1; i >= 0; i--) {
        const enemy = state.enemies[i];
        if (enemy.hp <= 0) {
           state.enemies.splice(i, 1);
           localPlayer.score += 20;
           localPlayer.kills += 1;

           // --- DROP ITEM LOGIC (On Kill) ---
           if (Math.random() < Constants.ENEMY_DROP_CHANCE) {
              const rand = Math.random();
              let type: Pickup['type'] = 'AMMO';
              let color = Constants.COLORS.AMMO_PICKUP;
              let value = 5;

              if (rand > 0.90) { 
                 type = 'INVINCIBILITY';
                 color = Constants.COLORS.INVINCIBILITY_PICKUP;
                 value = 0;
              } else if (rand > 0.80) { // New: 10% for Homing
                 type = 'HOMING';
                 color = Constants.COLORS.HOMING_PICKUP;
                 value = 0;
              } else if (rand > 0.5) { 
                 type = 'HEALTH';
                 color = Constants.COLORS.HEALTH_PICKUP;
                 value = 1;
              }

              state.pickups.push({
                id: Math.random().toString(),
                type,
                value,
                pos: { x: enemy.pos.x, y: enemy.pos.y },
                vel: { x: (Math.random() - 0.5) * 4, y: -4 }, 
                width: 20,
                height: 20,
                color,
                expiresAt: time + Constants.PICKUP_LIFETIME
              });
           }
           continue;
        }

        if (enemy.type === 'FLYING') {
            // --- FLYING BEHAVIOR ---
            enemy.pos.x += enemy.vel.x * deltaTime;
            
            // Check Bounds for Passes
            if (enemy.direction === 1 && enemy.pos.x > Constants.WORLD_WIDTH + 100) {
                // Reached right end
                enemy.passesRemaining = (enemy.passesRemaining || 1) - 1;
                if (enemy.passesRemaining <= 0) {
                    state.enemies.splice(i, 1); // Despawn
                    continue;
                }
                enemy.direction = -1;
                enemy.vel.x = -Constants.FLYING_ENEMY_SPEED;
            } else if (enemy.direction === -1 && enemy.pos.x < -100) {
                // Reached left end
                enemy.passesRemaining = (enemy.passesRemaining || 1) - 1;
                if (enemy.passesRemaining <= 0) {
                    state.enemies.splice(i, 1); // Despawn
                    continue;
                }
                enemy.direction = 1;
                enemy.vel.x = Constants.FLYING_ENEMY_SPEED;
            }

            // Attack Logic (Vertical Drop)
            enemy.attackCooldown -= deltaTime * 16.67;
            if (enemy.attackCooldown <= 0) {
               state.projectiles.push({
                  id: Math.random().toString(36).substring(7),
                  ownerId: enemy.id,
                  source: 'ENEMY',
                  pos: { 
                     x: enemy.pos.x + enemy.width/2, 
                     y: enemy.pos.y + enemy.height 
                  },
                  vel: { x: 0, y: Constants.ENEMY_PROJECTILE_SPEED }, // Vertical Drop
                  width: 10,
                  height: 10,
                  color: Constants.COLORS.PROJECTILE_ENEMY,
                  damage: 1
               });
               enemy.attackCooldown = Constants.ENEMY_FIRE_RATE * 0.8; // Slightly faster fire rate
            }

        } else {
            // --- STANDARD BEHAVIOR ---
            // Gravity
            enemy.vel.y += Constants.GRAVITY;
            
            // Move towards player
            const dx = localPlayer.pos.x - enemy.pos.x;
            const dy = localPlayer.pos.y - enemy.pos.y;

            if (Math.abs(dx) > 10) {
               enemy.vel.x = Math.sign(dx) * 2; 
            } else {
               enemy.vel.x = 0;
            }

            // Vertical Movement (JUMP Logic)
            if (enemy.isGrounded && dy < -80 && Math.random() < 0.05) {
               enemy.vel.y = Constants.JUMP_FORCE;
               enemy.isGrounded = false;
            }

            enemy.pos.x += enemy.vel.x * deltaTime;
            enemy.pos.y += enemy.vel.y * deltaTime;

            // Platform collision
            enemy.isGrounded = false;
            state.platforms.forEach(plat => {
               if (checkCollision(enemy, plat)) {
                  if (enemy.vel.y > 0 && enemy.pos.y < plat.y) {
                     enemy.pos.y = plat.y - enemy.height;
                     enemy.vel.y = 0;
                     enemy.isGrounded = true;
                  }
               }
            });
            
            // Attack Logic
            enemy.attackCooldown -= deltaTime * 16.67;
            if (enemy.attackCooldown <= 0) {
               const angle = Math.atan2(
                  (localPlayer.pos.y + localPlayer.height/2) - (enemy.pos.y + enemy.height/2),
                  (localPlayer.pos.x + localPlayer.width/2) - (enemy.pos.x + enemy.width/2)
               );
               
               state.projectiles.push({
                  id: Math.random().toString(36).substring(7),
                  ownerId: enemy.id,
                  source: 'ENEMY',
                  pos: { 
                     x: enemy.pos.x + enemy.width/2, 
                     y: enemy.pos.y + enemy.height/2 
                  },
                  vel: { 
                     x: Math.cos(angle) * Constants.ENEMY_PROJECTILE_SPEED, 
                     y: Math.sin(angle) * Constants.ENEMY_PROJECTILE_SPEED 
                  },
                  width: 8,
                  height: 8,
                  color: Constants.COLORS.PROJECTILE_ENEMY,
                  damage: 1
               });

               enemy.attackCooldown = Constants.ENEMY_FIRE_RATE;
            }
        }

        // Contact damage
        if (checkCollision(enemy, localPlayer)) {
           if (localPlayer.isInvincible) {
              enemy.hp = 0; // Insta-kill
              localPlayer.vel.y = -5;
           } else {
              localPlayer.vel.x = Math.sign(localPlayer.pos.x - enemy.pos.x) * 10;
              localPlayer.vel.y = -5;
           }
        }
      }
    }

    // 5. Pickups & Periodic Wave
    // --- PERIODIC WAVE DROP (Every 10 seconds) ---
    if (time >= nextPickupWaveTimeRef.current) {
       nextPickupWaveTimeRef.current = time + 10000;
       
       const dropTypes: Pickup['type'][] = ['HEALTH', 'AMMO', 'INVINCIBILITY', 'HOMING'];
       dropTypes.forEach(type => {
         state.pickups.push({
            id: Math.random().toString(),
            type,
            value: type === 'HEALTH' ? 1 : (type === 'AMMO' ? 5 : 0),
            pos: { x: Math.random() * Constants.WORLD_WIDTH, y: -50 }, // From sky
            vel: { x: 0, y: 0 },
            width: 20,
            height: 20,
            color: type === 'HEALTH' ? Constants.COLORS.HEALTH_PICKUP : (type === 'AMMO' ? Constants.COLORS.AMMO_PICKUP : (type === 'INVINCIBILITY' ? Constants.COLORS.INVINCIBILITY_PICKUP : Constants.COLORS.HOMING_PICKUP)),
            expiresAt: time + Constants.PICKUP_LIFETIME
         });
       });
       
       setDirectorMessage("SUPPLY DROP INCOMING!");
       setTimeout(() => setDirectorMessage(""), 3000);
    }

    // Fallback periodic sky drops (reduced chance)
    if (Math.random() < 0.0005) { 
       const isHealth = Math.random() < 0.2; 
       state.pickups.push({
         id: Math.random().toString(),
         type: isHealth ? 'HEALTH' : 'AMMO',
         value: isHealth ? 1 : 5,
         pos: { x: Math.random() * Constants.WORLD_WIDTH, y: 0 },
         vel: { x: 0, y: 0 },
         width: 20,
         height: 20,
         color: isHealth ? Constants.COLORS.HEALTH_PICKUP : Constants.COLORS.AMMO_PICKUP,
         expiresAt: time + Constants.PICKUP_LIFETIME
       });
    }

    for (let i = state.pickups.length - 1; i >= 0; i--) {
       const pickup = state.pickups[i];
       if (time > pickup.expiresAt) {
         state.pickups.splice(i, 1);
         continue;
       }

       pickup.vel.y += Constants.GRAVITY;
       pickup.pos.y += pickup.vel.y * deltaTime;
       pickup.pos.x += pickup.vel.x * deltaTime; 
       pickup.vel.x *= 0.95; 
       
       state.platforms.forEach(plat => {
         if (checkCollision(pickup, plat)) {
           pickup.pos.y = plat.y - pickup.height;
           pickup.vel.y = 0;
           pickup.vel.x = 0;
         }
       });

       if (localPlayer && checkCollision(pickup, localPlayer)) {
         if (pickup.type === 'AMMO') {
           localPlayer.ammo = Math.min(localPlayer.ammo + pickup.value, localPlayer.maxAmmo);
         } else if (pickup.type === 'HEALTH') {
           localPlayer.lives = Math.min(localPlayer.lives + pickup.value, Constants.INITIAL_LIVES);
         } else if (pickup.type === 'INVINCIBILITY') {
           localPlayer.invincibleUntil = time + Constants.INVINCIBILITY_DURATION;
           localPlayer.isInvincible = true;
         } else if (pickup.type === 'HOMING') {
           localPlayer.homingUntil = time + Constants.HOMING_DURATION;
           localPlayer.isHoming = true;
         }
         state.pickups.splice(i, 1);
       }
    }

    // 6. Game Over Check
    if (localPlayer && localPlayer.lives <= 0) {
      state.isGameOver = true;
      const survival = state.survivalTime.toFixed(1) + 's';
      onGameOver(`Survival: ${survival} | Kills: ${localPlayer.kills}`);
    }

    setGameState({ ...state });
    requestRef.current = requestAnimationFrame(gameLoop);
  }, [mode, onGameOver]);


  return {
    gameState,
    canvasRef,
    directorMessage
  };
};