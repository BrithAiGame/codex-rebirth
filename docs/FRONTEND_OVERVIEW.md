# Frontend Rendering And Gameplay Overview

This document summarizes the current frontend rendering architecture and gameplay rules
based on the code in this repository. It is intended for engineers extending the client
or building compatible services.

## 1. Runtime Stack

- React + Vite for UI and state handling.
- Three.js via @react-three/fiber for 3D scene rendering.
- Game logic is in a headless engine (`GameEngine`) that exposes state to React.
- UI and game loop are separated: React renders HUD/menus; Three.js renders world.

## 2. Core Modules

- `game.ts`
  - Authoritative client simulation of gameplay.
  - Manages player, enemies, projectiles, items, bombs, room transitions.
  - Exposes `getUiState()` to drive HUD and menus.
- `Renderer3D.tsx`
  - Renders tile-based rooms and 3D voxel meshes for entities.
  - Draws doors, trapdoors, and visual effects.
- `dungeon.ts`
  - Procedural dungeon layout generator with room types and themes.
  - Supports special rooms (start, boss, item, chest, devil, hidden).
- `App.tsx`
  - Input handling, menu system, settings, and heads-up display.
  - Owns the frame loop (`GameLoop`) and UI transitions.

## 3. Game States (Main Flow)

- `MENU`
  - Main menu with Start / Online / Settings.
- `CHARACTER_SELECT`
  - Choose character and difficulty.
- `ONLINE`
  - Mock flow; not real networked play yet.
- `PLAYING`
  - In-game. Input is passed to `GameEngine.update()`.
- `PAUSED`
  - Paused overlay and settings.
- `GAME_OVER` / `VICTORY`
  - End of run.

## 4. Room Generation And Layout

Rooms are laid out on a virtual grid using BFS/random walk.

Room types:
- START: spawn room (always safe).
- NORMAL: standard combat room.
- ITEM: item reward room.
- BOSS: boss encounter, yields trapdoor + 2 reward items.
- CHEST: treasure room (locked by key from floor 2+).
- DEVIL: sacrifice room with 1-4 items and heart cost.
- HIDDEN: not visible on minimap until entered; no doors by default.

Important rules:
- Boss room is chosen as the farthest non-start room (distance >= 2).
- Chest room prefers leaf rooms (degree = 1).
- Devil room appears with ~33% chance.
- Hidden room: placed in L-corner gap between rooms. No doors initially.

Room themes:
- Floors 1-5: single theme for the whole floor.
- Floor 6+: each room has a random theme.
- UI displays floor as "第 n 层 [主题名]" (6+ uses "???").

## 5. Entities And Physics

Entity categories:
- Player
- Enemy
- Projectile
- Item (includes pickups, devil items, keys, bombs)
- Obstacle (rocks)
- Door (internal tile)
- Trapdoor
- Bomb
- Pedestal

Collision:
- Walls and rocks are tile-based (1 = wall, 2 = rock).
- Door tiles use tile id 3; collision depends on door state.
- Obstacles are currently simple cubes in the tile map.

Doors:
- Doors close on entry into uncleared combat rooms.
- Doors open when room is cleared.
- Doors can be forced open by bombs.
- Doors display indicator color:
  - Green = passable
  - Red = locked by enemies or no key for treasure room
  - Gold = chest room door (when passable)

## 6. Player Rules

Stats:
- HP / Max HP
- Speed
- Damage
- Fire Rate (cooldown frames; lower is faster)
- Shot Speed
- Range
- Shot Spread
- Bullet Scale
- Knockback

Starting inventory:
- Keys = 1
- Bombs = 1

Movement:
- WASD by default.
Shoot:
- Arrow keys by default, 4-direction only.

Bombs:
- Default key: E.
- Places bomb at player feet.
- Explodes after 3 seconds:
  - Damages player (1 HP) if in radius.
  - Destroys rocks (tile id 2) and obstacle entities in radius.
  - Forces nearby doors to open.
  - If adjacent to a hidden room wall, it opens a permanent hole.

Keys:
- Chest rooms require 1 key on floor >= 2.
- Key is consumed when entering a chest room.

## 7. Enemies And Combat

Enemies are defined in `config/enemies.ts` and spawned by floor level.
Boss variants are defined in `config/bosses.ts`.

Difficulty:
- Normal: default stats.
- Hard: enemy HP, speed, damage, shot speed, and range * 3.
- Fire rate scales with difficulty, with minimum clamp.

Drops:
- Hearts: 5% chance on enemy death.
- Keys: 10% on normal enemies, 20% on bosses.
- Bombs: 10% on normal enemies, 20% on bosses.

## 8. Items And Rooms

Item rooms:
- Spawn one random item on a pedestal.

Chest rooms:
- Spawn one random item, always safe.

Devil rooms:
- Spawn 1-4 items with random heart cost (1-3 hearts).
- Taking an item reduces max HP by cost.

Boss rooms:
- On clear: spawn trapdoor and two reward items (choose one).

## 9. HUD And UI

HUD:
- Left side stat pills with emoji: fire rate, range, speed, knockback, keys, bombs.
- Top center: floor and theme label, score.
- Hearts: rendered as pixel heart icons.

Minimap:
- Hidden rooms are not displayed until visited.
- After entering a hidden room, it appears as "?" on the minimap.

Menus:
- Full keyboard navigation (arrows + Enter/Space).
- Online menu is currently mock only.

## 10. Visual Effects

- Voxel-style character/enemy models.
- Particle trails for bullets and hit feedback.
- Bomb explosions produce large multi-color particle bursts and shock rings.
- Screen flash and camera shake when bomb explodes.

