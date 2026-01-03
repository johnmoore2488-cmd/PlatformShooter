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

export const INITIAL_LIVES = 5; // Increased from 3 to 5
export const PICKUP_LIFETIME = 10000; // 10 seconds

// New Features
export const ENEMY_DROP_CHANCE = 0.35; // 35% chance to drop item on death
export const INVINCIBILITY_DURATION = 3000; // Reduced to 3 seconds
export const HOMING_DURATION = 3000; // 3 seconds

// Flying Enemy
export const FLYING_ENEMY_SPEED = 5;
export const FLYING_ENEMY_SIZE = 40;
export const FLYING_ENEMY_HEIGHT_MIN = 150;
export const FLYING_ENEMY_HEIGHT_MAX = 400;

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
  SKY: '#000000', // Pure Black
  PLAYER_LOCAL: '#3b82f6', // blue-500
  PLAYER_INVINCIBLE: '#f59e0b', // amber-500 (Gold)
  PLAYER_HOMING: '#ec4899', // pink-500
  ENEMY: '#10b981', // emerald-500
  ENEMY_FLYING: '#ef4444', // red-500
  PROJECTILE: '#f59e0b', // amber-500
  PROJECTILE_HOMING: '#ec4899', // pink-500
  PROJECTILE_ENEMY: '#d946ef', // fuchsia-500
  // Environment
  PLATFORM_BRICK_BASE: '#b91c1c', // red-700
  PLATFORM_BRICK_HIGHLIGHT: '#ef4444', // red-500
  PLATFORM_BRICK_SHADOW: '#7f1d1d', // red-900
  PLATFORM_DIRT_BASE: '#4e342e', // brown-800
  PLATFORM_DIRT_HIGHLIGHT: '#795548', // brown-500
  PLATFORM_GRASS: '#22c55e', // green-500
  
  AMMO_PICKUP: '#eab308', // yellow-500
  HEALTH_PICKUP: '#f43f5e', // rose-500
  INVINCIBILITY_PICKUP: '#8b5cf6', // violet-500
  HOMING_PICKUP: '#ec4899', // pink-500
};