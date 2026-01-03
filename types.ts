export enum GameMode {
  MENU = 'MENU',
  PVE = 'PVE',
}

export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vector2;
  vel: Vector2;
  width: number;
  height: number;
  color: string;
}

export interface Player extends Entity {
  isLocal: boolean;
  lives: number;
  ammo: number;
  maxAmmo: number;
  isGrounded: boolean;
  facingAngle: number;
  name: string;
  score: number;
  kills: number;
  invincibleUntil: number;
  isInvincible: boolean;
  homingUntil: number;
  isHoming: boolean;
  jetpackFuel: number; // Current fuel in ms
  isThrusting: boolean; // Visual state for jetpack
}

export interface Projectile extends Entity {
  ownerId: string;
  source: 'PLAYER' | 'ENEMY';
  damage: number;
  isHoming?: boolean;
  projectileType?: 'BULLET' | 'MISSILE'; // New field
}

export type EnemyType = 'STANDARD' | 'FLYING';

export interface Enemy extends Entity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  attackCooldown: number;
  isGrounded: boolean;
  // Flying enemy specific
  passesRemaining?: number;
  direction?: 1 | -1; // 1 right, -1 left
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Pickup extends Entity {
  type: 'AMMO' | 'HEALTH' | 'INVINCIBILITY' | 'HOMING';
  value: number;
  expiresAt: number;
}

export interface Warning {
  id: string;
  y: number;
  height: number;
  expiresAt: number;
  layerName: string; // For debugging/display
}

export interface GameState {
  players: Player[];
  projectiles: Projectile[];
  enemies: Enemy[];
  pickups: Pickup[];
  warnings: Warning[]; // New warning system
  platforms: Platform[];
  cameraOffset: Vector2;
  wave: number;
  isGameOver: boolean;
  survivalTime: number; // Seconds survived
}

export interface WaveConfig {
  enemyCount: number;
  enemySpeed: number;
  enemyHp: number;
  spawnInterval: number;
  flavorText: string;
}