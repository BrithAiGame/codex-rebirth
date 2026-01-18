import { ItemType, BulletShape, ShotMode } from '../types';
import { CONSTANTS } from '../constants';

export interface StatsModifier {
  maxHp?: number;
  hp?: number; // Heal amount
  speed?: number; // Additive
  damage?: number; // Multiplier
  fireRate?: number; // Multiplier (0.8 = 20% faster)
  shotSpeed?: number; // Additive
  range?: number; // Multiplier
  bulletScale?: number; // Additive
  knockback?: number; // Multiplier
  shotSpread?: number; // Absolute value setter
  bulletShape?: BulletShape;
  shotMode?: ShotMode;
  pierce?: number;
  bounce?: number;
  homing?: number;
  explosive?: number;
  chain?: number;
  gravityScale?: number;
  chargeRate?: number;
  impactDamage?: number;
}

export interface ItemConfig {
  id: string;
  type: ItemType;
  nameKey: string;
  descKey: string;
  color: string;
  sprite: string; // Asset name
  weight: number; // Spawn probability
  stats: StatsModifier;
  isPickup?: boolean; // If true, consumed immediately (like hearts)
  glow?: string;
}

export const ITEMS: ItemConfig[] = [
  {
    id: 'hp_up',
    type: ItemType.HP_UP,
    nameKey: 'ITEM_HP_UP_NAME',
    descKey: 'ITEM_HP_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_MEAT',
    weight: 10,
    stats: { maxHp: 2, hp: 2 }
  },
  {
    id: 'damage_up',
    type: ItemType.DAMAGE_UP,
    nameKey: 'ITEM_DAMAGE_UP_NAME',
    descKey: 'ITEM_DAMAGE_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_SWORD',
    weight: 10,
    stats: { damage: 1.1 }
  },
  {
    id: 'glass_cannon',
    type: ItemType.GLASS_CANNON,
    nameKey: 'ITEM_GLASS_CANNON_NAME',
    descKey: 'ITEM_GLASS_CANNON_DESC',
    color: '#ff0000',
    sprite: 'ITEM_SWORD', // Re-using sword or generic item for now, or make a new one? Let's use Sword but it'll be tinted by engine logic if we want, but sprite is fixed. 
    weight: 5,
    stats: { damage: 2.0, maxHp: -2 } // Big damage, lose HP
  },
  {
    id: 'speed_up',
    type: ItemType.SPEED_UP,
    nameKey: 'ITEM_SPEED_UP_NAME',
    descKey: 'ITEM_SPEED_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_SYRINGE',
    weight: 10,
    stats: { speed: 0.5 }
  },
  {
    id: 'fire_rate_up',
    type: ItemType.FIRE_RATE_UP,
    nameKey: 'ITEM_FIRE_RATE_UP_NAME',
    descKey: 'ITEM_FIRE_RATE_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_MUG',
    weight: 10,
    stats: { fireRate: 0.8 }
  },
  {
    id: 'shot_speed_up',
    type: ItemType.SHOT_SPEED_UP,
    nameKey: 'ITEM_SHOT_SPEED_UP_NAME',
    descKey: 'ITEM_SHOT_SPEED_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_SPRING',
    weight: 10,
    stats: { shotSpeed: 1.5 }
  },
  {
    id: 'range_up',
    type: ItemType.RANGE_UP,
    nameKey: 'ITEM_RANGE_UP_NAME',
    descKey: 'ITEM_RANGE_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_LENS',
    weight: 10,
    stats: { range: 1.2 }
  },
  {
    id: 'bullet_size_up',
    type: ItemType.BULLET_SIZE_UP,
    nameKey: 'ITEM_BULLET_SIZE_UP_NAME',
    descKey: 'ITEM_BULLET_SIZE_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM', // Generic Box
    weight: 8,
    stats: { bulletScale: 0.5 }
  },
  {
    id: 'triple_shot',
    type: ItemType.TRIPLE_SHOT,
    nameKey: 'ITEM_TRIPLE_SHOT_NAME',
    descKey: 'ITEM_TRIPLE_SHOT_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_EYE',
    weight: 5,
    stats: { shotSpread: 3 }
  },
  {
    id: 'quad_shot',
    type: ItemType.QUAD_SHOT,
    nameKey: 'ITEM_QUAD_SHOT_NAME',
    descKey: 'ITEM_QUAD_SHOT_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM_EYE',
    weight: 3,
    stats: { shotSpread: 4 }
  },
  {
    id: 'knockback_up',
    type: ItemType.KNOCKBACK_UP,
    nameKey: 'ITEM_KNOCKBACK_UP_NAME',
    descKey: 'ITEM_KNOCKBACK_UP_DESC',
    color: CONSTANTS.COLORS.ITEM,
    sprite: 'ITEM', // Generic Box
    weight: 10,
    stats: { knockback: 1.2 }
  },
  {
    id: 'penta_shot',
    type: ItemType.PENTA_SHOT,
    nameKey: 'ITEM_PENTA_SHOT_NAME',
    descKey: 'ITEM_PENTA_SHOT_DESC',
    color: '#f59e0b',
    sprite: 'ITEM_SIGIL_PENTA',
    weight: 5,
    stats: { shotSpread: 5 }
  },
  {
    id: 'hepta_shot',
    type: ItemType.HEPTA_SHOT,
    nameKey: 'ITEM_HEPTA_SHOT_NAME',
    descKey: 'ITEM_HEPTA_SHOT_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_HEPTA',
    weight: 4,
    stats: { shotSpread: 7 }
  },
  {
    id: 'octo_shot',
    type: ItemType.OCTO_SHOT,
    nameKey: 'ITEM_OCTO_SHOT_NAME',
    descKey: 'ITEM_OCTO_SHOT_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_OCTO',
    weight: 3,
    stats: { shotSpread: 8 }
  },
  {
    id: 'nova_shot',
    type: ItemType.NOVA_SHOT,
    nameKey: 'ITEM_NOVA_SHOT_NAME',
    descKey: 'ITEM_NOVA_SHOT_DESC',
    color: '#a855f7',
    sprite: 'ITEM_SIGIL_NOVA',
    weight: 2,
    stats: { shotSpread: 9 }
  },
  {
    id: 'piercing_needle',
    type: ItemType.PIERCING_NEEDLE,
    nameKey: 'ITEM_PIERCING_NEEDLE_NAME',
    descKey: 'ITEM_PIERCING_NEEDLE_DESC',
    color: '#e2e8f0',
    sprite: 'ITEM_SIGIL_NEEDLE',
    weight: 8,
    stats: { pierce: 1 }
  },
  {
    id: 'drill_core',
    type: ItemType.DRILL_CORE,
    nameKey: 'ITEM_DRILL_CORE_NAME',
    descKey: 'ITEM_DRILL_CORE_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_DRILL',
    weight: 6,
    stats: { pierce: 2, shotSpeed: 0.6 }
  },
  {
    id: 'ricochet_rune',
    type: ItemType.RICOCHET_RUNE,
    nameKey: 'ITEM_RICOCHET_RUNE_NAME',
    descKey: 'ITEM_RICOCHET_RUNE_DESC',
    color: '#60a5fa',
    sprite: 'ITEM_SIGIL_RICOCHET',
    weight: 7,
    stats: { bounce: 1 }
  },
  {
    id: 'mirror_core',
    type: ItemType.MIRROR_CORE,
    nameKey: 'ITEM_MIRROR_CORE_NAME',
    descKey: 'ITEM_MIRROR_CORE_DESC',
    color: '#a78bfa',
    sprite: 'ITEM_SIGIL_MIRROR',
    weight: 5,
    stats: { bounce: 2, shotSpeed: 0.3 }
  },
  {
    id: 'homing_eye',
    type: ItemType.HOMING_EYE,
    nameKey: 'ITEM_HOMING_EYE_NAME',
    descKey: 'ITEM_HOMING_EYE_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_HOMING',
    weight: 6,
    stats: { homing: 0.35 }
  },
  {
    id: 'seeker_gem',
    type: ItemType.SEEKER_GEM,
    nameKey: 'ITEM_SEEKER_GEM_NAME',
    descKey: 'ITEM_SEEKER_GEM_DESC',
    color: '#22c55e',
    sprite: 'ITEM_SIGIL_SEEKER',
    weight: 4,
    stats: { homing: 0.6, range: 1.1 }
  },
  {
    id: 'blast_cap',
    type: ItemType.BLAST_CAP,
    nameKey: 'ITEM_BLAST_CAP_NAME',
    descKey: 'ITEM_BLAST_CAP_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_BLAST',
    weight: 6,
    stats: { explosive: 36 }
  },
  {
    id: 'hellfire_orb',
    type: ItemType.HELLFIRE_ORB,
    nameKey: 'ITEM_HELLFIRE_ORB_NAME',
    descKey: 'ITEM_HELLFIRE_ORB_DESC',
    color: '#ef4444',
    sprite: 'ITEM_SIGIL_HELLFIRE',
    weight: 4,
    stats: { explosive: 60, impactDamage: 1 },
    glow: '#f97316'
  },
  {
    id: 'chain_relay',
    type: ItemType.CHAIN_RELAY,
    nameKey: 'ITEM_CHAIN_RELAY_NAME',
    descKey: 'ITEM_CHAIN_RELAY_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_CHAIN',
    weight: 6,
    stats: { chain: 1 }
  },
  {
    id: 'storm_relay',
    type: ItemType.STORM_RELAY,
    nameKey: 'ITEM_STORM_RELAY_NAME',
    descKey: 'ITEM_STORM_RELAY_DESC',
    color: '#60a5fa',
    sprite: 'ITEM_SIGIL_STORM',
    weight: 4,
    stats: { chain: 2, damage: 1.05 },
    glow: '#38bdf8'
  },
  {
    id: 'gravity_glove',
    type: ItemType.GRAVITY_GLOVE,
    nameKey: 'ITEM_GRAVITY_GLOVE_NAME',
    descKey: 'ITEM_GRAVITY_GLOVE_DESC',
    color: '#a855f7',
    sprite: 'ITEM_SIGIL_GRAVITY',
    weight: 6,
    stats: { gravityScale: 0.35 }
  },
  {
    id: 'anchor_heart',
    type: ItemType.ANCHOR_HEART,
    nameKey: 'ITEM_ANCHOR_HEART_NAME',
    descKey: 'ITEM_ANCHOR_HEART_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_ANCHOR',
    weight: 4,
    stats: { gravityScale: 0.6, damage: 1.1 }
  },
  {
    id: 'laser_crystal',
    type: ItemType.LASER_CRYSTAL,
    nameKey: 'ITEM_LASER_CRYSTAL_NAME',
    descKey: 'ITEM_LASER_CRYSTAL_DESC',
    color: '#22d3ee',
    sprite: 'ITEM_SIGIL_LASER',
    weight: 4,
    stats: { shotMode: 'laser', range: 1.2 },
    glow: '#22d3ee'
  },
  {
    id: 'charge_coil',
    type: ItemType.CHARGE_COIL,
    nameKey: 'ITEM_CHARGE_COIL_NAME',
    descKey: 'ITEM_CHARGE_COIL_DESC',
    color: '#facc15',
    sprite: 'ITEM_SIGIL_CHARGE',
    weight: 5,
    stats: { shotMode: 'charge', chargeRate: 0.4 },
    glow: '#facc15'
  },
  {
    id: 'overclock_core',
    type: ItemType.OVERCLOCK_CORE,
    nameKey: 'ITEM_OVERCLOCK_CORE_NAME',
    descKey: 'ITEM_OVERCLOCK_CORE_DESC',
    color: '#f472b6',
    sprite: 'ITEM_SIGIL_OVERCLOCK',
    weight: 4,
    stats: { chargeRate: 0.8, fireRate: 0.9 }
  },
  {
    id: 'cube_core',
    type: ItemType.CUBE_CORE,
    nameKey: 'ITEM_CUBE_CORE_NAME',
    descKey: 'ITEM_CUBE_CORE_DESC',
    color: '#94a3b8',
    sprite: 'ITEM_SIGIL_CUBE',
    weight: 6,
    stats: { bulletShape: 'cube', knockback: 1.1 }
  },
  {
    id: 'shard_core',
    type: ItemType.SHARD_CORE,
    nameKey: 'ITEM_SHARD_CORE_NAME',
    descKey: 'ITEM_SHARD_CORE_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_SHARD',
    weight: 6,
    stats: { bulletShape: 'shard', damage: 1.08 }
  },
  {
    id: 'ring_core',
    type: ItemType.RING_CORE,
    nameKey: 'ITEM_RING_CORE_NAME',
    descKey: 'ITEM_RING_CORE_DESC',
    color: '#f59e0b',
    sprite: 'ITEM_SIGIL_RING',
    weight: 6,
    stats: { bulletShape: 'ring', range: 1.1 }
  },
  {
    id: 'bolt_core',
    type: ItemType.BOLT_CORE,
    nameKey: 'ITEM_BOLT_CORE_NAME',
    descKey: 'ITEM_BOLT_CORE_DESC',
    color: '#fbbf24',
    sprite: 'ITEM_SIGIL_BOLT',
    weight: 6,
    stats: { bulletShape: 'bolt', shotSpeed: 0.6 }
  },
  {
    id: 'lumen_seed',
    type: ItemType.LUMEN_SEED,
    nameKey: 'ITEM_LUMEN_SEED_NAME',
    descKey: 'ITEM_LUMEN_SEED_DESC',
    color: '#fef08a',
    sprite: 'ITEM_SIGIL_LUMEN',
    weight: 7,
    stats: { damage: 1.06, fireRate: 0.95 },
    glow: '#fde047'
  },
  {
    id: 'sunstone',
    type: ItemType.SUNSTONE,
    nameKey: 'ITEM_SUNSTONE_NAME',
    descKey: 'ITEM_SUNSTONE_DESC',
    color: '#fb923c',
    sprite: 'ITEM_SIGIL_SUNSTONE',
    weight: 4,
    stats: { damage: 1.15, explosive: 24 },
    glow: '#fb923c'
  },
  {
    id: 'ice_core',
    type: ItemType.ICE_CORE,
    nameKey: 'ITEM_ICE_CORE_NAME',
    descKey: 'ITEM_ICE_CORE_DESC',
    color: '#bae6fd',
    sprite: 'ITEM_SIGIL_ICE',
    weight: 6,
    stats: { shotSpeed: -0.5, knockback: 1.2, range: 1.1 }
  },
  {
    id: 'quicksilver',
    type: ItemType.QUICKSILVER,
    nameKey: 'ITEM_QUICKSILVER_NAME',
    descKey: 'ITEM_QUICKSILVER_DESC',
    color: '#e2e8f0',
    sprite: 'ITEM_SIGIL_QUICK',
    weight: 6,
    stats: { speed: 0.7, fireRate: 0.95 }
  },
  {
    id: 'ion_battery',
    type: ItemType.ION_BATTERY,
    nameKey: 'ITEM_ION_BATTERY_NAME',
    descKey: 'ITEM_ION_BATTERY_DESC',
    color: '#22d3ee',
    sprite: 'ITEM_SIGIL_ION',
    weight: 6,
    stats: { fireRate: 0.7 },
    glow: '#22d3ee'
  },
  {
    id: 'focus_lens',
    type: ItemType.FOCUS_LENS,
    nameKey: 'ITEM_FOCUS_LENS_NAME',
    descKey: 'ITEM_FOCUS_LENS_DESC',
    color: '#93c5fd',
    sprite: 'ITEM_SIGIL_FOCUS',
    weight: 6,
    stats: { range: 1.35 }
  },
  {
    id: 'spiral_spring',
    type: ItemType.SPIRAL_SPRING,
    nameKey: 'ITEM_SPIRAL_SPRING_NAME',
    descKey: 'ITEM_SPIRAL_SPRING_DESC',
    color: '#f472b6',
    sprite: 'ITEM_SIGIL_SPIRAL',
    weight: 6,
    stats: { shotSpeed: 2.0, range: 1.15 }
  },
  {
    id: 'bullet_bloom',
    type: ItemType.BULLET_BLOOM,
    nameKey: 'ITEM_BULLET_BLOOM_NAME',
    descKey: 'ITEM_BULLET_BLOOM_DESC',
    color: '#c084fc',
    sprite: 'ITEM_SIGIL_BLOOM',
    weight: 6,
    stats: { bulletScale: 0.25 }
  },
  {
    id: 'needle_point',
    type: ItemType.NEEDLE_POINT,
    nameKey: 'ITEM_NEEDLE_POINT_NAME',
    descKey: 'ITEM_NEEDLE_POINT_DESC',
    color: '#94a3b8',
    sprite: 'ITEM_SIGIL_POINT',
    weight: 6,
    stats: { bulletScale: -0.15, damage: 1.1 }
  },
  {
    id: 'razor_edge',
    type: ItemType.RAZOR_EDGE,
    nameKey: 'ITEM_RAZOR_EDGE_NAME',
    descKey: 'ITEM_RAZOR_EDGE_DESC',
    color: '#fca5a5',
    sprite: 'ITEM_SIGIL_RAZOR',
    weight: 6,
    stats: { damage: 1.12, knockback: 1.1 }
  },
  {
    id: 'heavy_gauntlet',
    type: ItemType.HEAVY_GAUNTLET,
    nameKey: 'ITEM_HEAVY_GAUNTLET_NAME',
    descKey: 'ITEM_HEAVY_GAUNTLET_DESC',
    color: '#78350f',
    sprite: 'ITEM_SIGIL_GAUNTLET',
    weight: 6,
    stats: { knockback: 1.5, speed: -0.2 }
  },
  {
    id: 'wind_gust',
    type: ItemType.WIND_GUST,
    nameKey: 'ITEM_WIND_GUST_NAME',
    descKey: 'ITEM_WIND_GUST_DESC',
    color: '#67e8f9',
    sprite: 'ITEM_SIGIL_WIND',
    weight: 6,
    stats: { shotSpeed: 1.2, speed: 0.3 }
  },
  {
    id: 'drum_mag',
    type: ItemType.DRUM_MAG,
    nameKey: 'ITEM_DRUM_MAG_NAME',
    descKey: 'ITEM_DRUM_MAG_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_DRUM',
    weight: 5,
    stats: { fireRate: 0.85, shotSpread: 5 }
  },
  {
    id: 'crescent_sigil',
    type: ItemType.CRESCENT_SIGIL,
    nameKey: 'ITEM_CRESCENT_SIGIL_NAME',
    descKey: 'ITEM_CRESCENT_SIGIL_DESC',
    color: '#fcd34d',
    sprite: 'ITEM_SIGIL_CRESCENT',
    weight: 5,
    stats: { shotSpread: 5, range: 1.1 }
  },
  {
    id: 'comet_tail',
    type: ItemType.COMET_TAIL,
    nameKey: 'ITEM_COMET_TAIL_NAME',
    descKey: 'ITEM_COMET_TAIL_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_COMET',
    weight: 6,
    stats: { homing: 0.2, shotSpeed: 0.8 }
  },
  {
    id: 'shock_node',
    type: ItemType.SHOCK_NODE,
    nameKey: 'ITEM_SHOCK_NODE_NAME',
    descKey: 'ITEM_SHOCK_NODE_DESC',
    color: '#a78bfa',
    sprite: 'ITEM_SIGIL_SHOCK',
    weight: 6,
    stats: { chain: 1, impactDamage: 1 }
  },
  {
    id: 'plasma_ring',
    type: ItemType.PLASMA_RING,
    nameKey: 'ITEM_PLASMA_RING_NAME',
    descKey: 'ITEM_PLASMA_RING_DESC',
    color: '#22d3ee',
    sprite: 'ITEM_SIGIL_PLASMA',
    weight: 4,
    stats: { bulletShape: 'ring', explosive: 36 },
    glow: '#22d3ee'
  },
  {
    id: 'meteor_core',
    type: ItemType.METEOR_CORE,
    nameKey: 'ITEM_METEOR_CORE_NAME',
    descKey: 'ITEM_METEOR_CORE_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_METEOR',
    weight: 5,
    stats: { explosive: 48, gravityScale: 0.2 }
  },
  {
    id: 'starforge',
    type: ItemType.STARFORGE,
    nameKey: 'ITEM_STARFORGE_NAME',
    descKey: 'ITEM_STARFORGE_DESC',
    color: '#fde68a',
    sprite: 'ITEM_SIGIL_STARFORGE',
    weight: 4,
    stats: { damage: 1.2, fireRate: 0.9, bulletScale: 0.1 },
    glow: '#fde68a'
  },
  {
    id: 'void_prism',
    type: ItemType.VOID_PRISM,
    nameKey: 'ITEM_VOID_PRISM_NAME',
    descKey: 'ITEM_VOID_PRISM_DESC',
    color: '#6b7280',
    sprite: 'ITEM_SIGIL_VOID',
    weight: 5,
    stats: { bulletShape: 'shard', homing: 0.2, range: 1.2 }
  },
  {
    id: 'blood_vial',
    type: ItemType.BLOOD_VIAL,
    nameKey: 'ITEM_BLOOD_VIAL_NAME',
    descKey: 'ITEM_BLOOD_VIAL_DESC',
    color: '#ef4444',
    sprite: 'ITEM_SIGIL_BLOOD',
    weight: 5,
    stats: { maxHp: 1, damage: 1.05 }
  },
  {
    id: 'haste_chip',
    type: ItemType.HASTE_CHIP,
    nameKey: 'ITEM_HASTE_CHIP_NAME',
    descKey: 'ITEM_HASTE_CHIP_DESC',
    color: '#22c55e',
    sprite: 'ITEM_SIGIL_HASTE',
    weight: 6,
    stats: { speed: 0.5, fireRate: 0.85 }
  },
  {
    id: 'frost_coil',
    type: ItemType.FROST_COIL,
    nameKey: 'ITEM_FROST_COIL_NAME',
    descKey: 'ITEM_FROST_COIL_DESC',
    color: '#7dd3fc',
    sprite: 'ITEM_SIGIL_FROST',
    weight: 6,
    stats: { shotSpeed: -0.4, range: 1.2, knockback: 1.2 }
  },
  {
    id: 'thunder_fuse',
    type: ItemType.THUNDER_FUSE,
    nameKey: 'ITEM_THUNDER_FUSE_NAME',
    descKey: 'ITEM_THUNDER_FUSE_DESC',
    color: '#a78bfa',
    sprite: 'ITEM_SIGIL_THUNDER',
    weight: 5,
    stats: { chain: 2, shotSpeed: 0.4 },
    glow: '#a78bfa'
  },
  {
    id: 'phase_lens',
    type: ItemType.PHASE_LENS,
    nameKey: 'ITEM_PHASE_LENS_NAME',
    descKey: 'ITEM_PHASE_LENS_DESC',
    color: '#f9a8d4',
    sprite: 'ITEM_SIGIL_PHASE',
    weight: 5,
    stats: { pierce: 1, shotSpeed: 0.5 }
  },
  {
    id: 'splitter_matrix',
    type: ItemType.SPLITTER_MATRIX,
    nameKey: 'ITEM_SPLITTER_MATRIX_NAME',
    descKey: 'ITEM_SPLITTER_MATRIX_DESC',
    color: '#fca5a5',
    sprite: 'ITEM_SIGIL_SPLITTER',
    weight: 5,
    stats: { shotSpread: 7, bulletScale: -0.05 }
  },
  {
    id: 'serpent_sigil',
    type: ItemType.SERPENT_SIGIL,
    nameKey: 'ITEM_SERPENT_SIGIL_NAME',
    descKey: 'ITEM_SERPENT_SIGIL_DESC',
    color: '#34d399',
    sprite: 'ITEM_SIGIL_SERPENT',
    weight: 5,
    stats: { homing: 0.4, bounce: 1 }
  },
  {
    id: 'aurora_core',
    type: ItemType.AURORA_CORE,
    nameKey: 'ITEM_AURORA_CORE_NAME',
    descKey: 'ITEM_AURORA_CORE_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_AURORA',
    weight: 5,
    stats: { damage: 1.15, range: 1.1, bulletShape: 'ring' },
    glow: '#7dd3fc'
  },
  {
    id: 'vortex_driver',
    type: ItemType.VORTEX_DRIVER,
    nameKey: 'ITEM_VORTEX_DRIVER_NAME',
    descKey: 'ITEM_VORTEX_DRIVER_DESC',
    color: '#22d3ee',
    sprite: 'ITEM_SIGIL_VORTEX',
    weight: 5,
    stats: { shotSpeed: 0.6, homing: 0.35, gravityScale: 0.15 }
  },
  {
    id: 'gravity_well',
    type: ItemType.GRAVITY_WELL,
    nameKey: 'ITEM_GRAVITY_WELL_NAME',
    descKey: 'ITEM_GRAVITY_WELL_DESC',
    color: '#6366f1',
    sprite: 'ITEM_SIGIL_GRAVITYWELL',
    weight: 4,
    stats: { gravityScale: 0.35, bulletScale: 0.2, range: 0.9 }
  },
  {
    id: 'echo_orb',
    type: ItemType.ECHO_ORB,
    nameKey: 'ITEM_ECHO_ORB_NAME',
    descKey: 'ITEM_ECHO_ORB_DESC',
    color: '#c084fc',
    sprite: 'ITEM_SIGIL_ECHO',
    weight: 5,
    stats: { chain: 1, bounce: 1, shotSpeed: 0.2 }
  },
  {
    id: 'shatter_heart',
    type: ItemType.SHATTER_HEART,
    nameKey: 'ITEM_SHATTER_HEART_NAME',
    descKey: 'ITEM_SHATTER_HEART_DESC',
    color: '#f87171',
    sprite: 'ITEM_SIGIL_SHATTER',
    weight: 5,
    stats: { damage: 1.25, bulletShape: 'shard', shotSpread: 3 }
  },
  {
    id: 'ember_seed',
    type: ItemType.EMBER_SEED,
    nameKey: 'ITEM_EMBER_SEED_NAME',
    descKey: 'ITEM_EMBER_SEED_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_EMBER',
    weight: 5,
    stats: { explosive: 0.35, damage: 1.1 },
    glow: '#fb7185'
  },
  {
    id: 'mist_cloak',
    type: ItemType.MIST_CLOAK,
    nameKey: 'ITEM_MIST_CLOAK_NAME',
    descKey: 'ITEM_MIST_CLOAK_DESC',
    color: '#94a3b8',
    sprite: 'ITEM_SIGIL_MIST',
    weight: 6,
    stats: { speed: 0.4, shotSpeed: -0.2, range: 1.1 }
  },
  {
    id: 'iron_fang',
    type: ItemType.IRON_FANG,
    nameKey: 'ITEM_IRON_FANG_NAME',
    descKey: 'ITEM_IRON_FANG_DESC',
    color: '#9ca3af',
    sprite: 'ITEM_SIGIL_IRONFANG',
    weight: 5,
    stats: { pierce: 2, knockback: 1.1, damage: 1.1 }
  },
  {
    id: 'radiant_halo',
    type: ItemType.RADIANT_HALO,
    nameKey: 'ITEM_RADIANT_HALO_NAME',
    descKey: 'ITEM_RADIANT_HALO_DESC',
    color: '#fde68a',
    sprite: 'ITEM_SIGIL_RADIANT',
    weight: 5,
    stats: { range: 1.2, bulletShape: 'ring', shotSpread: 2 },
    glow: '#fde68a'
  },
  {
    id: 'nova_engine',
    type: ItemType.NOVA_ENGINE,
    nameKey: 'ITEM_NOVA_ENGINE_NAME',
    descKey: 'ITEM_NOVA_ENGINE_DESC',
    color: '#fbbf24',
    sprite: 'ITEM_SIGIL_NOVAENGINE',
    weight: 4,
    stats: { shotSpread: 8, bulletScale: -0.1, shotSpeed: -0.3 }
  },
  {
    id: 'fractal_shard',
    type: ItemType.FRACTAL_SHARD,
    nameKey: 'ITEM_FRACTAL_SHARD_NAME',
    descKey: 'ITEM_FRACTAL_SHARD_DESC',
    color: '#a7f3d0',
    sprite: 'ITEM_SIGIL_FRACTAL',
    weight: 5,
    stats: { bulletShape: 'shard', pierce: 1, damage: 1.1 }
  },
  {
    id: 'mirage_lens',
    type: ItemType.MIRAGE_LENS,
    nameKey: 'ITEM_MIRAGE_LENS_NAME',
    descKey: 'ITEM_MIRAGE_LENS_DESC',
    color: '#f472b6',
    sprite: 'ITEM_SIGIL_MIRAGE',
    weight: 6,
    stats: { homing: 0.5, shotSpeed: 0.3 }
  },
  {
    id: 'thorn_crown',
    type: ItemType.THORN_CROWN,
    nameKey: 'ITEM_THORN_CROWN_NAME',
    descKey: 'ITEM_THORN_CROWN_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_THORN',
    weight: 5,
    stats: { impactDamage: 0.6, knockback: 1.1 }
  },
  {
    id: 'glowstone',
    type: ItemType.GLOWSTONE,
    nameKey: 'ITEM_GLOWSTONE_NAME',
    descKey: 'ITEM_GLOWSTONE_DESC',
    color: '#fef08a',
    sprite: 'ITEM_SIGIL_GLOWSTONE',
    weight: 5,
    stats: { bulletShape: 'bolt', shotSpeed: 0.6 },
    glow: '#fde68a'
  },
  {
    id: 'pulse_capacitor',
    type: ItemType.PULSE_CAPACITOR,
    nameKey: 'ITEM_PULSE_CAPACITOR_NAME',
    descKey: 'ITEM_PULSE_CAPACITOR_DESC',
    color: '#60a5fa',
    sprite: 'ITEM_SIGIL_PULSE',
    weight: 6,
    stats: { fireRate: 0.85, shotSpeed: 0.4 }
  },
  {
    id: 'rift_anchor',
    type: ItemType.RIFT_ANCHOR,
    nameKey: 'ITEM_RIFT_ANCHOR_NAME',
    descKey: 'ITEM_RIFT_ANCHOR_DESC',
    color: '#a855f7',
    sprite: 'ITEM_SIGIL_RIFT',
    weight: 5,
    stats: { bounce: 2, gravityScale: 0.2 }
  },
  {
    id: 'celestial_string',
    type: ItemType.CELESTIAL_STRING,
    nameKey: 'ITEM_CELESTIAL_STRING_NAME',
    descKey: 'ITEM_CELESTIAL_STRING_DESC',
    color: '#bae6fd',
    sprite: 'ITEM_SIGIL_CELESTIAL',
    weight: 5,
    stats: { range: 1.25, shotSpread: 5 }
  },
  {
    id: 'glacier_fang',
    type: ItemType.GLACIER_FANG,
    nameKey: 'ITEM_GLACIER_FANG_NAME',
    descKey: 'ITEM_GLACIER_FANG_DESC',
    color: '#7dd3fc',
    sprite: 'ITEM_SIGIL_GLACIER',
    weight: 5,
    stats: { shotSpeed: -0.4, damage: 1.2, knockback: 1.2 }
  },
  {
    id: 'volt_crown',
    type: ItemType.VOLT_CROWN,
    nameKey: 'ITEM_VOLT_CROWN_NAME',
    descKey: 'ITEM_VOLT_CROWN_DESC',
    color: '#c4b5fd',
    sprite: 'ITEM_SIGIL_VOLT',
    weight: 4,
    stats: { chain: 3, shotSpeed: 0.3 },
    glow: '#c4b5fd'
  },
  {
    id: 'cosmic_spore',
    type: ItemType.COSMIC_SPORE,
    nameKey: 'ITEM_COSMIC_SPORE_NAME',
    descKey: 'ITEM_COSMIC_SPORE_DESC',
    color: '#f0abfc',
    sprite: 'ITEM_SIGIL_COSMIC',
    weight: 6,
    stats: { homing: 0.25, shotSpread: 3, bulletScale: 0.1 }
  },
  {
    id: 'blade_orbit',
    type: ItemType.BLADE_ORBIT,
    nameKey: 'ITEM_BLADE_ORBIT_NAME',
    descKey: 'ITEM_BLADE_ORBIT_DESC',
    color: '#e5e7eb',
    sprite: 'ITEM_SIGIL_BLADE',
    weight: 5,
    stats: { bulletShape: 'cube', shotSpeed: 0.2, pierce: 1, knockback: 1.2 }
  },
  {
    id: 'quake_core',
    type: ItemType.QUAKE_CORE,
    nameKey: 'ITEM_QUAKE_CORE_NAME',
    descKey: 'ITEM_QUAKE_CORE_DESC',
    color: '#fca5a5',
    sprite: 'ITEM_SIGIL_QUAKE',
    weight: 5,
    stats: { impactDamage: 0.8, explosive: 0.25 }
  },
  {
    id: 'shadow_coil',
    type: ItemType.SHADOW_COIL,
    nameKey: 'ITEM_SHADOW_COIL_NAME',
    descKey: 'ITEM_SHADOW_COIL_DESC',
    color: '#111827',
    sprite: 'ITEM_SIGIL_SHADOW',
    weight: 6,
    stats: { damage: 1.15, range: 0.95, shotSpeed: 0.2 }
  },
  {
    id: 'sunlit_sigil',
    type: ItemType.SUNLIT_SIGIL,
    nameKey: 'ITEM_SUNLIT_SIGIL_NAME',
    descKey: 'ITEM_SUNLIT_SIGIL_DESC',
    color: '#fbbf24',
    sprite: 'ITEM_SIGIL_SUNLIT',
    weight: 4,
    stats: { shotMode: 'laser', fireRate: 0.9 },
    glow: '#fde047'
  },
  {
    id: 'moonlit_sigil',
    type: ItemType.MOONLIT_SIGIL,
    nameKey: 'ITEM_MOONLIT_SIGIL_NAME',
    descKey: 'ITEM_MOONLIT_SIGIL_DESC',
    color: '#a5b4fc',
    sprite: 'ITEM_SIGIL_MOONLIT',
    weight: 4,
    stats: { shotMode: 'charge', chargeRate: 0.4, damage: 1.1 }
  },
  {
    id: 'star_pendulum',
    type: ItemType.STAR_PENDULUM,
    nameKey: 'ITEM_STAR_PENDULUM_NAME',
    descKey: 'ITEM_STAR_PENDULUM_DESC',
    color: '#fcd34d',
    sprite: 'ITEM_SIGIL_PENDULUM',
    weight: 5,
    stats: { bounce: 1, chain: 1, shotSpeed: 0.2 }
  },
  {
    id: 'storm_cape',
    type: ItemType.STORM_CAPE,
    nameKey: 'ITEM_STORM_CAPE_NAME',
    descKey: 'ITEM_STORM_CAPE_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_STORMCAPE',
    weight: 5,
    stats: { homing: 0.3, chain: 2, shotSpeed: 0.2 }
  },
  {
    id: 'ghost_mirror',
    type: ItemType.GHOST_MIRROR,
    nameKey: 'ITEM_GHOST_MIRROR_NAME',
    descKey: 'ITEM_GHOST_MIRROR_DESC',
    color: '#e5e7eb',
    sprite: 'ITEM_SIGIL_GHOST',
    weight: 6,
    stats: { pierce: 1, shotSpeed: 0.3, range: 1.1 }
  },
  {
    id: 'crimson_gauge',
    type: ItemType.CRIMSON_GAUGE,
    nameKey: 'ITEM_CRIMSON_GAUGE_NAME',
    descKey: 'ITEM_CRIMSON_GAUGE_DESC',
    color: '#ef4444',
    sprite: 'ITEM_SIGIL_CRIMSON',
    weight: 4,
    stats: { damage: 1.25, maxHp: -1 }
  },
  {
    id: 'nebula_rod',
    type: ItemType.NEBULA_ROD,
    nameKey: 'ITEM_NEBULA_ROD_NAME',
    descKey: 'ITEM_NEBULA_ROD_DESC',
    color: '#d946ef',
    sprite: 'ITEM_SIGIL_NEBULA',
    weight: 5,
    stats: { bulletShape: 'ring', range: 1.15, shotSpread: 4 }
  },
  {
    id: 'comet_drive',
    type: ItemType.COMET_DRIVE,
    nameKey: 'ITEM_COMET_DRIVE_NAME',
    descKey: 'ITEM_COMET_DRIVE_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_COMETDRIVE',
    weight: 5,
    stats: { shotSpeed: 0.8, fireRate: 0.9 }
  },
  {
    id: 'lantern_core',
    type: ItemType.LANTERN_CORE,
    nameKey: 'ITEM_LANTERN_CORE_NAME',
    descKey: 'ITEM_LANTERN_CORE_DESC',
    color: '#fde68a',
    sprite: 'ITEM_SIGIL_LANTERN',
    weight: 6,
    stats: { range: 1.1, homing: 0.2 },
    glow: '#fde68a'
  },
  {
    id: 'vine_spiral',
    type: ItemType.VINE_SPIRAL,
    nameKey: 'ITEM_VINE_SPIRAL_NAME',
    descKey: 'ITEM_VINE_SPIRAL_DESC',
    color: '#22c55e',
    sprite: 'ITEM_SIGIL_VINE',
    weight: 6,
    stats: { knockback: 1.3, shotSpeed: -0.2 }
  },
  {
    id: 'omega_drum',
    type: ItemType.OMEGA_DRUM,
    nameKey: 'ITEM_OMEGA_DRUM_NAME',
    descKey: 'ITEM_OMEGA_DRUM_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_OMEGA',
    weight: 4,
    stats: { shotSpread: 9, shotSpeed: -0.5, fireRate: 1.1 }
  },
  {
    id: 'raze_sigil',
    type: ItemType.RAZE_SIGIL,
    nameKey: 'ITEM_RAZE_SIGIL_NAME',
    descKey: 'ITEM_RAZE_SIGIL_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_RAZE',
    weight: 5,
    stats: { explosive: 0.5, damage: 1.2 }
  },
  {
    id: 'spike_matrix',
    type: ItemType.SPIKE_MATRIX,
    nameKey: 'ITEM_SPIKE_MATRIX_NAME',
    descKey: 'ITEM_SPIKE_MATRIX_DESC',
    color: '#f87171',
    sprite: 'ITEM_SIGIL_SPIKE',
    weight: 5,
    stats: { pierce: 3, bulletShape: 'shard' }
  },
  {
    id: 'glass_ring',
    type: ItemType.GLASS_RING,
    nameKey: 'ITEM_GLASS_RING_NAME',
    descKey: 'ITEM_GLASS_RING_DESC',
    color: '#e2e8f0',
    sprite: 'ITEM_SIGIL_GLASSRING',
    weight: 5,
    stats: { bulletShape: 'ring', bulletScale: 0.2, shotSpeed: 0.2 }
  },
  {
    id: 'thunder_grid',
    type: ItemType.THUNDER_GRID,
    nameKey: 'ITEM_THUNDER_GRID_NAME',
    descKey: 'ITEM_THUNDER_GRID_DESC',
    color: '#a78bfa',
    sprite: 'ITEM_SIGIL_THUNDERGRID',
    weight: 5,
    stats: { chain: 4, shotSpeed: 0.3 },
    glow: '#a78bfa'
  },
  {
    id: 'tidal_core',
    type: ItemType.TIDAL_CORE,
    nameKey: 'ITEM_TIDAL_CORE_NAME',
    descKey: 'ITEM_TIDAL_CORE_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_TIDAL',
    weight: 6,
    stats: { shotSpeed: -0.2, range: 1.3, knockback: 1.1 }
  },
  {
    id: 'arc_beacon',
    type: ItemType.ARC_BEACON,
    nameKey: 'ITEM_ARC_BEACON_NAME',
    descKey: 'ITEM_ARC_BEACON_DESC',
    color: '#38bdf8',
    sprite: 'ITEM_SIGIL_ARC',
    weight: 6,
    stats: { homing: 0.4, chain: 1 }
  },
  {
    id: 'glimmer_feather',
    type: ItemType.GLIMMER_FEATHER,
    nameKey: 'ITEM_GLIMMER_FEATHER_NAME',
    descKey: 'ITEM_GLIMMER_FEATHER_DESC',
    color: '#fef3c7',
    sprite: 'ITEM_SIGIL_GLIMMER',
    weight: 6,
    stats: { speed: 0.6, shotSpeed: 0.2 },
    glow: '#fde68a'
  },
  {
    id: 'fission_seed',
    type: ItemType.FISSION_SEED,
    nameKey: 'ITEM_FISSION_SEED_NAME',
    descKey: 'ITEM_FISSION_SEED_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_FISSION',
    weight: 5,
    stats: { shotSpread: 5, explosive: 0.2 }
  },
  {
    id: 'flare_torch',
    type: ItemType.FLARE_TORCH,
    nameKey: 'ITEM_FLARE_TORCH_NAME',
    descKey: 'ITEM_FLARE_TORCH_DESC',
    color: '#fb7185',
    sprite: 'ITEM_SIGIL_FLARE',
    weight: 6,
    stats: { damage: 1.15, shotSpeed: 0.5 },
    glow: '#fb7185'
  },
  {
    id: 'chrono_cell',
    type: ItemType.CHRONO_CELL,
    nameKey: 'ITEM_CHRONO_CELL_NAME',
    descKey: 'ITEM_CHRONO_CELL_DESC',
    color: '#facc15',
    sprite: 'ITEM_SIGIL_CHRONO',
    weight: 5,
    stats: { fireRate: 0.75, shotSpeed: -0.2 }
  },
  {
    id: 'rune_gear',
    type: ItemType.RUNE_GEAR,
    nameKey: 'ITEM_RUNE_GEAR_NAME',
    descKey: 'ITEM_RUNE_GEAR_DESC',
    color: '#a3a3a3',
    sprite: 'ITEM_SIGIL_RUNEGEAR',
    weight: 6,
    stats: { bounce: 2, shotSpeed: 0.1 }
  },
  {
    id: 'plasma_pearl',
    type: ItemType.PLASMA_PEARL,
    nameKey: 'ITEM_PLASMA_PEARL_NAME',
    descKey: 'ITEM_PLASMA_PEARL_DESC',
    color: '#7c3aed',
    sprite: 'ITEM_SIGIL_PLASMAPEARL',
    weight: 5,
    stats: { bulletShape: 'bolt', shotSpeed: 0.4, chain: 1 },
    glow: '#a855f7'
  },
  {
    id: 'shock_lens',
    type: ItemType.SHOCK_LENS,
    nameKey: 'ITEM_SHOCK_LENS_NAME',
    descKey: 'ITEM_SHOCK_LENS_DESC',
    color: '#f59e0b',
    sprite: 'ITEM_SIGIL_SHOCKLENS',
    weight: 6,
    stats: { impactDamage: 0.5, knockback: 1.2 }
  },
  {
    id: 'aether_spine',
    type: ItemType.AETHER_SPINE,
    nameKey: 'ITEM_AETHER_SPINE_NAME',
    descKey: 'ITEM_AETHER_SPINE_DESC',
    color: '#5eead4',
    sprite: 'ITEM_SIGIL_AETHER',
    weight: 6,
    stats: { pierce: 1, homing: 0.2, range: 1.1 }
  },
  {
    id: 'dragon_scale',
    type: ItemType.DRAGON_SCALE,
    nameKey: 'ITEM_DRAGON_SCALE_NAME',
    descKey: 'ITEM_DRAGON_SCALE_DESC',
    color: '#10b981',
    sprite: 'ITEM_SIGIL_DRAGON',
    weight: 5,
    stats: { maxHp: 1, damage: 1.1, knockback: 1.2 }
  },
  {
    id: 'phoenix_asp',
    type: ItemType.PHOENIX_ASP,
    nameKey: 'ITEM_PHOENIX_ASP_NAME',
    descKey: 'ITEM_PHOENIX_ASP_DESC',
    color: '#f97316',
    sprite: 'ITEM_SIGIL_PHOENIX',
    weight: 4,
    stats: { shotMode: 'charge', chargeRate: 0.6, damage: 1.2 },
    glow: '#fb7185'
  }
];

export const DROPS: ItemConfig[] = [
  {
    id: 'heart_pickup',
    type: ItemType.HEART_PICKUP,
    nameKey: 'PICKUP_HEART_NAME',
    descKey: 'PICKUP_HEART_DESC',
    color: CONSTANTS.COLORS.HEART,
    sprite: 'HEART',
    weight: 0, // Not used in standard item pool
    stats: { hp: 1 },
    isPickup: true
  },
  {
    id: 'key_pickup',
    type: ItemType.KEY,
    nameKey: 'PICKUP_KEY_NAME',
    descKey: 'PICKUP_KEY_DESC',
    color: '#fbbf24',
    sprite: 'ITEM', // Placeholder sprite
    weight: 0,
    stats: {},
    isPickup: true
  },
  {
    id: 'bomb_pickup',
    type: ItemType.BOMB,
    nameKey: 'PICKUP_BOMB_NAME',
    descKey: 'PICKUP_BOMB_DESC',
    color: '#6b7280',
    sprite: 'ITEM', // Placeholder sprite
    weight: 0,
    stats: {},
    isPickup: true
  }
];
