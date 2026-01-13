
import { CONSTANTS } from './constants';
import { 
  Entity, PlayerEntity, EnemyEntity, ProjectileEntity, ItemEntity, BombEntity, RemotePlayerEntity,
  EntityType, EnemyType, Direction, Stats, ItemType, GameStatus, Room, Rect, Vector2 
} from './types';
import { uuid, checkAABB, distance, normalizeVector, SeededRNG } from './utils';
import { generateDungeon, carveDoors } from './dungeon';
import { ROOM_THEMES } from './config/themes';
import { AssetLoader } from './assets';
import * as THREE from 'three';

// Import Configurations
import { ENEMIES, BOSSES } from './config/enemies';
import { ITEMS, DROPS } from './config/items';
import { CHARACTERS } from './config/characters';

const ENEMY_SHOOT_RATE_SCALE = 1 / 0.3;
const scaleEnemyShootInterval = (base: number) => Math.max(1, Math.round(base * ENEMY_SHOOT_RATE_SCALE));

export class GameEngine {
  // Headless: No Canvas/Context here. 
  // The React Renderer will read the state of this engine.
  
  assets: AssetLoader;
  
  status: GameStatus = GameStatus.MENU;
  floorLevel: number = 1;
  baseSeed: number = 0;
  score: number = 0;
  
  player: PlayerEntity;
  remotePlayers: Map<string, RemotePlayerEntity> = new Map();
  remoteTargets: Map<string, { x: number; y: number }> = new Map();
  entities: Entity[] = [];
  currentRoom: Room | null = null;
  dungeon: Room[] = [];

  // Notification system
  notification: string | null = null;
  notificationTimer: number = 0;
  screenFlashTimer: number = 0;
  cameraShakeTimer: number = 0;
  
  // Restart Logic
  restartTimer: number = 0;
  
  // Pause Logic
  pauseLocked: boolean = false;
  bombLocked: boolean = false;

  // Selected Character
  characterId: string = 'alpha';
  floorThemeId: number | null = null;
  floorThemeLabel: string | null = null;
  difficulty: 'NORMAL' | 'HARD' = 'NORMAL';
  onlineMode: boolean = false;

  // Callback to sync React UI
  onUiUpdate: (stats: any) => void;

  // Camera State
  cameraQuaternion: THREE.Quaternion = new THREE.Quaternion();

  constructor(onUiUpdate: (stats: any) => void) {
    this.onUiUpdate = onUiUpdate;
    this.assets = new AssetLoader(); // Assets are still managed here to share textures

    // Default Player
    this.player = this.createPlayer('alpha');
  }

  startNewGame(characterId: string = 'alpha', difficulty: 'NORMAL' | 'HARD' = 'NORMAL') {
    this.characterId = characterId;
    this.difficulty = difficulty;
    this.onlineMode = false;
    this.floorLevel = 1;
    this.score = 0;
    this.baseSeed = Math.floor(Math.random() * 1000000); // Initial random seed for the run
    this.player = this.createPlayer(characterId);
    this.loadFloor(1);
    this.status = GameStatus.PLAYING;
    this.restartTimer = 0;
  }

  startNetworkGame(baseSeed: number, characterId: string = 'alpha', difficulty: 'NORMAL' | 'HARD' = 'NORMAL') {
    this.characterId = characterId;
    this.difficulty = difficulty;
    this.onlineMode = true;
    this.floorLevel = 1;
    this.score = 0;
    this.baseSeed = baseSeed;
    this.player = this.createPlayer(characterId);
    this.loadFloor(1);
    this.status = GameStatus.PLAYING;
    this.restartTimer = 0;
  }

  resumeGame() {
      if (this.status === GameStatus.PAUSED) {
          this.status = GameStatus.PLAYING;
      }
  }

  getEnemyDifficultyMultiplier() {
      return this.difficulty === 'HARD' ? 3 : 1;
  }

  createPlayer(characterId: string): PlayerEntity {
    // Find character config
    const config = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
    const s = config.baseStats;

    return {
      id: 'player',
      type: EntityType.PLAYER,
      x: CONSTANTS.CANVAS_WIDTH / 2 - CONSTANTS.PLAYER_SIZE / 2,
      y: CONSTANTS.CANVAS_HEIGHT / 2 - CONSTANTS.PLAYER_SIZE / 2,
      w: CONSTANTS.PLAYER_SIZE,
      h: CONSTANTS.PLAYER_SIZE,
      velocity: { x: 0, y: 0 },
      knockbackVelocity: { x: 0, y: 0 },
      color: config.color,
      markedForDeletion: false,
      stats: { ...s }, // Clone stats
      cooldown: 0,
      invincibleTimer: 0,
      inventory: [],
      keys: 1,
      bombs: 1,
      visualZ: 0
    };
  }

  // Calculate geometric room growth based on run seed
  calculateRoomCount(level: number): number {
      const rng = new SeededRNG(this.baseSeed);
      let count = 5;
      
      // Simulate growth for previous levels to reach current state
      for (let i = 1; i < level; i++) {
          const increasePct = rng.range(0.2, 0.6); // 20% to 60%
          count = Math.floor(count * (1 + increasePct));
      }
      return count;
  }

  loadFloor(level: number) {
    this.floorLevel = level;
    // Deterministic seed for this floor based on run seed
    const floorSeed = this.baseSeed + (level * 1000); 
    const roomCount = this.calculateRoomCount(level);
    const themeSeed = new SeededRNG(floorSeed + 12345);
    const fixedThemeId = level <= 5 ? Math.floor(themeSeed.next() * ROOM_THEMES.length) : undefined;
    this.floorThemeId = fixedThemeId !== undefined ? fixedThemeId : null;
    this.floorThemeLabel = fixedThemeId !== undefined ? (ROOM_THEMES[fixedThemeId]?.label || '???') : '???';
    this.dungeon = generateDungeon(level, floorSeed, roomCount, fixedThemeId);
    
    const startRoom = this.dungeon.find(r => r.type === 'START');
    if (startRoom) {
      this.enterRoom(startRoom, null);
    }
  }

