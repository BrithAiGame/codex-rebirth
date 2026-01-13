
// Vector Math
export interface Vector2 {
  x: number;
  y: number;
}

// Enums
export enum EntityType {
  PLAYER = 'PLAYER',
  REMOTE_PLAYER = 'REMOTE_PLAYER',
  ENEMY = 'ENEMY',
  PROJECTILE = 'PROJECTILE',
  ITEM = 'ITEM',
  OBSTACLE = 'OBSTACLE',
  BOMB = 'BOMB',
  DOOR = 'DOOR',
  TRAPDOOR = 'TRAPDOOR',
  PEDESTAL = 'PEDESTAL'
}

export enum EnemyType {
  CHASER = 'CHASER',       // Runs at player
  SHOOTER = 'SHOOTER',     // Stationary, shoots
  DASHER = 'DASHER',       // Dashes periodically
  TANK = 'TANK',           // Slow, High HP, Knockback resistant
  ORBITER = 'ORBITER',     // Circles the player
  BOSS = 'BOSS'            // Big HP, bullet hell
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT'
}

export enum GameStatus {
  MENU = 'MENU',
  CHARACTER_SELECT = 'CHARACTER_SELECT', // New State
  ONLINE = 'ONLINE',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum ItemType {
  HP_UP = 'HP_UP',
  SPEED_UP = 'SPEED_UP',
  DAMAGE_UP = 'DAMAGE_UP',
  FIRE_RATE_UP = 'FIRE_RATE_UP',
  SHOT_SPEED_UP = 'SHOT_SPEED_UP',
  RANGE_UP = 'RANGE_UP',           
  BULLET_SIZE_UP = 'BULLET_SIZE_UP', 
  TRIPLE_SHOT = 'TRIPLE_SHOT',     
  QUAD_SHOT = 'QUAD_SHOT',
  KNOCKBACK_UP = 'KNOCKBACK_UP',
  GLASS_CANNON = 'GLASS_CANNON', // New Item
  HEART_PICKUP = 'HEART_PICKUP',
  KEY = 'KEY',
  BOMB = 'BOMB'
}

export enum Language {
  ZH_CN = 'zh-CN',
  ZH_TW = 'zh-TW',
  EN = 'en',
  RU = 'ru'
}

// Interfaces
export interface KeyMap {
  moveUp: string;
  moveDown: string;
  moveLeft: string;
  moveRight: string;
  shootUp: string;
  shootDown: string;
  shootLeft: string;
  shootRight: string;
  restart: string;
  pause: string;
  toggleFullscreen: string;
  bomb: string;
}

export interface Settings {
  language: Language;
  showMinimap: boolean;
  showFPS: boolean; // New Setting
  fpsLock: 30 | 60;
  isFullScreen: boolean;
  enableJoysticks: boolean; // New Setting
  keyMap: KeyMap;
}

export interface Stats {
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  fireRate: number; // Cooldown in frames (Lower is faster)
  shotSpeed: number;
  range: number;
  shotSpread: number; // 1 = normal, 3 = triple, 4 = quad
  bulletScale: number; // Multiplier for size
  knockback: number; // New Stat: Force of impact
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Entity extends Rect {
  id: string;
  type: EntityType;
  velocity: Vector2;
  knockbackVelocity: Vector2; // Physics: Impact velocity that decays over time
  color: string;
  markedForDeletion: boolean;
  flashTimer?: number; // Visual: Flash white when hit
  visualZ?: number; // For 3D floating effects
}

export interface PlayerEntity extends Entity {
  stats: Stats;
  cooldown: number;
  invincibleTimer: number;
  inventory: ItemType[];
  keys: number;
  bombs: number;
}

export interface EnemyEntity extends Entity {
  enemyType: EnemyType;
  enemyId?: string; // Config id for variant-specific behavior
  hp: number;
  maxHp: number;
  aiState: 'IDLE' | 'CHASE' | 'ATTACK' | 'COOLDOWN';
  timer: number;
  orbitAngle?: number; // For Orbiter
  flying: boolean; // New Property: Can fly over obstacles
  bossId?: string; // Distinguish boss variants
  bossPhase?: number; // Variant-specific phase/state
  bossSpin?: number; // Variant-specific angle accumulator
  // Unified stats for enemies (Speed, Damage, etc.)
  stats: {
      speed: number;
      damage: number;
      fireRate: number;
      shotSpeed: number;
      range: number;
  };
}

export interface ProjectileEntity extends Entity {
  ownerId: string; // 'player' or enemy ID
  damage: number;
  knockback: number; // Force carried by projectile
  lifeTime: number;
}

export interface ItemEntity extends Entity {
  itemType: ItemType;
  name: string; // Now stores Translation Key
  description: string; // Now stores Translation Key
  choiceGroupId?: string; // If set, picking this item removes others with same ID
  costHearts?: number;
}

export interface BombEntity extends Entity {
  timer: number;
  ownerId: string;
  fxOnly?: boolean;
}

export interface RemotePlayerEntity extends Entity {
  playerId: string;
  characterId: string;
}

export interface Room {
  x: number; // Grid X
  y: number; // Grid Y
  type: 'START' | 'NORMAL' | 'ITEM' | 'BOSS' | 'CHEST' | 'DEVIL' | 'HIDDEN';
  doors: { [key in Direction]?: boolean };
  cleared: boolean;
  itemCollected?: boolean; // New flag for persistence
  layout: number[][]; // 0: Floor, 1: Wall, 2: Rock
  visited: boolean;
  seed: number; // Deterministic seed for room events
  themeId?: number; // Visual theme
  doorAnim?: { state: 'closing' | 'closed' | 'opening' | 'open'; t: number };
  forcedOpen?: boolean;
  savedEntities?: Entity[]; // Persist items, pedestals, trapdoors
}

export interface GameState {
  status: GameStatus;
  floorLevel: number;
  score: number;
  hudStats: Stats | null; // For React UI
  notification: string | null; // Stores Translation Key
}
