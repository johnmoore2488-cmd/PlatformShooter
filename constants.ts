export const GRAVITY = 0.6;
export const FRICTION = 0.92;
export const MOVE_SPEED = 0.8; // Acceleration adjusted for new friction
export const MAX_SPEED = 9;
export const JUMP_FORCE = -19.5; // Increased by ~1.2x from -16
export const PROJECTILE_SPEED = 15;
export const ENEMY_PROJECTILE_SPEED = 8;
export const ENEMY_FIRE_RATE = 2500; // ms
export const PLAYER_SIZE = 32;
export const ENEMY_SIZE = 32;
export const MAX_AMMO = 20;
export const WORLD_WIDTH = 2000;
export const WORLD_HEIGHT = 1000;

export const INITIAL_LIVES = 3;
export const PICKUP_LIFETIME = 10000; // 10 seconds

export const MAP_PLATFORMS = [
  // Ground
  { x: 0, y: 800, width: 2000, height: 200 },
  // Floating platforms
  { x: 300, y: 650, width: 200, height: 20 },
  { x: 600, y: 500, width: 200, height: 20 },
  { x: 900, y: 650, width: 200, height: 20 },
  { x: 1200, y: 500, width: 200, height: 20 },
  { x: 1500, y: 650, width: 200, height: 20 },
  { x: 50, y: 400, width: 150, height: 20 },
  { x: 1800, y: 400, width: 150, height: 20 },
];

export const COLORS = {
  PLAYER_LOCAL: '#3b82f6', // blue-500
  ENEMY: '#10b981', // emerald-500
  PROJECTILE: '#f59e0b', // amber-500
  PROJECTILE_ENEMY: '#d946ef', // fuchsia-500
  PLATFORM: '#334155', // slate-700
  AMMO_PICKUP: '#eab308', // yellow-500
  HEALTH_PICKUP: '#f43f5e', // rose-500
};