  enterRoom(room: Room, inputDir: Direction | null) {
    // 1. Save state of current room before leaving
    if (this.currentRoom) {
        // Save persistent entities: Items, Pedestals, Trapdoors, Obstacles
        const persistentTypes = [EntityType.ITEM, EntityType.PEDESTAL, EntityType.TRAPDOOR, EntityType.OBSTACLE];
        const toSave = this.entities.filter(e => persistentTypes.includes(e.type) && !e.markedForDeletion);
        this.currentRoom.savedEntities = toSave;
    }

    this.currentRoom = room;
    
    // Sync clear status for Item Rooms (re-entry logic)
    if (room.type === 'ITEM' && room.itemCollected) {
        room.cleared = true;
    }
    if (room.type === 'CHEST' || room.type === 'DEVIL' || room.type === 'HIDDEN') {
        room.cleared = true;
    }

    // Carve doorways so the opening is visible; collision is controlled by doorAnim state.
    carveDoors(room.layout, room.doors);

    if (room.forcedOpen) {
        room.doorAnim = { state: 'open', t: 1 };
    } else if (room.cleared) {
        room.doorAnim = { state: 'open', t: 1 };
    } else if (room.type === 'START') {
        room.doorAnim = { state: 'open', t: 1 };
    } else {
        room.doorAnim = { state: 'closing', t: 1 };
    }

    // Clear dynamic entities
    this.entities = [];
    this.remotePlayers.clear();
    this.remoteTargets.clear();

    // Position Player based on entry direction (Movement Direction)
    const cx = CONSTANTS.CANVAS_WIDTH / 2;
    const cy = CONSTANTS.CANVAS_HEIGHT / 2;
    
    // Offset to place player just inside the room (Tile size + padding)
    const offset = CONSTANTS.TILE_SIZE + 16; 
    
    // Door Clamping: Ensure player aligns with the door frame
    const doorW = CONSTANTS.TILE_SIZE * 3;
    const minX = cx - doorW/2;
    const maxX = cx + doorW/2 - this.player.w;
    const minY = cy - doorW/2; 
    const maxY = cy + doorW/2 - this.player.h;

    // Reset Player Physics
    this.player.knockbackVelocity = {x:0, y:0};

    // Logic: If I moved UP to enter, I spawn at the BOTTOM of the new room.
    if (inputDir === Direction.UP) {
      this.player.y = CONSTANTS.CANVAS_HEIGHT - offset - this.player.h;
      this.player.x = Math.max(minX, Math.min(this.player.x, maxX)); // Clamp X
    } else if (inputDir === Direction.DOWN) {
      this.player.y = offset;
      this.player.x = Math.max(minX, Math.min(this.player.x, maxX)); // Clamp X
    } else if (inputDir === Direction.LEFT) {
      this.player.x = CONSTANTS.CANVAS_WIDTH - offset - this.player.w;
      this.player.y = Math.max(minY, Math.min(this.player.y, maxY)); // Clamp Y
    } else if (inputDir === Direction.RIGHT) {
      this.player.x = offset;
      this.player.y = Math.max(minY, Math.min(this.player.y, maxY)); // Clamp Y
    } else {
      // Start room / Teleport: Center
      this.player.x = cx - this.player.w/2;
      this.player.y = cy - this.player.h/2;
    }

    // --- Entity Restoration / Generation ---

    // 2. Restore Saved Entities (Items, Pedestals, etc.)
    if (room.savedEntities && room.savedEntities.length > 0) {
        this.entities.push(...room.savedEntities);
    } 
    // 3. Initial Generation (If not visited)
    else if (!room.visited) {
        // Spawn Item if Item Room
        if (room.type === 'ITEM') {
            this.spawnItem(cx, cy, room.seed);
        }
        if (room.type === 'CHEST') {
            this.spawnItem(cx, cy, room.seed);
        }
        if (room.type === 'DEVIL') {
            this.spawnDevilItems(cx, cy, room.seed);
        }
        
        // Spawn Boss (Initial Fight)
        if (room.type === 'BOSS') {
            this.spawnBoss(cx, cy);
        }
    }

    // 4. Enemy Spawning (Living things)
    // Note: Bosses spawned above are for initial fight. If returning to uncleared boss room, handle here.
    if (!room.cleared && room.type !== 'START' && room.type !== 'CHEST' && room.type !== 'DEVIL') {
        // If it's a Boss room and we are revisiting (fled?), respawn Boss
        if (room.type === 'BOSS' && room.visited) {
             this.spawnBoss(cx, cy);
        }
        // Spawn normal enemies
        else if (room.type === 'NORMAL') {
             this.spawnEnemiesForRoom(room);
        }
    }

    // BUG FIX: Check if room is empty (no enemies spawned) immediately.
    // This fixes Item rooms (0 enemies) and rare empty Normal rooms.
    // If we don't do this, the door stays locked until update() loop runs,
    // which might cause a frame of "locked" state or glitch if not handled.
    if (!room.cleared) {
        const enemies = this.entities.filter(e => e.type === EntityType.ENEMY);
        if (enemies.length === 0) {
            room.cleared = true;
            carveDoors(room.layout, room.doors);
            room.doorAnim = { state: 'open', t: 1 };
        }
    }

    room.visited = true;
  }

  syncRemotePlayers(players: { id: string; x: number; y: number; w: number; h: number; characterId: string }[]) {
    const next = new Map<string, RemotePlayerEntity>();
    players.forEach(p => {
      const prev = this.remotePlayers.get(p.id);
      const vx = prev ? prev.velocity.x : 0;
      const vy = prev ? prev.velocity.y : 0;
      this.remoteTargets.set(p.id, { x: p.x, y: p.y });
      next.set(p.id, {
        id: `remote_${p.id}`,
        type: EntityType.REMOTE_PLAYER,
        playerId: p.id,
        characterId: p.characterId,
        x: prev ? prev.x : p.x,
        y: prev ? prev.y : p.y,
        w: p.w,
        h: p.h,
        velocity: { x: vx, y: vy },
        knockbackVelocity: { x: 0, y: 0 },
        color: '#ffffff',
        markedForDeletion: false,
        visualZ: 0
      });
    });
    this.remotePlayers = next;
  }

