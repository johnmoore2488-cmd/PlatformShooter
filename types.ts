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
}

export interface Projectile extends Entity {
  ownerId: string;
  source: 'PLAYER' | 'ENEMY';
  damage: number;
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  attackCooldown: number;
  isGrounded: boolean;
}

export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Pickup extends Entity {
  type: 'AMMO' | 'HEALTH';
  value: number;
  expiresAt: number;
}

export interface GameState {
  players: Player[];
  projectiles: Projectile[];
  enemies: Enemy[];
  pickups: Pickup[];
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
