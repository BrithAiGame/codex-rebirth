
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
  PEDESTAL = 'PEDESTAL',
  SKULL = 'SKULL'
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
  VICTORY = 'VICTORY',
  CODEX = 'CODEX'
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
  BOMB = 'BOMB',
  PENTA_SHOT = 'PENTA_SHOT',
  HEPTA_SHOT = 'HEPTA_SHOT',
  OCTO_SHOT = 'OCTO_SHOT',
  NOVA_SHOT = 'NOVA_SHOT',
  PIERCING_NEEDLE = 'PIERCING_NEEDLE',
  DRILL_CORE = 'DRILL_CORE',
  RICOCHET_RUNE = 'RICOCHET_RUNE',
  MIRROR_CORE = 'MIRROR_CORE',
  HOMING_EYE = 'HOMING_EYE',
  SEEKER_GEM = 'SEEKER_GEM',
  BLAST_CAP = 'BLAST_CAP',
  HELLFIRE_ORB = 'HELLFIRE_ORB',
  CHAIN_RELAY = 'CHAIN_RELAY',
  STORM_RELAY = 'STORM_RELAY',
  GRAVITY_GLOVE = 'GRAVITY_GLOVE',
  ANCHOR_HEART = 'ANCHOR_HEART',
  LASER_CRYSTAL = 'LASER_CRYSTAL',
  CHARGE_COIL = 'CHARGE_COIL',
  OVERCLOCK_CORE = 'OVERCLOCK_CORE',
  CUBE_CORE = 'CUBE_CORE',
  SHARD_CORE = 'SHARD_CORE',
  RING_CORE = 'RING_CORE',
  BOLT_CORE = 'BOLT_CORE',
  LUMEN_SEED = 'LUMEN_SEED',
  SUNSTONE = 'SUNSTONE',
  ICE_CORE = 'ICE_CORE',
  QUICKSILVER = 'QUICKSILVER',
  ION_BATTERY = 'ION_BATTERY',
  FOCUS_LENS = 'FOCUS_LENS',
  SPIRAL_SPRING = 'SPIRAL_SPRING',
  BULLET_BLOOM = 'BULLET_BLOOM',
  NEEDLE_POINT = 'NEEDLE_POINT',
  RAZOR_EDGE = 'RAZOR_EDGE',
  HEAVY_GAUNTLET = 'HEAVY_GAUNTLET',
  WIND_GUST = 'WIND_GUST',
  DRUM_MAG = 'DRUM_MAG',
  CRESCENT_SIGIL = 'CRESCENT_SIGIL',
  COMET_TAIL = 'COMET_TAIL',
  SHOCK_NODE = 'SHOCK_NODE',
  PLASMA_RING = 'PLASMA_RING',
  METEOR_CORE = 'METEOR_CORE',
  STARFORGE = 'STARFORGE',
  VOID_PRISM = 'VOID_PRISM',
  BLOOD_VIAL = 'BLOOD_VIAL',
  HASTE_CHIP = 'HASTE_CHIP',
  FROST_COIL = 'FROST_COIL',
  THUNDER_FUSE = 'THUNDER_FUSE',
  PHASE_LENS = 'PHASE_LENS',
  SPLITTER_MATRIX = 'SPLITTER_MATRIX',
  SERPENT_SIGIL = 'SERPENT_SIGIL',
  AURORA_CORE = 'AURORA_CORE',
  VORTEX_DRIVER = 'VORTEX_DRIVER',
  GRAVITY_WELL = 'GRAVITY_WELL',
  ECHO_ORB = 'ECHO_ORB',
  SHATTER_HEART = 'SHATTER_HEART',
  EMBER_SEED = 'EMBER_SEED',
  MIST_CLOAK = 'MIST_CLOAK',
  IRON_FANG = 'IRON_FANG',
  RADIANT_HALO = 'RADIANT_HALO',
  NOVA_ENGINE = 'NOVA_ENGINE',
  FRACTAL_SHARD = 'FRACTAL_SHARD',
  MIRAGE_LENS = 'MIRAGE_LENS',
  THORN_CROWN = 'THORN_CROWN',
  GLOWSTONE = 'GLOWSTONE',
  PULSE_CAPACITOR = 'PULSE_CAPACITOR',
  RIFT_ANCHOR = 'RIFT_ANCHOR',
  CELESTIAL_STRING = 'CELESTIAL_STRING',
  GLACIER_FANG = 'GLACIER_FANG',
  VOLT_CROWN = 'VOLT_CROWN',
  COSMIC_SPORE = 'COSMIC_SPORE',
  BLADE_ORBIT = 'BLADE_ORBIT',
  QUAKE_CORE = 'QUAKE_CORE',
  SHADOW_COIL = 'SHADOW_COIL',
  SUNLIT_SIGIL = 'SUNLIT_SIGIL',
  MOONLIT_SIGIL = 'MOONLIT_SIGIL',
  STAR_PENDULUM = 'STAR_PENDULUM',
  STORM_CAPE = 'STORM_CAPE',
  GHOST_MIRROR = 'GHOST_MIRROR',
  CRIMSON_GAUGE = 'CRIMSON_GAUGE',
  NEBULA_ROD = 'NEBULA_ROD',
  COMET_DRIVE = 'COMET_DRIVE',
  LANTERN_CORE = 'LANTERN_CORE',
  VINE_SPIRAL = 'VINE_SPIRAL',
  OMEGA_DRUM = 'OMEGA_DRUM',
  RAZE_SIGIL = 'RAZE_SIGIL',
  SPIKE_MATRIX = 'SPIKE_MATRIX',
  GLASS_RING = 'GLASS_RING',
  THUNDER_GRID = 'THUNDER_GRID',
  TIDAL_CORE = 'TIDAL_CORE',
  ARC_BEACON = 'ARC_BEACON',
  GLIMMER_FEATHER = 'GLIMMER_FEATHER',
  FISSION_SEED = 'FISSION_SEED',
  FLARE_TORCH = 'FLARE_TORCH',
  CHRONO_CELL = 'CHRONO_CELL',
  RUNE_GEAR = 'RUNE_GEAR',
  PLASMA_PEARL = 'PLASMA_PEARL',
  SHOCK_LENS = 'SHOCK_LENS',
  AETHER_SPINE = 'AETHER_SPINE',
  DRAGON_SCALE = 'DRAGON_SCALE',
  PHOENIX_ASP = 'PHOENIX_ASP'
}

export type BulletShape = 'orb' | 'cube' | 'shard' | 'ring' | 'bolt' | 'laser';
export type ShotMode = 'normal' | 'laser' | 'charge';

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
  bulletShape: BulletShape;
  shotMode: ShotMode;
  pierce: number;
  bounce: number;
  homing: number;
  explosive: number;
  chain: number;
  gravityScale: number;
  chargeRate: number;
  impactDamage: number;
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
  spawnSeed?: number;
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
  initialRange?: number;
  fxOnly?: boolean;
  shape?: BulletShape;
  pierce?: number;
  bounce?: number;
  homing?: number;
  explosive?: number;
  chain?: number;
  gravityScale?: number;
  impactDamage?: number;
  laserLength?: number;
  chargeLevel?: number;
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

export interface SkullEntity extends Entity {
  label: string;
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
  preSpawnEntities?: Entity[];
}

export interface GameState {
  status: GameStatus;
  floorLevel: number;
  score: number;
  hudStats: Stats | null; // For React UI
  notification: string | null; // Stores Translation Key
}