  updateRemotePlayers(dt: number) {
    const lerpFactor = Math.min(1, dt * 8);
    this.remotePlayers.forEach((player, id) => {
      const target = this.remoteTargets.get(id);
      if (!target) return;
      const dx = target.x - player.x;
      const dy = target.y - player.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 60) {
        player.x = target.x;
        player.y = target.y;
        player.velocity.x = 0;
        player.velocity.y = 0;
        return;
      }
      if (dist < 0.5) {
        player.velocity.x = 0;
        player.velocity.y = 0;
        return;
      }
      player.velocity.x = dx * 0.5;
      player.velocity.y = dy * 0.5;
      player.x += dx * lerpFactor;
      player.y += dy * lerpFactor;
    });
  }

  spawnEnemiesForRoom(room: Room) {
    const rng = new SeededRNG(room.seed + 100);
    const count = 2 + rng.rangeInt(0, 2) + this.floorLevel;
    if (room.type === 'ITEM') return;

    const validEnemies = ENEMIES.filter(e => e.minFloor <= this.floorLevel);

    const checkTileBlocked = (x: number, y: number, size: number): boolean => {
       const ts = CONSTANTS.TILE_SIZE;
       const corners = [
           {x, y}, {x: x+size, y}, {x, y: y+size}, {x: x+size, y: y+size}
       ];
       for (const p of corners) {
           const cx = Math.floor(p.x / ts);
           const cy = Math.floor(p.y / ts);
           if (cy < 0 || cy >= room.layout.length || cx < 0 || cx >= room.layout[0].length) return true;
           const tile = room.layout[cy][cx];
           if (tile === 1 || tile === 2) return true;
       }
       return false;
    };

    for (let i = 0; i < count; i++) {
        let ex = 0;
        let ey = 0;
        let valid = false;
        
        const config = rng.weightedChoice(validEnemies);
        if (!config) continue;

        for (let attempt = 0; attempt < 10; attempt++) {
             ex = CONSTANTS.TILE_SIZE * 2 + rng.next() * (CONSTANTS.CANVAS_WIDTH - CONSTANTS.TILE_SIZE * 4);
             ey = CONSTANTS.TILE_SIZE * 2 + rng.next() * (CONSTANTS.CANVAS_HEIGHT - CONSTANTS.TILE_SIZE * 4);
             if (distance({x: ex, y: ey}, this.player) < 150) continue;
             if (checkTileBlocked(ex, ey, config.size)) continue;
             valid = true;
             break;
        }

        if (!valid) continue;

        const diffMult = this.getEnemyDifficultyMultiplier();
        const hp = (config.hpBase * diffMult) + (this.floorLevel * config.hpPerLevel * diffMult);

        const canShoot = config.shotSpeed > 0 || config.range > 0;
        const baseFireRate = canShoot ? scaleEnemyShootInterval(config.fireRate) : config.fireRate;
        const fireRate = canShoot ? Math.max(5, Math.round(baseFireRate / diffMult)) : baseFireRate;

        const enemy: EnemyEntity = {
            id: uuid(),
            type: EntityType.ENEMY,
            x: ex, y: ey,
            w: config.size, h: config.size,
            velocity: { x: 0, y: 0 },
            knockbackVelocity: { x: 0, y: 0 },
            color: config.color,
            markedForDeletion: false,
            enemyType: config.type,
            enemyId: config.id,
            hp: hp,
            maxHp: hp,
            aiState: 'IDLE',
            timer: 0,
            orbitAngle: rng.next() * Math.PI * 2,
            flying: config.flying,
            stats: {
                speed: config.speed * diffMult,
                damage: config.damage * diffMult,
                fireRate,
                shotSpeed: config.shotSpeed * diffMult,
                range: config.range * diffMult
            },
            visualZ: config.flying ? 20 : 0
        };
        this.entities.push(enemy);
    }
  }

  spawnBoss(x: number, y: number) {
      const seed = this.currentRoom ? this.currentRoom.seed + 777 : Math.random() * 100000;
      const rng = new SeededRNG(seed);
      const config = rng.weightedChoice(BOSSES) || BOSSES[0];
      const diffMult = this.getEnemyDifficultyMultiplier();
      const hp = (config.hpBase * diffMult) + (this.floorLevel * config.hpPerLevel * diffMult);
      const canShoot = config.shotSpeed > 0 || config.range > 0;
      const baseFireRate = canShoot ? scaleEnemyShootInterval(config.fireRate) : config.fireRate;
      const fireRate = canShoot ? Math.max(5, Math.round(baseFireRate / diffMult)) : baseFireRate;
      const boss: EnemyEntity = {
          id: uuid(),
          type: EntityType.ENEMY,
          x: x - config.size/2, y: y - config.size/2,
          w: config.size, h: config.size,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: config.color,
          markedForDeletion: false,
          enemyType: config.type,
          hp: hp,
          maxHp: hp,
          aiState: 'IDLE',
          timer: 0,
          flying: config.flying,
          bossId: config.id,
          bossPhase: 0,
          bossSpin: 0,
          stats: {
              speed: config.speed * diffMult,
              damage: config.damage * diffMult,
              fireRate,
              shotSpeed: config.shotSpeed * diffMult,
              range: config.range * diffMult
          },
          visualZ: 40 // Hover high
      };
      this.entities.push(boss);
  }

  spawnPedestal(x: number, y: number) {
      this.entities.push({
          id: uuid(),
          type: EntityType.PEDESTAL,
          x: x - CONSTANTS.ITEM_SIZE/2,
          y: y - CONSTANTS.ITEM_SIZE/2 + 8, // Offset slightly down so item sits on top
          w: CONSTANTS.ITEM_SIZE,
          h: CONSTANTS.ITEM_SIZE,
          velocity: {x:0, y:0},
          knockbackVelocity: {x:0, y:0},
          color: CONSTANTS.COLORS.PEDESTAL,
          markedForDeletion: false
      });
  }

  spawnItem(x: number, y: number, seed?: number, choiceGroupId?: string) {
      this.spawnPedestal(x, y);
      const rng = seed !== undefined ? new SeededRNG(seed) : new SeededRNG(Math.random() * 100000);
      const config = rng.weightedChoice(ITEMS);
      if (!config) return;

      const item: ItemEntity = {
          id: uuid(),
          type: EntityType.ITEM,
          x: x - CONSTANTS.ITEM_SIZE/2,
          y: y - CONSTANTS.ITEM_SIZE/2,
          w: CONSTANTS.ITEM_SIZE,
          h: CONSTANTS.ITEM_SIZE,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: config.color,
          markedForDeletion: false,
          itemType: config.type,
          name: config.nameKey,
          description: config.descKey,
          choiceGroupId: choiceGroupId,
          visualZ: 10 // Floating
      };
      this.entities.push(item);
  }

  spawnDevilItems(x: number, y: number, seed?: number) {
      const rng = seed !== undefined ? new SeededRNG(seed) : new SeededRNG(Math.random() * 100000);
      const count = 1 + Math.floor(rng.next() * 4);
      const spacing = 70;
      const startX = x - ((count - 1) * spacing) / 2;
      const choiceId = `devil_${this.floorLevel}_${Math.floor(seed || rng.next() * 100000)}`;
      for (let i = 0; i < count; i++) {
          this.spawnPedestal(startX + i * spacing, y);
          const config = rng.weightedChoice(ITEMS);
          if (!config) continue;
          const costHearts = 1 + Math.floor(rng.next() * 3);
          const item: ItemEntity = {
              id: uuid(),
              type: EntityType.ITEM,
              x: startX + i * spacing - CONSTANTS.ITEM_SIZE/2,
              y: y - CONSTANTS.ITEM_SIZE/2,
              w: CONSTANTS.ITEM_SIZE,
              h: CONSTANTS.ITEM_SIZE,
              velocity: {x:0, y:0},
              knockbackVelocity: { x: 0, y: 0 },
              color: config.color,
              markedForDeletion: false,
              itemType: config.type,
              name: config.nameKey,
              description: config.descKey,
              choiceGroupId: choiceId,
              costHearts,
              visualZ: 10
          };
          this.entities.push(item);
      }
  }
  
  spawnPickup(x: number, y: number) {
      const config = DROPS[0]; 
      const pickup: ItemEntity = {
          id: uuid(),
          type: EntityType.ITEM,
          x: x - 8,
          y: y - 8,
          w: 16,
          h: 16,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: config.color,
          markedForDeletion: false,
          itemType: config.type,
          name: config.nameKey,
          description: config.descKey
      };
      this.entities.push(pickup);
  }

  spawnKey(x: number, y: number) {
      const config = DROPS.find(d => d.type === ItemType.KEY);
      const pickup: ItemEntity = {
          id: uuid(),
          type: EntityType.ITEM,
          x: x - 8,
          y: y - 8,
          w: 16,
          h: 16,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: config ? config.color : '#fbbf24',
          markedForDeletion: false,
          itemType: ItemType.KEY,
          name: config ? config.nameKey : 'PICKUP_KEY_NAME',
          description: config ? config.descKey : 'PICKUP_KEY_DESC'
      };
      this.entities.push(pickup);
  }

  spawnBombPickup(x: number, y: number) {
      const config = DROPS.find(d => d.type === ItemType.BOMB);
      const pickup: ItemEntity = {
          id: uuid(),
          type: EntityType.ITEM,
          x: x - 8,
          y: y - 8,
          w: 16,
          h: 16,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: config ? config.color : '#6b7280',
          markedForDeletion: false,
          itemType: ItemType.BOMB,
          name: config ? config.nameKey : 'PICKUP_BOMB_NAME',
          description: config ? config.descKey : 'PICKUP_BOMB_DESC'
      };
      this.entities.push(pickup);
  }

  spawnBomb(x: number, y: number) {
      const size = 20;
      const bomb: BombEntity = {
          id: uuid(),
          type: EntityType.BOMB,
          x: x - size / 2,
          y: y - size / 2,
          w: size,
          h: size,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: '#111827',
          markedForDeletion: false,
          timer: 3,
          ownerId: 'player'
      };
      this.entities.push(bomb);
  }

  spawnRemoteBombFx(x: number, y: number) {
      const size = 20;
      const bomb: BombEntity = {
          id: uuid(),
          type: EntityType.BOMB,
          x: x - size / 2,
          y: y - size / 2,
          w: size,
          h: size,
          velocity: {x:0, y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: '#111827',
          markedForDeletion: false,
          timer: 0.05,
          ownerId: 'remote',
          fxOnly: true
      };
      this.entities.push(bomb);
  }

  spawnTrapdoor(x: number, y: number) {
      const td: Entity = {
          id: uuid(),
          type: EntityType.TRAPDOOR,
          x: x - 24, y: y - 24,
          w: 48, h: 48,
          velocity: {x:0,y:0},
          knockbackVelocity: { x: 0, y: 0 },
          color: CONSTANTS.COLORS.TRAPDOOR,
          markedForDeletion: false
      };
      this.entities.push(td);
  }

  explodeBomb(bomb: BombEntity) {
      if (!this.currentRoom) return;
      bomb.markedForDeletion = true;
      this.screenFlashTimer = Math.max(this.screenFlashTimer, 12);
      this.cameraShakeTimer = Math.max(this.cameraShakeTimer, 16);

      const ts = CONSTANTS.TILE_SIZE;
      const center = { x: bomb.x + bomb.w / 2, y: bomb.y + bomb.h / 2 };
      const radius = ts * 1.6;

      const playerCenter = { x: this.player.x + this.player.w / 2, y: this.player.y + this.player.h / 2 };
      const distToPlayer = distance(center, playerCenter);
      if (distToPlayer <= radius) {
          const hitDir = normalizeVector({ x: playerCenter.x - center.x, y: playerCenter.y - center.y });
          this.damagePlayer(1, 4, hitDir);
      }

      const layout = this.currentRoom.layout;
      const startX = Math.max(0, Math.floor((center.x - radius) / ts));
      const endX = Math.min(layout[0].length - 1, Math.floor((center.x + radius) / ts));
      const startY = Math.max(0, Math.floor((center.y - radius) / ts));
      const endY = Math.min(layout.length - 1, Math.floor((center.y + radius) / ts));

      for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
              const tileCenter = { x: (x + 0.5) * ts, y: (y + 0.5) * ts };
              if (distance(center, tileCenter) <= radius && layout[y][x] === 2) {
                  layout[y][x] = 0;
              }
          }
      }

      this.entities.forEach(e => {
          if (e.type === EntityType.OBSTACLE) {
              const ec = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
              if (distance(center, ec) <= radius) {
                  e.markedForDeletion = true;
              }
          }
      });

      carveDoors(this.currentRoom.layout, this.currentRoom.doors);
      if (!this.currentRoom.doorAnim) {
          this.currentRoom.doorAnim = { state: 'open', t: 1 };
      } else {
          this.currentRoom.doorAnim.state = 'open';
          this.currentRoom.doorAnim.t = 1;
      }
      this.currentRoom.forcedOpen = true;

      this.tryOpenHiddenDoor(center, radius);
  }

  tryOpenHiddenDoor(center: { x: number; y: number }, radius: number) {
      if (!this.currentRoom) return;
      const ts = CONSTANTS.TILE_SIZE;
      const roomCenter = {
          x: (CONSTANTS.CANVAS_WIDTH / 2),
          y: (CONSTANTS.CANVAS_HEIGHT / 2)
      };

      const dirs: { dir: Direction; dx: number; dy: number }[] = [
          { dir: Direction.UP, dx: 0, dy: -1 },
          { dir: Direction.DOWN, dx: 0, dy: 1 },
          { dir: Direction.LEFT, dx: -1, dy: 0 },
          { dir: Direction.RIGHT, dx: 1, dy: 0 }
      ];

      const isNearWall = (dir: Direction) => {
          if (dir === Direction.UP) return center.y <= radius && Math.abs(center.x - roomCenter.x) <= ts;
          if (dir === Direction.DOWN) return center.y >= (CONSTANTS.ROOM_HEIGHT - 1) * ts - radius && Math.abs(center.x - roomCenter.x) <= ts;
          if (dir === Direction.LEFT) return center.x <= radius && Math.abs(center.y - roomCenter.y) <= ts;
          return center.x >= (CONSTANTS.ROOM_WIDTH - 1) * ts - radius && Math.abs(center.y - roomCenter.y) <= ts;
      };

      for (const d of dirs) {
          const neighbor = this.dungeon.find(r => r.x === this.currentRoom!.x + d.dx && r.y === this.currentRoom!.y + d.dy);
          if (!neighbor || neighbor.type !== 'HIDDEN') continue;
          if (!isNearWall(d.dir)) continue;

          this.currentRoom.doors[d.dir] = true;
          const opposite = d.dir === Direction.UP ? Direction.DOWN :
                           d.dir === Direction.DOWN ? Direction.UP :
                           d.dir === Direction.LEFT ? Direction.RIGHT : Direction.LEFT;
          neighbor.doors[opposite] = true;
          neighbor.cleared = true;
          neighbor.forcedOpen = true;

          carveDoors(this.currentRoom.layout, this.currentRoom.doors);
          carveDoors(neighbor.layout, neighbor.doors);
          if (!neighbor.doorAnim) neighbor.doorAnim = { state: 'open', t: 1 };
          break;
      }
  }

  // Generate current state for UI (shared between Pause/Playing)
  getUiState() {
      let nearbyItem = null;
      let bossData = null;

      if (this.currentRoom) {
          let closestDist = 120; // Increased Inspection Radius from 80 to 120
          const cx = this.player.x + this.player.w/2;
          const cy = this.player.y + this.player.h/2;
          
          for (const e of this.entities) {
             if (e.type === EntityType.ITEM && !e.markedForDeletion) {
                 const ecx = e.x + e.w/2;
                 const ecy = e.y + e.h/2;
                 const d = Math.sqrt(Math.pow(ecx - cx, 2) + Math.pow(ecy - cy, 2));
                 
                 if (d < closestDist) {
                     closestDist = d;
                     nearbyItem = {
                         name: (e as ItemEntity).name,
                         desc: (e as ItemEntity).description,
                         x: e.x, y: e.y, w: e.w, h: e.h
                     };
                 }
             }
             if (e.type === EntityType.ENEMY && (e as EnemyEntity).enemyType === EnemyType.BOSS) {
                 const b = e as EnemyEntity;
                 const conf = BOSSES.find(x => x.id === b.bossId) || BOSSES[0];
                 bossData = {
                     name: conf ? conf.name : 'BOSS',
                     hp: b.hp,
                     maxHp: b.maxHp
                 };
             }
          }
      }

      return {
          hp: this.player.stats.hp,
          maxHp: this.player.stats.maxHp,
          floor: this.floorLevel,
          themeName: this.floorThemeLabel,
          score: this.score,
          seed: this.baseSeed,
          items: this.player.inventory.length,
          keys: this.player.keys,
          bombs: this.player.bombs,
          notification: this.notification,
          screenFlashTimer: this.screenFlashTimer,
          cameraShakeTimer: this.cameraShakeTimer,
          dungeon: this.dungeon.map(r => ({x: r.x, y: r.y, type: r.type, visited: r.visited})),
          currentRoomPos: this.currentRoom ? {x: this.currentRoom.x, y: this.currentRoom.y} : {x:0, y:0},
          stats: this.player.stats,
          nearbyItem,
          boss: bossData,
          restartTimer: this.restartTimer,
          inventory: [...this.player.inventory] // Fix: Include inventory in UI state
      };
  }

  update(input: { move: {x:number, y:number}, shoot: {x:number, y:number} | null, restart?: boolean, pause?: boolean, bomb?: boolean }, dt: number = 1 / 60) {
    
    // Toggle Pause Logic
    if (input.pause) {
        if (!this.pauseLocked) {
            if (this.status === GameStatus.PLAYING) {
                this.status = GameStatus.PAUSED;
            } else if (this.status === GameStatus.PAUSED) {
                this.status = GameStatus.PLAYING;
            }
            this.pauseLocked = true;
        }
    } else {
        this.pauseLocked = false;
    }

    if (input.restart) {
        this.restartTimer++;
        if (this.restartTimer > 60) {
            this.startNewGame(this.characterId);
            this.notification = "NOTIF_RESTART";
            this.notificationTimer = 120;
        }
    } else {
        this.restartTimer = 0;
    }

    if (this.status === GameStatus.PAUSED) {
        this.onUiUpdate(this.getUiState());
        return;
    }

    if (this.status !== GameStatus.PLAYING) return;

    if (this.notificationTimer > 0) {
        this.notificationTimer--;
        if (this.notificationTimer <= 0) {
            this.notification = null;
        }
    }
    if (this.screenFlashTimer > 0) this.screenFlashTimer--;
    if (this.cameraShakeTimer > 0) this.cameraShakeTimer--;

    if (this.currentRoom?.doorAnim) {
        const doorAnim = this.currentRoom.doorAnim;
        const doorSpeed = 0.04;
        if (doorAnim.state === 'closing') {
            doorAnim.t = Math.max(0, doorAnim.t - doorSpeed);
            if (doorAnim.t <= 0) doorAnim.state = 'closed';
        } else if (doorAnim.state === 'opening') {
            doorAnim.t = Math.min(1, doorAnim.t + doorSpeed);
            if (doorAnim.t >= 1) doorAnim.state = 'open';
        }
    }

    // --- Player Logic ---
    if (input.move.x !== 0 || input.move.y !== 0) {
        this.player.velocity.x = input.move.x * this.player.stats.speed;
        this.player.velocity.y = input.move.y * this.player.stats.speed;
    } else {
        this.player.velocity.x = 0;
        this.player.velocity.y = 0;
    }

    this.applyPhysics(this.player);
    this.resolveWallCollision(this.player);

    if (this.player.cooldown > 0) this.player.cooldown--;
    if (input.shoot && this.player.cooldown <= 0) {
        this.spawnProjectile(this.player, input.shoot);
        this.player.cooldown = this.player.stats.fireRate;
    }

    if (input.bomb) {
        if (!this.bombLocked && this.player.bombs > 0) {
            this.player.bombs = Math.max(0, this.player.bombs - 1);
            const cx = this.player.x + this.player.w / 2;
            const cy = this.player.y + this.player.h / 2;
            this.spawnBomb(cx, cy);
        }
        this.bombLocked = true;
    } else {
        this.bombLocked = false;
    }

    if (this.player.invincibleTimer > 0) this.player.invincibleTimer--;
    if (this.player.flashTimer && this.player.flashTimer > 0) this.player.flashTimer--;

    // --- Entity Loop ---
    const enemies = this.entities.filter(e => e.type === EntityType.ENEMY) as EnemyEntity[];
    const roomIsClear = enemies.length === 0;

    // Fixed logic to ensure rooms clear when last enemy dies
    // Also covers cases where room has 0 enemies initially (if enterRoom didn't catch it)
    if (this.currentRoom && !this.currentRoom.cleared && roomIsClear) {
        this.currentRoom.cleared = true;
        carveDoors(this.currentRoom.layout, this.currentRoom.doors);
        if (this.currentRoom.doorAnim && this.currentRoom.doorAnim.state !== 'open') {
            this.currentRoom.doorAnim.state = 'opening';
            this.currentRoom.doorAnim.t = Math.max(0, this.currentRoom.doorAnim.t);
        }
        
        // Spawn rewards
        if (Math.random() < 0.10) {
             const cx = CONSTANTS.CANVAS_WIDTH / 2;
             const cy = CONSTANTS.CANVAS_HEIGHT / 2;
             this.spawnPickup(cx, cy);
        }
        
        if (this.currentRoom.type === 'BOSS') {
            const cx = CONSTANTS.CANVAS_WIDTH / 2;
            const cy = CONSTANTS.CANVAS_HEIGHT / 2;
            this.spawnTrapdoor(cx, cy);
            const off = 80;
            const choiceId = `boss_reward_${this.floorLevel}`;
            const rng = new SeededRNG(this.currentRoom.seed + 999);
            this.spawnItem(cx - off, cy, rng.next() * 10000, choiceId);
            this.spawnItem(cx + off, cy, rng.next() * 10000, choiceId);
        }
    }

    if (this.currentRoom && this.currentRoom.doorAnim?.state === 'open') {
        this.checkDoorCollisions();
    }

    this.resolveEnemyPhysics(enemies);

    this.entities.forEach(e => {
        if (e.markedForDeletion) return;

        if (e.type === EntityType.ENEMY) {
            this.applyPhysics(e);
            this.resolveWallCollision(e); // Allow enemies to move and collide with walls
        } else if (e.type !== EntityType.PROJECTILE && e.type !== EntityType.PEDESTAL) {
            e.x += e.velocity.x;
            e.y += e.velocity.y;
        }
        
        if (e.flashTimer && e.flashTimer > 0) e.flashTimer--;

        if (e.type === EntityType.PROJECTILE) {
            this.updateProjectile(e as ProjectileEntity);
        } else if (e.type === EntityType.ENEMY) {
            this.updateEnemy(e as EnemyEntity);
        } else if (e.type === EntityType.BOMB) {
            const bomb = e as BombEntity;
            bomb.timer -= dt;
            if (bomb.timer <= 0) {
                if (bomb.fxOnly) {
                    bomb.markedForDeletion = true;
                } else {
                    this.explodeBomb(bomb);
                }
            }
        } else if (e.type === EntityType.ITEM) {
            if (checkAABB(this.player, e)) {
                this.collectItem(e as ItemEntity);
            }
        } else if (e.type === EntityType.TRAPDOOR) {
            if (checkAABB(this.player, e)) {
                this.loadFloor(this.floorLevel + 1);
            }
        }
        
        // Bobbing for floating items
        if (e.visualZ !== undefined && e.type === EntityType.ITEM) {
             // Simple bobbing logic could go here or in renderer
        }
    });

    this.entities = this.entities.filter(e => !e.markedForDeletion);
    this.updateRemotePlayers(dt);
    this.onUiUpdate(this.getUiState());
  }
  
  applyPhysics(ent: Entity) {
      ent.knockbackVelocity.x *= 0.9;
      ent.knockbackVelocity.y *= 0.9;
      if (Math.abs(ent.knockbackVelocity.x) < 0.1) ent.knockbackVelocity.x = 0;
      if (Math.abs(ent.knockbackVelocity.y) < 0.1) ent.knockbackVelocity.y = 0;
      ent.velocity.x += ent.knockbackVelocity.x;
      ent.velocity.y += ent.knockbackVelocity.y;
  }

  resolveEnemyPhysics(enemies: EnemyEntity[]) {
      for (let i = 0; i < enemies.length; i++) {
          for (let j = i + 1; j < enemies.length; j++) {
              const e1 = enemies[i];
              const e2 = enemies[j];
              const fly1 = e1.enemyType === EnemyType.SHOOTER || e1.enemyType === EnemyType.ORBITER;
              const fly2 = e2.enemyType === EnemyType.SHOOTER || e2.enemyType === EnemyType.ORBITER;
              if (fly1 || fly2) continue;

              const dx = e1.x - e2.x;
              const dy = e1.y - e2.y;
              const dist = Math.sqrt(dx*dx + dy*dy);
              const minDist = e1.w; 
              if (dist < minDist && dist > 0) {
                  const overlap = minDist - dist;
                  const pushX = (dx / dist) * (overlap / 2);
                  const pushY = (dy / dist) * (overlap / 2);
                  e1.x += pushX; e1.y += pushY;
                  e2.x -= pushX; e2.y -= pushY;
              }
          }
      }
  }

  spawnProjectile(owner: PlayerEntity | EnemyEntity, dir: {x:number, y:number}) {
      const isPlayer = owner.type === EntityType.PLAYER;
      const stats = isPlayer ? (owner as PlayerEntity).stats : (owner as EnemyEntity).stats;
      const speed = stats.shotSpeed; 
      const damage = stats.damage;
      const knockback = isPlayer ? (owner as PlayerEntity).stats.knockback : 0;
      let baseSize = CONSTANTS.PROJECTILE_SIZE;
      if (isPlayer) {
          const dmgFactor = Math.max(1, damage / 3.5);
          baseSize = baseSize * dmgFactor;
          baseSize *= (owner as PlayerEntity).stats.bulletScale;
      }
      const range = stats.range;
      
      const pushProj = (vx: number, vy: number) => {
          this.entities.push({
              id: uuid(),
              type: EntityType.PROJECTILE,
              x: owner.x + owner.w/2 - baseSize/2,
              y: owner.y + owner.h/2 - baseSize/2,
              w: baseSize, h: baseSize,
              velocity: { x: vx * speed, y: vy * speed },
              knockbackVelocity: { x: 0, y: 0 },
              color: isPlayer ? CONSTANTS.COLORS.PROJECTILE_FRIENDLY : CONSTANTS.COLORS.PROJECTILE_ENEMY,
              markedForDeletion: false,
              ownerId: owner.id,
              damage,
              knockback,
              lifeTime: range,
              visualZ: 10
          } as ProjectileEntity);
      };

      if (!isPlayer || (owner as PlayerEntity).stats.shotSpread === 1) {
          pushProj(dir.x, dir.y);
      } else {
          const angle = Math.atan2(dir.y, dir.x);
          const spreadRad = 15 * (Math.PI / 180);
          const pStats = (owner as PlayerEntity).stats;
          if (pStats.shotSpread === 3) {
              const angles = [angle - spreadRad, angle, angle + spreadRad];
              angles.forEach(a => pushProj(Math.cos(a), Math.sin(a)));
          }
          else if (pStats.shotSpread === 4) {
              const angles = [angle - spreadRad * 1.5, angle - spreadRad * 0.5, angle + spreadRad * 0.5, angle + spreadRad * 1.5];
              angles.forEach(a => pushProj(Math.cos(a), Math.sin(a)));
          }
      }
  }

  spawnRemoteProjectile(x: number, y: number, dir: Vector2, characterId: string) {
      const char = CHARACTERS.find(c => c.id === characterId) || CHARACTERS[0];
      const stats = char.baseStats;
      const speed = stats.shotSpeed;
      const damage = stats.damage;
      const knockback = stats.knockback;
      let baseSize = CONSTANTS.PROJECTILE_SIZE;
      const dmgFactor = Math.max(1, damage / 3.5);
      baseSize = baseSize * dmgFactor;
      baseSize *= stats.bulletScale;
      const range = stats.range;

      this.entities.push({
          id: uuid(),
          type: EntityType.PROJECTILE,
          x: x - baseSize / 2,
          y: y - baseSize / 2,
          w: baseSize,
          h: baseSize,
          velocity: { x: dir.x * speed, y: dir.y * speed },
          knockbackVelocity: { x: 0, y: 0 },
          color: CONSTANTS.COLORS.PROJECTILE_FRIENDLY,
          markedForDeletion: false,
          ownerId: 'remote',
          damage,
          knockback,
          lifeTime: range,
          visualZ: 10,
          fxOnly: true
      } as ProjectileEntity);
  }

  updateProjectile(p: ProjectileEntity) {
      p.x += p.velocity.x;
      p.y += p.velocity.y;
      p.lifeTime -= Math.abs(p.velocity.x) + Math.abs(p.velocity.y); 
      if (p.lifeTime <= 0) {
          p.markedForDeletion = true;
          return;
      }
      if (this.checkWallCollision(p)) {
          p.markedForDeletion = true;
          return;
      }
      if (p.fxOnly) return;
      if (p.ownerId === 'player') {
           const enemies = this.entities.filter(e => e.type === EntityType.ENEMY);
           for (const enemy of enemies) {
               if (checkAABB(p, enemy)) {
                   p.markedForDeletion = true;
                   const hitDir = normalizeVector(p.velocity);
                   this.damageEnemy(enemy as EnemyEntity, p.damage, p.knockback, hitDir);
                   return;
               }
           }
      } else {
          if (checkAABB(p, this.player)) {
              p.markedForDeletion = true;
              const hitDir = normalizeVector(p.velocity);
              this.damagePlayer(1, 10, hitDir); 
          }
      }
  }

  updateEnemy(e: EnemyEntity) {
      e.timer++;
      const distToPlayer = distance(e, this.player);
      const speed = e.stats.speed;

      if (e.enemyType === EnemyType.BOSS) {
          this.updateBoss(e, distToPlayer);
          return;
      }

      if (this.updateSpecialEnemy(e, distToPlayer)) {
          return;
      }

      if (e.enemyType === EnemyType.CHASER) {
          if (e.timer % 5 === 0) {
            const dir = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
            e.velocity = { x: dir.x * speed, y: dir.y * speed };
          }
      } 
      else if (e.enemyType === EnemyType.TANK) {
          if (e.timer % 10 === 0) {
             const dir = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
             e.velocity = { x: dir.x * speed, y: dir.y * speed };
          }
      }
      else if (e.enemyType === EnemyType.ORBITER) {
          if (!e.orbitAngle) e.orbitAngle = 0;
          e.orbitAngle += 0.02 * (speed / 0.1);
          const orbitDist = 150;
          const targetX = this.player.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = this.player.y + Math.sin(e.orbitAngle) * orbitDist;
          const dx = targetX - e.x;
          const dy = targetY - e.y;
          e.velocity = { x: dx * 0.05 * (speed / 0.1), y: dy * 0.05 * (speed / 0.1) };
      }
      else if (e.enemyType === EnemyType.SHOOTER) {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0 && distToPlayer < e.stats.range) {
              const dir = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
              this.spawnProjectile(e, dir);
          }
      } else if (e.enemyType === EnemyType.DASHER) {
          if (e.aiState === 'IDLE') {
              e.velocity = {x:0,y:0};
              const waitTime = Math.floor(60 / (speed / 0.1));
              if (e.timer > waitTime) {
                  e.aiState = 'ATTACK';
                  e.timer = 0;
                  const dir = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
                  e.velocity = { x: dir.x * speed * 4, y: dir.y * speed * 4 }; 
              }
          }
      }
  }

  updateSpecialEnemy(e: EnemyEntity, distToPlayer: number): boolean {
      const id = e.enemyId;
      if (!id) return false;
      const toPlayer = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
      const speed = e.stats.speed;

      if (id === 'mantis') {
          const cycle = scaleEnemyShootInterval(80);
          const fireTick = scaleEnemyShootInterval(10);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 3, y: toPlayer.y * speed * 3 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireSpreadShots(e, toPlayer, 3, 0.3);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'wisp') {
          if (!e.orbitAngle) e.orbitAngle = 0;
          e.orbitAngle += 0.03;
          const orbitDist = 140;
          const targetX = this.player.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = this.player.y + Math.sin(e.orbitAngle) * orbitDist;
          const dir = normalizeVector({ x: targetX - e.x, y: targetY - e.y });
          e.velocity = { x: dir.x * speed, y: dir.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 6, e.orbitAngle);
          }
          return true;
      }

      if (id === 'turtle') {
          if (distToPlayer > 80) {
              e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          } else {
              e.velocity = { x: 0, y: 0 };
          }
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 4, Math.PI / 4);
          }
          return true;
      }

      if (id === 'slug') {
          e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 2, 0.45);
          }
          if (e.timer % scaleEnemyShootInterval(200) === 0 && distToPlayer < 120) {
              this.fireRadialShots(e, 6, 0);
          }
          return true;
      }

      if (id === 'beetle') {
          if (!e.orbitAngle) e.orbitAngle = 0;
          e.orbitAngle += 0.04;
          const orbitDist = 120;
          const targetX = this.player.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = this.player.y + Math.sin(e.orbitAngle) * orbitDist;
          const dir = normalizeVector({ x: targetX - e.x, y: targetY - e.y });
          e.velocity = { x: dir.x * speed, y: dir.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.spawnProjectile(e, toPlayer);
          }
          if (e.timer % scaleEnemyShootInterval(180) === 0) {
              this.fireRadialShots(e, 6, e.orbitAngle);
          }
          return true;
      }

      if (id === 'drone') {
          const perp = normalizeVector({ x: -toPlayer.y, y: toPlayer.x });
          e.velocity = { x: perp.x * speed, y: perp.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 3, 0.2);
          }
          return true;
      }

      if (id === 'sentry') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 3, 0.3);
          }
          return true;
      }

      if (id === 'burrower') {
          const cycle = scaleEnemyShootInterval(90);
          const fireTick = scaleEnemyShootInterval(30);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 4, y: toPlayer.y * speed * 4 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireRadialShots(e, 6, Math.PI / 6);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'blossom') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 8, Math.PI / 8);
          }
          if (e.timer % scaleEnemyShootInterval(240) === 0) {
              this.fireRadialShots(e, 12, 0);
          }
          return true;
      }

      if (id === 'voidling') {
          const zig = Math.sin(e.timer * 0.2);
          const strafe = normalizeVector({ x: -toPlayer.y, y: toPlayer.x });
          e.velocity = {
              x: (toPlayer.x + strafe.x * zig * 0.6) * speed,
              y: (toPlayer.y + strafe.y * zig * 0.6) * speed
          };
          if (e.timer % e.stats.fireRate === 0 && distToPlayer < e.stats.range) {
              this.spawnProjectile(e, toPlayer);
          }
          return true;
      }

      if (id === 'shardling') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 5, 0.22);
          }
          if (e.timer % scaleEnemyShootInterval(240) === 0) {
              this.fireRadialShots(e, 6, Math.PI / 6);
          }
          return true;
      }

      if (id === 'lantern') {
          if (!e.orbitAngle) e.orbitAngle = 0;
          e.orbitAngle += 0.025;
          const orbitDist = 170;
          const targetX = this.player.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = this.player.y + Math.sin(e.orbitAngle) * orbitDist;
          const dir = normalizeVector({ x: targetX - e.x, y: targetY - e.y });
          e.velocity = { x: dir.x * speed, y: dir.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 5, e.orbitAngle);
          }
          return true;
      }

      if (id === 'stalker') {
          const cycle = scaleEnemyShootInterval(90);
          const fireTick = scaleEnemyShootInterval(15);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 2.5, y: toPlayer.y * speed * 2.5 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireSpreadShots(e, toPlayer, 3, 0.35);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'toad') {
          const cycle = scaleEnemyShootInterval(120);
          const fireTick = scaleEnemyShootInterval(20);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 3, y: toPlayer.y * speed * 3 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireRadialShots(e, 6, Math.PI / 6);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'mimic') {
          const cycle = scaleEnemyShootInterval(140);
          const fireTick = scaleEnemyShootInterval(10);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 3.2, y: toPlayer.y * speed * 3.2 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireSpreadShots(e, toPlayer, 4, 0.25);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'charger') {
          const cycle = scaleEnemyShootInterval(70);
          const fireTick = scaleEnemyShootInterval(12);
          if (e.timer % cycle === 0) {
              e.aiState = 'ATTACK';
              e.velocity = { x: toPlayer.x * speed * 4, y: toPlayer.y * speed * 4 };
          }
          if (e.timer % cycle === fireTick) {
              this.fireRadialShots(e, 4, Math.PI / 4);
              e.aiState = 'IDLE';
          }
          return true;
      }

      if (id === 'spire') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              this.spawnProjectile(e, toPlayer);
              this.fireRadialShots(e, 4, Math.PI / 4);
          }
          return true;
      }

      if (id === 'glider') {
          if (!e.orbitAngle) e.orbitAngle = 0;
          e.orbitAngle += 0.05;
          const orbitDist = 140;
          const targetX = this.player.x + Math.cos(e.orbitAngle) * orbitDist;
          const targetY = this.player.y + Math.sin(e.orbitAngle) * orbitDist;
          const dir = normalizeVector({ x: targetX - e.x, y: targetY - e.y });
          e.velocity = { x: dir.x * speed, y: dir.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 2, 0.2);
          }
          return true;
      }

      if (id === 'brute') {
          if (distToPlayer > 70) {
              e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          } else {
              e.velocity = { x: 0, y: 0 };
          }
          if (e.timer % scaleEnemyShootInterval(200) === 0) {
              this.fireRadialShots(e, 8, 0);
          }
          return true;
      }

      if (id === 'seedling') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 4, 0);
          }
          if (e.timer % scaleEnemyShootInterval(240) === 0) {
              this.fireRadialShots(e, 6, Math.PI / 6);
          }
          return true;
      }

      return false;
  }

  fireRadialShots(owner: EnemyEntity, count: number, angleOffset: number = 0) {
      const step = (Math.PI * 2) / count;
      for (let i = 0; i < count; i++) {
          const a = angleOffset + i * step;
          this.spawnProjectile(owner, { x: Math.cos(a), y: Math.sin(a) });
      }
  }

  fireSpreadShots(owner: EnemyEntity, dir: Vector2, count: number, spreadRad: number) {
      const base = Math.atan2(dir.y, dir.x);
      if (count <= 1) {
          this.spawnProjectile(owner, dir);
          return;
      }
      const start = base - (spreadRad * (count - 1)) / 2;
      for (let i = 0; i < count; i++) {
          const a = start + i * spreadRad;
          this.spawnProjectile(owner, { x: Math.cos(a), y: Math.sin(a) });
      }
  }

  updateBoss(e: EnemyEntity, distToPlayer: number) {
      const bossId = e.bossId || 'boss_skull';
      const toPlayer = normalizeVector({ x: this.player.x - e.x, y: this.player.y - e.y });
      const speed = e.stats.speed;

      if (bossId === 'boss_skull') {
          if (e.timer % 6 === 0) {
              e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          }
          if (e.timer % e.stats.fireRate === 0 && distToPlayer < e.stats.range) {
              this.spawnProjectile(e, toPlayer);
          }
          return;
      }

      if (bossId === 'boss_wyrm') {
          e.bossSpin = (e.bossSpin || 0) + 0.03;
          const orbitDist = 160;
          const targetX = this.player.x + Math.cos(e.bossSpin) * orbitDist;
          const targetY = this.player.y + Math.sin(e.bossSpin) * orbitDist;
          const dir = normalizeVector({ x: targetX - e.x, y: targetY - e.y });
          e.velocity = { x: dir.x * speed, y: dir.y * speed };
          if (e.timer % e.stats.fireRate === 0) {
              this.fireSpreadShots(e, toPlayer, 3, 0.25);
          }
          if (e.timer % 240 === 0) {
              this.fireRadialShots(e, 8, e.bossSpin || 0);
          }
          return;
      }

      if (bossId === 'boss_monk') {
          if (distToPlayer > 120) {
              e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          } else {
              e.velocity = { x: 0, y: 0 };
          }
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 8, 0);
          }
          if (e.timer % 300 === 0) {
              this.fireRadialShots(e, 16, Math.PI / 16);
          }
          return;
      }

      if (bossId === 'boss_reaper') {
          if (e.aiState === 'IDLE') {
              e.velocity = { x: 0, y: 0 };
              if (e.timer > 60) {
                  e.aiState = 'ATTACK';
                  e.timer = 0;
                  e.velocity = { x: toPlayer.x * speed * 4, y: toPlayer.y * speed * 4 };
              }
          } else if (e.aiState === 'ATTACK') {
              if (e.timer > 15) {
                  e.aiState = 'COOLDOWN';
                  e.timer = 0;
                  this.fireRadialShots(e, 4, Math.PI / 4);
              }
          } else if (e.aiState === 'COOLDOWN') {
              e.velocity = { x: 0, y: 0 };
              if (e.timer > 30) {
                  e.aiState = 'IDLE';
                  e.timer = 0;
              }
          }
          if (e.timer % 90 === 0) {
              this.spawnProjectile(e, toPlayer);
          }
          return;
      }

      if (bossId === 'boss_nebula') {
          const minDist = 140;
          const maxDist = 260;
          if (distToPlayer < minDist) {
              e.velocity = { x: -toPlayer.x * speed, y: -toPlayer.y * speed };
          } else if (distToPlayer > maxDist) {
              e.velocity = { x: toPlayer.x * speed, y: toPlayer.y * speed };
          } else {
              e.velocity = { x: 0, y: 0 };
          }
          e.bossSpin = (e.bossSpin || 0) + 0.1;
          if (e.timer % 6 === 0) {
              this.spawnProjectile(e, { x: Math.cos(e.bossSpin), y: Math.sin(e.bossSpin) });
          }
          if (e.timer % e.stats.fireRate === 0) {
              this.fireRadialShots(e, 6, e.bossSpin || 0);
          }
          return;
      }

      if (bossId === 'boss_obelisk') {
          e.velocity = { x: 0, y: 0 };
          if (e.timer % e.stats.fireRate === 0) {
              const phase = (e.bossPhase || 0) % 2;
              if (phase === 0) {
                  this.fireRadialShots(e, 4, Math.PI / 4);
              } else {
                  this.fireRadialShots(e, 8, Math.PI / 8);
              }
              e.bossPhase = (e.bossPhase || 0) + 1;
          }
          if (e.timer % 240 === 0) {
              this.fireRadialShots(e, 12, 0);
          }
          return;
      }
  }

  // --- Implementation of missing physics methods ---

  resolveWallCollision(ent: Entity) {
      // 1. Apply Velocity in X
      const oldX = ent.x;
      ent.x += ent.velocity.x;
      // 2. Check X Collision
      if (this.checkCollision(ent)) {
          ent.x = oldX; // Revert
          ent.velocity.x = 0;
      }

      // 3. Apply Velocity in Y
      const oldY = ent.y;
      ent.y += ent.velocity.y;
      // 4. Check Y Collision
      if (this.checkCollision(ent)) {
          ent.y = oldY; // Revert
          ent.velocity.y = 0;
      }
  }

  checkCollision(ent: Entity): boolean {
      if (!this.currentRoom) return false;
      const layout = this.currentRoom.layout;
      const ts = CONSTANTS.TILE_SIZE;
      const doorOpen = this.currentRoom.doorAnim?.state === 'open' || (!this.currentRoom.doorAnim && this.currentRoom.cleared);
      
      const startX = Math.floor(ent.x / ts);
      const endX = Math.floor((ent.x + ent.w - 0.01) / ts);
      const startY = Math.floor(ent.y / ts);
      const endY = Math.floor((ent.y + ent.h - 0.01) / ts);
      
      for (let y = startY; y <= endY; y++) {
          for (let x = startX; x <= endX; x++) {
              // Out of bounds is solid
              if (y < 0 || y >= layout.length || x < 0 || x >= layout[0].length) return true;
              const tile = layout[y][x];
              // 1 = Wall, 2 = Rock
              if (tile === 1 || tile === 2) return true;
              if (tile === 3 && !doorOpen) return true;
          }
      }

      // Check against obstacles (Dynamic)
      for (const e of this.entities) {
          if (e.type === EntityType.OBSTACLE) {
              if (checkAABB(ent, e)) return true;
          }
      }
      return false;
  }

  checkWallCollision(ent: Entity): boolean {
      return this.checkCollision(ent);
  }

  checkDoorCollisions() {
      if (!this.currentRoom || this.currentRoom.doorAnim?.state !== 'open') return;
      const ts = CONSTANTS.TILE_SIZE;
      const cx = this.player.x + this.player.w / 2;
      const cy = this.player.y + this.player.h / 2;
      
      const tx = Math.floor(cx / ts);
      const ty = Math.floor(cy / ts);
      
      if (ty < 0 || ty >= this.currentRoom.layout.length || tx < 0 || tx >= this.currentRoom.layout[0].length) return;
      
      const tile = this.currentRoom.layout[ty][tx];
      if (tile === 3) {
          // Determine Direction
          let dir: Direction | null = null;
          const h = this.currentRoom.layout.length;
          const w = this.currentRoom.layout[0].length;
          
          if (ty === 0) dir = Direction.UP;
          else if (ty === h - 1) dir = Direction.DOWN;
          else if (tx === 0) dir = Direction.LEFT;
          else if (tx === w - 1) dir = Direction.RIGHT;
          
          if (dir) {
              const dx = dir === Direction.RIGHT ? 1 : dir === Direction.LEFT ? -1 : 0;
              const dy = dir === Direction.DOWN ? 1 : dir === Direction.UP ? -1 : 0;
              const nextRoom = this.dungeon.find(r => r.x === this.currentRoom!.x + dx && r.y === this.currentRoom!.y + dy);
              if (nextRoom) {
                  if (nextRoom.type === 'CHEST' && this.floorLevel > 1) {
                      if (this.player.keys <= 0) return;
                      this.player.keys = Math.max(0, this.player.keys - 1);
                  }
                  this.enterRoom(nextRoom, dir);
              }
          }
      }
  }

  collectItem(item: ItemEntity) {
      if (item.markedForDeletion) return;
      
      const config = ITEMS.find(i => i.type === item.itemType) || DROPS.find(d => d.type === item.itemType);
      if (!config) return;

      item.markedForDeletion = true;
      if (item.choiceGroupId) {
           this.entities.forEach(e => {
               if (e.type === EntityType.ITEM && (e as ItemEntity).choiceGroupId === item.choiceGroupId) {
                   e.markedForDeletion = true;
               }
           });
      }

      if (item.itemType === ItemType.KEY) {
          this.player.keys = Math.min(99, this.player.keys + 1);
          this.notification = item.name;
          this.notificationTimer = 120;
          return;
      }

      if (item.itemType === ItemType.BOMB) {
          this.player.bombs = Math.min(99, this.player.bombs + 1);
          this.notification = item.name;
          this.notificationTimer = 120;
          return;
      }

      // Pickup vs Inventory
      if (!config.isPickup) {
          this.player.inventory.push(item.itemType);
          this.notification = item.name;
          this.notificationTimer = 120;
      }

      // Apply Stats
      const s = config.stats;
      const pStats = this.player.stats;
      
      if (s.maxHp) { pStats.maxHp += s.maxHp; pStats.hp += s.maxHp; }
      if (s.hp) { pStats.hp = Math.min(pStats.maxHp, pStats.hp + s.hp); }
      if (s.speed) pStats.speed += s.speed;
      if (s.damage) pStats.damage *= s.damage;
      if (s.fireRate) pStats.fireRate *= s.fireRate;
      if (s.shotSpeed) pStats.shotSpeed += s.shotSpeed;
      if (s.range) pStats.range *= s.range;
      if (s.bulletScale) pStats.bulletScale += s.bulletScale;
      if (s.knockback) pStats.knockback *= s.knockback;
      if (s.shotSpread) pStats.shotSpread = s.shotSpread;

      if (item.costHearts && item.costHearts > 0) {
          pStats.maxHp = Math.max(1, pStats.maxHp - item.costHearts);
          pStats.hp = Math.min(pStats.hp, pStats.maxHp);
      }

      // Safe guards
      if (pStats.maxHp < 1) pStats.maxHp = 1;
      if (pStats.hp > pStats.maxHp) pStats.hp = pStats.maxHp;
      if (pStats.fireRate < 5) pStats.fireRate = 5;
  }

  damageEnemy(enemy: EnemyEntity, damage: number, knockback: number, hitDir: Vector2) {
      enemy.hp -= damage;
      enemy.flashTimer = 5;
      
      if (enemy.enemyType !== EnemyType.BOSS) {
          enemy.knockbackVelocity.x += hitDir.x * knockback * 8;
          enemy.knockbackVelocity.y += hitDir.y * knockback * 8;
      }
      
      if (enemy.hp <= 0) {
          enemy.markedForDeletion = true;
          this.score += 10 + (enemy.enemyType === EnemyType.BOSS ? 500 : 0);
          
          if (Math.random() < 0.05) {
              this.spawnPickup(enemy.x + enemy.w/2, enemy.y + enemy.h/2);
          }

          const keyDropChance = enemy.enemyType === EnemyType.BOSS ? 0.2 : 0.1;
          if (Math.random() < keyDropChance) {
              this.spawnKey(enemy.x + enemy.w/2, enemy.y + enemy.h/2);
          }

          const bombDropChance = enemy.enemyType === EnemyType.BOSS ? 0.2 : 0.1;
          if (Math.random() < bombDropChance) {
              this.spawnBombPickup(enemy.x + enemy.w/2, enemy.y + enemy.h/2);
          }
      }
  }

  damagePlayer(damage: number, knockback: number, hitDir: Vector2) {
      if (this.player.invincibleTimer > 0) return;
      this.player.stats.hp -= damage;
      this.player.invincibleTimer = 60;
      this.player.flashTimer = 10;
      
      this.player.knockbackVelocity.x += hitDir.x * knockback * 4;
      this.player.knockbackVelocity.y += hitDir.y * knockback * 4;
      
      if (this.player.stats.hp <= 0) {
          this.status = GameStatus.GAME_OVER;
      }
  }
}
