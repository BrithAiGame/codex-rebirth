
import * as THREE from 'three';
import { CONSTANTS } from './constants';
import { SPRITES } from './sprites';

export type SpriteName = keyof typeof SPRITES;

export class AssetLoader {
  // Store Three.js Textures instead of HTMLCanvasElement
  textures: Record<string, THREE.CanvasTexture> = {};
  
  // Keep raw canvases for UI previews if needed, or we can just use the image source of texture
  rawCanvases: Record<string, HTMLCanvasElement> = {};

  constructor() {
    this.generateAssets();
  }

  // Draw a 16x16 grid definition onto a canvas of arbitrary size (scaled)
  createCanvas(matrix: number[][], palette: string[], size: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    
    // Pixel size relative to destination
    const px = size / 16; 

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const val = matrix[y][x];
        if (val > 0) {
          ctx.fillStyle = palette[val];
          // Overlap slightly to prevent sub-pixel gaps
          ctx.fillRect(x * px, y * px, px + 0.5, px + 0.5); 
        }
      }
    }
    return canvas;
  }
  
  // Convert Canvas to THREE Texture with Pixel settings
  toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
      const tex = new THREE.CanvasTexture(canvas);
      tex.magFilter = THREE.NearestFilter; // Critical for Pixel Art look
      tex.minFilter = THREE.NearestFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
  }

  createCircleSprite(radius: number, color: string, core: string): HTMLCanvasElement {
      const size = radius * 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      
      // Outer
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(radius, radius, radius, 0, Math.PI*2);
      ctx.fill();
      
      // Core
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(radius, radius, radius * 0.5, 0, Math.PI*2);
      ctx.fill();
      
      return canvas;
  }
  
  createFlashTexture(source: HTMLCanvasElement): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = source.width;
    canvas.height = source.height;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, 0, 0);
    ctx.globalCompositeOperation = 'source-in';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    return canvas;
  }

  generateAssets() {
    const P = CONSTANTS.PALETTE;

    const register = (name: string, canvas: HTMLCanvasElement) => {
        this.rawCanvases[name] = canvas;
        this.textures[name] = this.toTexture(canvas);
    };

    // Walls
    register('WALL', this.createCanvas(SPRITES.WALL, 
      ['', P.WALL_BASE, P.WALL_HIGHLIGHT, P.WALL_SHADOW], CONSTANTS.TILE_SIZE));
      
    // Floor
    register('FLOOR', this.createCanvas(SPRITES.FLOOR,
      ['', P.FLOOR_BASE, P.FLOOR_VAR_1, P.FLOOR_VAR_2], CONSTANTS.TILE_SIZE));

    // Obstacles
    register('ROCK', this.createCanvas(SPRITES.ROCK,
      ['', P.ROCK_BASE, P.ROCK_HIGHLIGHT, '#000000'], CONSTANTS.TILE_SIZE));

    // Player Characters
    register('PLAYER', this.createCanvas(SPRITES.PLAYER,
      ['', P.PLAYER_MAIN, P.PLAYER_SHADOW, P.PLAYER_SKIN], CONSTANTS.PLAYER_SIZE));
      
    register('PLAYER_TANK', this.createCanvas(SPRITES.PLAYER_TANK,
      ['', '#15803d', '#14532d', '#86efac'], CONSTANTS.PLAYER_SIZE)); 

    register('PLAYER_ROGUE', this.createCanvas(SPRITES.PLAYER_ROGUE,
      ['', '#eab308', '#a16207', '#fef08a'], CONSTANTS.PLAYER_SIZE));

    register('PLAYER_MAGE', this.createCanvas(SPRITES.PLAYER_MAGE,
      ['', '#a855f7', '#7e22ce', '#e9d5ff'], CONSTANTS.PLAYER_SIZE));

    register('PLAYER_SNIPER', this.createCanvas(SPRITES.PLAYER_SNIPER,
      ['', '#3b82f6', '#1e40af', '#60a5fa'], CONSTANTS.PLAYER_SIZE));

    register('PLAYER_SWARM', this.createCanvas(SPRITES.PLAYER_SWARM,
      ['', '#ef4444', '#991b1b', '#fca5a5'], CONSTANTS.PLAYER_SIZE));

    register('PLAYER_VOID', this.createCanvas(SPRITES.PLAYER_VOID,
      ['', '#171717', '#0a0a0a', '#404040'], CONSTANTS.PLAYER_SIZE));

    // Enemies
    register('ENEMY_CHASER', this.createCanvas(SPRITES.ENEMY_CHASER,
      ['', P.ENEMY_RED_MAIN, P.ENEMY_RED_DARK, '#ffffff'], CONSTANTS.ENEMY_SIZE));
      
    register('ENEMY_SHOOTER', this.createCanvas(SPRITES.ENEMY_SHOOTER,
      ['', P.ENEMY_BLUE_MAIN, P.ENEMY_BLUE_DARK, '#ffffff'], CONSTANTS.ENEMY_SIZE));

    register('ENEMY_TANK', this.createCanvas(SPRITES.ENEMY_TANK,
      ['', P.ENEMY_GREEN_MAIN, P.ENEMY_GREEN_DARK, '#000000'], CONSTANTS.ENEMY_SIZE * 1.25));

    register('ENEMY_BOSS', this.createCanvas(SPRITES.BOSS,
      ['', P.BOSS_MAIN, P.BOSS_HIGHLIGHT, '#000000'], 80));

    register('ENEMY_MANTIS', this.createCanvas(SPRITES.ENEMY_MANTIS,
      ['', P.ENEMY_MANTIS_MAIN, P.ENEMY_MANTIS_DARK, P.ENEMY_MANTIS_HIGHLIGHT], 34));

    register('ENEMY_WISP', this.createCanvas(SPRITES.ENEMY_WISP,
      ['', P.ENEMY_WISP_MAIN, P.ENEMY_WISP_DARK, P.ENEMY_WISP_HIGHLIGHT], 30));

    register('ENEMY_TURTLE', this.createCanvas(SPRITES.ENEMY_TURTLE,
      ['', P.ENEMY_TURTLE_MAIN, P.ENEMY_TURTLE_DARK, P.ENEMY_TURTLE_HIGHLIGHT], 38));

    register('ENEMY_SLUG', this.createCanvas(SPRITES.ENEMY_SLUG,
      ['', P.ENEMY_SLUG_MAIN, P.ENEMY_SLUG_DARK, P.ENEMY_SLUG_HIGHLIGHT], 36));

    register('ENEMY_BEETLE', this.createCanvas(SPRITES.ENEMY_BEETLE,
      ['', P.ENEMY_BEETLE_MAIN, P.ENEMY_BEETLE_DARK, P.ENEMY_BEETLE_HIGHLIGHT], 32));

    register('ENEMY_DRONE', this.createCanvas(SPRITES.ENEMY_DRONE,
      ['', P.ENEMY_DRONE_MAIN, P.ENEMY_DRONE_DARK, P.ENEMY_DRONE_HIGHLIGHT], 28));

    register('ENEMY_SENTRY', this.createCanvas(SPRITES.ENEMY_SENTRY,
      ['', P.ENEMY_SENTRY_MAIN, P.ENEMY_SENTRY_DARK, P.ENEMY_SENTRY_HIGHLIGHT], 30));

    register('ENEMY_BURROWER', this.createCanvas(SPRITES.ENEMY_BURROWER,
      ['', P.ENEMY_BURROWER_MAIN, P.ENEMY_BURROWER_DARK, P.ENEMY_BURROWER_HIGHLIGHT], 34));

    register('ENEMY_BLOSSOM', this.createCanvas(SPRITES.ENEMY_BLOSSOM,
      ['', P.ENEMY_BLOSSOM_MAIN, P.ENEMY_BLOSSOM_DARK, P.ENEMY_BLOSSOM_HIGHLIGHT], 36));

    register('ENEMY_VOIDLING', this.createCanvas(SPRITES.ENEMY_VOIDLING,
      ['', P.ENEMY_VOIDLING_MAIN, P.ENEMY_VOIDLING_DARK, P.ENEMY_VOIDLING_HIGHLIGHT], 26));

    register('ENEMY_SHARDLING', this.createCanvas(SPRITES.ENEMY_SHARDLING,
      ['', P.ENEMY_SHARDLING_MAIN, P.ENEMY_SHARDLING_DARK, P.ENEMY_SHARDLING_HIGHLIGHT], 28));

    register('ENEMY_LANTERN', this.createCanvas(SPRITES.ENEMY_LANTERN,
      ['', P.ENEMY_LANTERN_MAIN, P.ENEMY_LANTERN_DARK, P.ENEMY_LANTERN_HIGHLIGHT], 30));

    register('ENEMY_STALKER', this.createCanvas(SPRITES.ENEMY_STALKER,
      ['', P.ENEMY_STALKER_MAIN, P.ENEMY_STALKER_DARK, P.ENEMY_STALKER_HIGHLIGHT], 32));

    register('ENEMY_TOAD', this.createCanvas(SPRITES.ENEMY_TOAD,
      ['', P.ENEMY_TOAD_MAIN, P.ENEMY_TOAD_DARK, P.ENEMY_TOAD_HIGHLIGHT], 40));

    register('ENEMY_MIMIC', this.createCanvas(SPRITES.ENEMY_MIMIC,
      ['', P.ENEMY_MIMIC_MAIN, P.ENEMY_MIMIC_DARK, P.ENEMY_MIMIC_HIGHLIGHT], 30));

    register('ENEMY_CHARGER', this.createCanvas(SPRITES.ENEMY_CHARGER,
      ['', P.ENEMY_CHARGER_MAIN, P.ENEMY_CHARGER_DARK, P.ENEMY_CHARGER_HIGHLIGHT], 34));

    register('ENEMY_SPIRE', this.createCanvas(SPRITES.ENEMY_SPIRE,
      ['', P.ENEMY_SPIRE_MAIN, P.ENEMY_SPIRE_DARK, P.ENEMY_SPIRE_HIGHLIGHT], 34));

    register('ENEMY_GLIDER', this.createCanvas(SPRITES.ENEMY_GLIDER,
      ['', P.ENEMY_GLIDER_MAIN, P.ENEMY_GLIDER_DARK, P.ENEMY_GLIDER_HIGHLIGHT], 30));

    register('ENEMY_BRUTE', this.createCanvas(SPRITES.ENEMY_BRUTE,
      ['', P.ENEMY_BRUTE_MAIN, P.ENEMY_BRUTE_DARK, P.ENEMY_BRUTE_HIGHLIGHT], 42));

    register('ENEMY_SEEDLING', this.createCanvas(SPRITES.ENEMY_SEEDLING,
      ['', P.ENEMY_SEEDLING_MAIN, P.ENEMY_SEEDLING_DARK, P.ENEMY_SEEDLING_HIGHLIGHT], 28));

    register('BOSS_SERPENT', this.createCanvas(SPRITES.BOSS_SERPENT,
      ['', P.BOSS_SERPENT_MAIN, P.BOSS_SERPENT_DARK, P.BOSS_SERPENT_HIGHLIGHT], 96));

    register('BOSS_MONK', this.createCanvas(SPRITES.BOSS_MONK,
      ['', P.BOSS_MONK_MAIN, P.BOSS_MONK_DARK, P.BOSS_MONK_HIGHLIGHT], 88));

    register('BOSS_REAPER', this.createCanvas(SPRITES.BOSS_REAPER,
      ['', P.BOSS_REAPER_MAIN, P.BOSS_REAPER_DARK, P.BOSS_REAPER_HIGHLIGHT], 72));

    register('BOSS_NEBULA', this.createCanvas(SPRITES.BOSS_NEBULA,
      ['', P.BOSS_NEBULA_MAIN, P.BOSS_NEBULA_DARK, P.BOSS_NEBULA_HIGHLIGHT], 84));

    register('BOSS_OBELISK', this.createCanvas(SPRITES.BOSS_OBELISK,
      ['', P.BOSS_OBELISK_MAIN, P.BOSS_OBELISK_DARK, P.BOSS_OBELISK_HIGHLIGHT], 100));

    // Items
    register('ITEM', this.createCanvas(SPRITES.ITEM_BOX,
      ['', P.ITEM_GOLD, P.ITEM_SHADOW, '#ffffff'], CONSTANTS.ITEM_SIZE));

    register('ITEM_MEAT', this.createCanvas(SPRITES.ITEM_MEAT,
      ['', '#fca5a5', '#dc2626', '#fef2f2'], CONSTANTS.ITEM_SIZE));
      
    register('ITEM_SWORD', this.createCanvas(SPRITES.ITEM_SWORD,
      ['', '#94a3b8', '#475569', '#e2e8f0'], CONSTANTS.ITEM_SIZE));

    register('ITEM_SYRINGE', this.createCanvas(SPRITES.ITEM_SYRINGE,
      ['', '#e0e7ff', '#ef4444', '#a5f3fc'], CONSTANTS.ITEM_SIZE));

    register('ITEM_MUG', this.createCanvas(SPRITES.ITEM_MUG,
      ['', '#78350f', '#92400e', '#451a03'], CONSTANTS.ITEM_SIZE));
    
    register('ITEM_SPRING', this.createCanvas(SPRITES.ITEM_SPRING,
      ['', '#9ca3af', '#4b5563', '#d1d5db'], CONSTANTS.ITEM_SIZE));

    register('ITEM_LENS', this.createCanvas(SPRITES.ITEM_LENS,
      ['', '#60a5fa', '#1e3a8a', '#93c5fd'], CONSTANTS.ITEM_SIZE));

    register('ITEM_EYE', this.createCanvas(SPRITES.ITEM_EYE,
      ['', '#fef3c7', '#d97706', '#000000'], CONSTANTS.ITEM_SIZE));

    // Pedestal  
    register('PEDESTAL', this.createCanvas(SPRITES.PEDESTAL,
      ['', P.PEDESTAL_TOP, P.PEDESTAL_SIDE, '#000000'], CONSTANTS.ITEM_SIZE));

    register('HEART', this.createCanvas(SPRITES.HEART,
      ['', P.HEART_MAIN, P.HEART_SHADOW, '#ffffff'], 16));
      
    // Projectiles
    register('PROJ_PLAYER', this.createCircleSprite(8, P.PROJ_PLAYER_MAIN, P.PROJ_PLAYER_CORE));
    register('PROJ_ENEMY', this.createCircleSprite(8, P.PROJ_ENEMY_MAIN, P.PROJ_ENEMY_CORE));
    
    // GENERATE FLASH VARIANTS
    const currentKeys = Object.keys(this.rawCanvases);
    for (const key of currentKeys) {
        const flashCanvas = this.createFlashTexture(this.rawCanvases[key]);
        register(key + '_FLASH', flashCanvas);
    }
  }

  // Get raw canvas for UI preview
  get(name: string): HTMLCanvasElement | null {
    return this.rawCanvases[name] || null;
  }

  // Get Texture for 3D
  getTexture(name: string): THREE.CanvasTexture | null {
      return this.textures[name] || null;
  }
}
