
import React, { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { GameEngine } from './game';
import { Entity, EntityType, PlayerEntity, EnemyEntity, ProjectileEntity, ItemEntity } from './types';
import { CONSTANTS } from './constants';
import * as THREE from 'three';
import { AssetLoader } from './assets';
import { ENEMIES, BOSSES } from './config/enemies';
import { ITEMS, DROPS } from './config/items';
import { CHARACTERS } from './config/characters';
import { SPRITES } from './sprites';
import { ROOM_THEMES } from './config/themes';

interface RendererProps {
  engine: GameEngine;
}

// CONSTANTS
const TILE_SIZE = CONSTANTS.TILE_SIZE;
const ROOM_WIDTH = 15;
const ROOM_HEIGHT = 9;

const ENEMY_VARIANTS: Record<string, { sprite: keyof typeof SPRITES; palette: string[] }> = {
    mantis: {
        sprite: 'ENEMY_MANTIS',
        palette: ['', CONSTANTS.PALETTE.ENEMY_MANTIS_MAIN, CONSTANTS.PALETTE.ENEMY_MANTIS_DARK, CONSTANTS.PALETTE.ENEMY_MANTIS_HIGHLIGHT]
    },
    wisp: {
        sprite: 'ENEMY_WISP',
        palette: ['', CONSTANTS.PALETTE.ENEMY_WISP_MAIN, CONSTANTS.PALETTE.ENEMY_WISP_DARK, CONSTANTS.PALETTE.ENEMY_WISP_HIGHLIGHT]
    },
    turtle: {
        sprite: 'ENEMY_TURTLE',
        palette: ['', CONSTANTS.PALETTE.ENEMY_TURTLE_MAIN, CONSTANTS.PALETTE.ENEMY_TURTLE_DARK, CONSTANTS.PALETTE.ENEMY_TURTLE_HIGHLIGHT]
    },
    slug: {
        sprite: 'ENEMY_SLUG',
        palette: ['', CONSTANTS.PALETTE.ENEMY_SLUG_MAIN, CONSTANTS.PALETTE.ENEMY_SLUG_DARK, CONSTANTS.PALETTE.ENEMY_SLUG_HIGHLIGHT]
    },
    beetle: {
        sprite: 'ENEMY_BEETLE',
        palette: ['', CONSTANTS.PALETTE.ENEMY_BEETLE_MAIN, CONSTANTS.PALETTE.ENEMY_BEETLE_DARK, CONSTANTS.PALETTE.ENEMY_BEETLE_HIGHLIGHT]
    },
    drone: {
        sprite: 'ENEMY_DRONE',
        palette: ['', CONSTANTS.PALETTE.ENEMY_DRONE_MAIN, CONSTANTS.PALETTE.ENEMY_DRONE_DARK, CONSTANTS.PALETTE.ENEMY_DRONE_HIGHLIGHT]
    },
    sentry: {
        sprite: 'ENEMY_SENTRY',
        palette: ['', CONSTANTS.PALETTE.ENEMY_SENTRY_MAIN, CONSTANTS.PALETTE.ENEMY_SENTRY_DARK, CONSTANTS.PALETTE.ENEMY_SENTRY_HIGHLIGHT]
    },
    burrower: {
        sprite: 'ENEMY_BURROWER',
        palette: ['', CONSTANTS.PALETTE.ENEMY_BURROWER_MAIN, CONSTANTS.PALETTE.ENEMY_BURROWER_DARK, CONSTANTS.PALETTE.ENEMY_BURROWER_HIGHLIGHT]
    },
    blossom: {
        sprite: 'ENEMY_BLOSSOM',
        palette: ['', CONSTANTS.PALETTE.ENEMY_BLOSSOM_MAIN, CONSTANTS.PALETTE.ENEMY_BLOSSOM_DARK, CONSTANTS.PALETTE.ENEMY_BLOSSOM_HIGHLIGHT]
    },
    voidling: {
        sprite: 'ENEMY_VOIDLING',
        palette: ['', CONSTANTS.PALETTE.ENEMY_VOIDLING_MAIN, CONSTANTS.PALETTE.ENEMY_VOIDLING_DARK, CONSTANTS.PALETTE.ENEMY_VOIDLING_HIGHLIGHT]
    },
    shardling: {
        sprite: 'ENEMY_SHARDLING',
        palette: ['', CONSTANTS.PALETTE.ENEMY_SHARDLING_MAIN, CONSTANTS.PALETTE.ENEMY_SHARDLING_DARK, CONSTANTS.PALETTE.ENEMY_SHARDLING_HIGHLIGHT]
    },
    lantern: {
        sprite: 'ENEMY_LANTERN',
        palette: ['', CONSTANTS.PALETTE.ENEMY_LANTERN_MAIN, CONSTANTS.PALETTE.ENEMY_LANTERN_DARK, CONSTANTS.PALETTE.ENEMY_LANTERN_HIGHLIGHT]
    },
    stalker: {
        sprite: 'ENEMY_STALKER',
        palette: ['', CONSTANTS.PALETTE.ENEMY_STALKER_MAIN, CONSTANTS.PALETTE.ENEMY_STALKER_DARK, CONSTANTS.PALETTE.ENEMY_STALKER_HIGHLIGHT]
    },
    toad: {
        sprite: 'ENEMY_TOAD',
        palette: ['', CONSTANTS.PALETTE.ENEMY_TOAD_MAIN, CONSTANTS.PALETTE.ENEMY_TOAD_DARK, CONSTANTS.PALETTE.ENEMY_TOAD_HIGHLIGHT]
    },
    mimic: {
        sprite: 'ENEMY_MIMIC',
        palette: ['', CONSTANTS.PALETTE.ENEMY_MIMIC_MAIN, CONSTANTS.PALETTE.ENEMY_MIMIC_DARK, CONSTANTS.PALETTE.ENEMY_MIMIC_HIGHLIGHT]
    },
    charger: {
        sprite: 'ENEMY_CHARGER',
        palette: ['', CONSTANTS.PALETTE.ENEMY_CHARGER_MAIN, CONSTANTS.PALETTE.ENEMY_CHARGER_DARK, CONSTANTS.PALETTE.ENEMY_CHARGER_HIGHLIGHT]
    },
    spire: {
        sprite: 'ENEMY_SPIRE',
        palette: ['', CONSTANTS.PALETTE.ENEMY_SPIRE_MAIN, CONSTANTS.PALETTE.ENEMY_SPIRE_DARK, CONSTANTS.PALETTE.ENEMY_SPIRE_HIGHLIGHT]
    },
    glider: {
        sprite: 'ENEMY_GLIDER',
        palette: ['', CONSTANTS.PALETTE.ENEMY_GLIDER_MAIN, CONSTANTS.PALETTE.ENEMY_GLIDER_DARK, CONSTANTS.PALETTE.ENEMY_GLIDER_HIGHLIGHT]
    },
    brute: {
        sprite: 'ENEMY_BRUTE',
        palette: ['', CONSTANTS.PALETTE.ENEMY_BRUTE_MAIN, CONSTANTS.PALETTE.ENEMY_BRUTE_DARK, CONSTANTS.PALETTE.ENEMY_BRUTE_HIGHLIGHT]
    },
    seedling: {
        sprite: 'ENEMY_SEEDLING',
        palette: ['', CONSTANTS.PALETTE.ENEMY_SEEDLING_MAIN, CONSTANTS.PALETTE.ENEMY_SEEDLING_DARK, CONSTANTS.PALETTE.ENEMY_SEEDLING_HIGHLIGHT]
    }
};

const BOSS_PALETTES: Record<string, string[]> = {
    boss_skull: ['', CONSTANTS.PALETTE.BOSS_MAIN, CONSTANTS.PALETTE.BOSS_HIGHLIGHT, '#000000'],
    boss_wyrm: ['', CONSTANTS.PALETTE.BOSS_SERPENT_MAIN, CONSTANTS.PALETTE.BOSS_SERPENT_DARK, CONSTANTS.PALETTE.BOSS_SERPENT_HIGHLIGHT],
    boss_monk: ['', CONSTANTS.PALETTE.BOSS_MONK_MAIN, CONSTANTS.PALETTE.BOSS_MONK_DARK, CONSTANTS.PALETTE.BOSS_MONK_HIGHLIGHT],
    boss_reaper: ['', CONSTANTS.PALETTE.BOSS_REAPER_MAIN, CONSTANTS.PALETTE.BOSS_REAPER_DARK, CONSTANTS.PALETTE.BOSS_REAPER_HIGHLIGHT],
    boss_nebula: ['', CONSTANTS.PALETTE.BOSS_NEBULA_MAIN, CONSTANTS.PALETTE.BOSS_NEBULA_DARK, CONSTANTS.PALETTE.BOSS_NEBULA_HIGHLIGHT],
    boss_obelisk: ['', CONSTANTS.PALETTE.BOSS_OBELISK_MAIN, CONSTANTS.PALETTE.BOSS_OBELISK_DARK, CONSTANTS.PALETTE.BOSS_OBELISK_HIGHLIGHT],
};

// Helper: Convert Logical Pixel Coordinate to 3D World Coordinate
const to3D = (val: number, max: number) => {
    return (val / TILE_SIZE) - (max / TILE_SIZE / 2);
};

// --- VOXEL ENGINE ---

interface VoxelMeshProps {
    spriteMatrix: number[][];
    colors: string[]; // [Unused, Primary, Secondary, Highlight]
    scaleFactor: number; // Size of the entity in World Units
    opacity?: number;
    flash?: boolean;
}

const dummy = new THREE.Object3D();

const VoxelMesh: React.FC<VoxelMeshProps> = React.memo(({ spriteMatrix, colors, scaleFactor, opacity = 1, flash = false }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    
    // Process Sprite Data into Voxel Positions
    const voxels = useMemo(() => {
        const data: {x: number, y: number, color: THREE.Color}[] = [];
        const h = spriteMatrix.length;
        const w = spriteMatrix[0].length;
        
        // Center offsets
        const ox = w / 2;
        const oy = h; // Pivot at bottom

        spriteMatrix.forEach((row, r) => {
            row.forEach((pixel, c) => {
                if (pixel > 0 && colors[pixel]) {
                    // Invert Y because array 0 is top
                    const y = (h - 1 - r); 
                    
                    const col = new THREE.Color(flash ? '#ffffff' : colors[pixel]);
                    if (flash) col.multiplyScalar(2.0); // Bright flash

                    data.push({
                        x: c - ox,
                        y: y - oy + (h/2), // Center vertically relative to height
                        color: col
                    });
                }
            });
        });
        return data;
    }, [spriteMatrix, colors, flash]);

    useMemo(() => {
        if (meshRef.current) {
            meshRef.current.instanceMatrix.needsUpdate = true;
            if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
        }
    }, [voxels]);

    useLayoutEffect(() => {
        if (!meshRef.current) return;
        
        // Voxel Size logic: 
        // The entity has a width of `scaleFactor` (e.g. 1 unit).
        // The sprite is 16 pixels wide.
        // So 1 voxel = scaleFactor / 16.
        const voxelSize = scaleFactor / 16;
        
        voxels.forEach((v, i) => {
            dummy.position.set(v.x * voxelSize, v.y * voxelSize, 0);
            dummy.scale.set(voxelSize, voxelSize, voxelSize * 2); // Thicker Z for solidity
            dummy.updateMatrix();
            meshRef.current!.setMatrixAt(i, dummy.matrix);
            meshRef.current!.setColorAt(i, v.color);
        });
        
        meshRef.current.instanceMatrix.needsUpdate = true;
        if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
    }, [voxels, scaleFactor]);

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, voxels.length]} castShadow receiveShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial 
                roughness={0.5} 
                metalness={0.1} 
                transparent={opacity < 1} 
                opacity={opacity} 
            />
        </instancedMesh>
    );
});

// --- HELPER: GET ASSET DATA ---

const getEntityAssetData = (e: Entity, engine: GameEngine) => {
    let spriteMatrix = SPRITES.PLAYER; // Default
    let palette = ['', '#fff', '#ccc', '#888'];

    if (e.type === EntityType.PLAYER) {
        const char = CHARACTERS.find(c => c.id === engine.characterId);
        if (char) {
            spriteMatrix = SPRITES[char.sprite as keyof typeof SPRITES] || SPRITES.PLAYER;
            // Map Character Palette
            const P = CONSTANTS.PALETTE;
            // The mapping depends on how AssetLoader did it. 
            // In assets.ts, we see specific arrays for specific sprites. 
            // We need to approximate that logic here or duplicate it carefully.
            
            // Generic fallback for custom colors if strict mapping is hard
            if (char.sprite === 'PLAYER') palette = ['', P.PLAYER_MAIN, P.PLAYER_SHADOW, P.PLAYER_SKIN];
            else if (char.sprite === 'PLAYER_TANK') palette = ['', '#15803d', '#14532d', '#86efac'];
            else if (char.sprite === 'PLAYER_ROGUE') palette = ['', '#eab308', '#a16207', '#fef08a'];
            else if (char.sprite === 'PLAYER_MAGE') palette = ['', '#a855f7', '#7e22ce', '#e9d5ff'];
            else if (char.sprite === 'PLAYER_SNIPER') palette = ['', '#3b82f6', '#1e40af', '#60a5fa'];
            else if (char.sprite === 'PLAYER_SWARM') palette = ['', '#ef4444', '#991b1b', '#fca5a5'];
            else if (char.sprite === 'PLAYER_VOID') palette = ['', '#171717', '#0a0a0a', '#404040'];
            else palette = ['', char.color, char.color, '#fff'];
        }
    } else if (e.type === EntityType.ENEMY) {
        const en = e as EnemyEntity;
        const P = CONSTANTS.PALETTE;
        const variant = en.enemyId ? ENEMY_VARIANTS[en.enemyId] : undefined;
        if (variant) {
            spriteMatrix = SPRITES[variant.sprite];
            palette = variant.palette;
            return { spriteMatrix, palette };
        }
        
        if (en.enemyType === 'CHASER') {
            spriteMatrix = SPRITES.ENEMY_CHASER;
            palette = ['', P.ENEMY_RED_MAIN, P.ENEMY_RED_DARK, '#ffffff'];
        } else if (en.enemyType === 'SHOOTER') {
            spriteMatrix = SPRITES.ENEMY_SHOOTER;
            palette = ['', P.ENEMY_BLUE_MAIN, P.ENEMY_BLUE_DARK, '#ffffff'];
        } else if (en.enemyType === 'TANK') {
            spriteMatrix = SPRITES.ENEMY_TANK;
            palette = ['', P.ENEMY_GREEN_MAIN, P.ENEMY_GREEN_DARK, '#000000'];
        } else if (en.enemyType === 'BOSS') {
            const bossId = en.bossId || 'boss_skull';
            const bossConfig = BOSSES.find(b => b.id === bossId);
            const bossSpriteKey = bossConfig?.sprite;
            if (bossSpriteKey && bossSpriteKey in SPRITES) {
                spriteMatrix = SPRITES[bossSpriteKey as keyof typeof SPRITES];
            } else if (bossSpriteKey === 'ENEMY_BOSS') {
                spriteMatrix = SPRITES.BOSS;
            } else {
                spriteMatrix = SPRITES.BOSS;
            }
            palette = BOSS_PALETTES[bossId] || ['', P.BOSS_MAIN, P.BOSS_HIGHLIGHT, '#000000'];
        } else if (en.enemyType === 'DASHER') {
             // Re-use chaser sprite but color
             spriteMatrix = SPRITES.ENEMY_CHASER;
             palette = ['', '#fbbf24', '#b45309', '#fff']; // Orange/Yellow
        } else if (en.enemyType === 'ORBITER') {
             spriteMatrix = SPRITES.ENEMY_CHASER;
             palette = ['', '#db2777', '#be185d', '#fff']; // Pink
        }
    } else if (e.type === EntityType.ITEM) {
        const it = e as ItemEntity;
        const P = CONSTANTS.PALETTE;
        const itemConfig = ITEMS.find(i => i.type === it.itemType) || DROPS.find(d => d.type === it.itemType);
        
        if (itemConfig) {
            spriteMatrix = SPRITES[itemConfig.sprite as keyof typeof SPRITES] || SPRITES.ITEM_BOX;
            // Specific item palettes from assets.ts
            if (itemConfig.sprite === 'ITEM_MEAT') palette = ['', '#fca5a5', '#dc2626', '#fef2f2'];
            else if (itemConfig.sprite === 'ITEM_SWORD') palette = ['', '#94a3b8', '#475569', '#e2e8f0'];
            else if (itemConfig.sprite === 'ITEM_SYRINGE') palette = ['', '#e0e7ff', '#ef4444', '#a5f3fc'];
            else if (itemConfig.sprite === 'ITEM_MUG') palette = ['', '#78350f', '#92400e', '#451a03'];
            else if (itemConfig.sprite === 'ITEM_SPRING') palette = ['', '#9ca3af', '#4b5563', '#d1d5db'];
            else if (itemConfig.sprite === 'ITEM_LENS') palette = ['', '#60a5fa', '#1e3a8a', '#93c5fd'];
            else if (itemConfig.sprite === 'ITEM_EYE') palette = ['', '#fef3c7', '#d97706', '#000000'];
            else if (itemConfig.sprite === 'HEART') palette = ['', P.HEART_MAIN, P.HEART_SHADOW, '#ffffff'];
            else palette = ['', P.ITEM_GOLD, P.ITEM_SHADOW, '#ffffff'];
        }
    } else if (e.type === EntityType.PEDESTAL) {
        spriteMatrix = SPRITES.PEDESTAL;
        const P = CONSTANTS.PALETTE;
        palette = ['', P.PEDESTAL_TOP, P.PEDESTAL_SIDE, '#000000'];
    }

    return { spriteMatrix, palette };
};

// --- COMPONENTS ---

// 3D Entity Container
const EntityGroup: React.FC<{ entity: Entity, engine: GameEngine }> = React.memo(({ entity, engine }) => {
    const groupRef = useRef<THREE.Group>(null);
    const rotationRef = useRef(0);
    const bobOffset = useRef(Math.random() * 100);

    // Calculate dimensions
    const width = entity.w / TILE_SIZE;
    const height = entity.h / TILE_SIZE;

    const { spriteMatrix, palette } = useMemo(() => getEntityAssetData(entity, engine), [entity.type, (entity as any).itemType, (entity as any).enemyType, engine.characterId]);

    useFrame((state) => {
        if (groupRef.current) {
            // Position
            const cx = entity.x + entity.w / 2;
            const cy = entity.y + entity.h / 2;
            const x = to3D(cx, CONSTANTS.CANVAS_WIDTH);
            const z = to3D(cy, CONSTANTS.CANVAS_HEIGHT);
            
            // Base Height
            let y = width / 2; // Center of voxel mesh (which is 1 unit high normalized) relative to floor

            // Visual Z (Floating)
            if (entity.visualZ) {
                y += entity.visualZ / TILE_SIZE;
            }

            // Bobbing Animation for Items and Flying Enemies
            const isFlying = (entity.type === EntityType.ENEMY && (entity as EnemyEntity).flying) || 
                             entity.type === EntityType.ITEM;
            
            if (isFlying) {
                y += Math.sin(state.clock.elapsedTime * 4 + bobOffset.current) * 0.1;
            }

            groupRef.current.position.set(x, y, z);

            // Rotation Logic
            if (entity.type === EntityType.PLAYER || entity.type === EntityType.ENEMY) {
                // Face movement direction
                const vx = entity.velocity.x;
                const vy = entity.velocity.y;
                if (Math.abs(vx) > 0.01 || Math.abs(vy) > 0.01) {
                    // In 3D: X is Right, Z is Down (South).
                    // Angle 0 is facing +X (Right).
                    // We want: 
                    // Right (+x) -> 0 rad
                    // Down (+y in 2D / +z in 3D) -> -PI/2
                    const targetRot = Math.atan2(-vy, vx); // Note: Inverting Y for 3D mapping usually
                    
                    // Smooth rotation
                    let diff = targetRot - rotationRef.current;
                    // Normalize angle
                    while (diff > Math.PI) diff -= Math.PI * 2;
                    while (diff < -Math.PI) diff += Math.PI * 2;
                    
                    rotationRef.current += diff * 0.2;
                }
                // Apply rotation around Y axis
                // Offset by PI/2 because sprites usually face "Front" (South) by default? 
                // Our sprites are drawn front-facing. 
                // If I move right, I want the side of the voxel model? No, I want the face.
                // Let's assume the sprite is the "Front" view.
                // If I move Right, I rotate -90 deg so the front faces right.
                // Actually, let's keep it simple: The voxel model is a 3D extrusion of the front view.
                // It looks like a "cardboard cutout" with depth.
                // If we rotate it 90 degrees, it looks thin.
                // SO: For "Paper Mario" / Voxel style, we might actually want to Billboard usually?
                // BUT the prompt asked for "3D化" (3D-ification).
                // Let's assume we WANT the rotation, even if it reveals the side profile.
                groupRef.current.rotation.y = rotationRef.current;
            } else if (entity.type === EntityType.ITEM) {
                // Spin items
                groupRef.current.rotation.y += 0.02;
            } else {
                groupRef.current.rotation.y = 0;
            }
        }
    });

    // --- RENDER BASED ON TYPE ---

    // 1. Projectiles: Pure 3D Geometry (Sphere)
    if (entity.type === EntityType.PROJECTILE) {
        const p = entity as ProjectileEntity;
        const color = p.ownerId === 'player' ? CONSTANTS.COLORS.PROJECTILE_FRIENDLY : CONSTANTS.COLORS.PROJECTILE_ENEMY;
        return (
            <group ref={groupRef}>
                <mesh castShadow>
                    <sphereGeometry args={[width/2, 16, 16]} />
                    <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} toneMapped={false} />
                </mesh>
                <pointLight color={color} intensity={2} distance={3} decay={2} />
            </group>
        );
    }

    // 2. Obstacles: Pure 3D Geometry (Box)
    if (entity.type === EntityType.OBSTACLE) {
         return (
             <group ref={groupRef}>
                 <mesh castShadow receiveShadow>
                     <boxGeometry args={[width, height, width]} />
                     <meshStandardMaterial color="white" />
                 </mesh>
             </group>
        );
    }

    // 3. Trapdoors: Flat
    if (entity.type === EntityType.TRAPDOOR) {
         return (
             <group ref={groupRef}>
                 <mesh position={[0, 0.06, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                     <ringGeometry args={[width * 0.35, width * 0.5, 24]} />
                     <meshStandardMaterial color="#1f2937" />
                 </mesh>
                 <mesh position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
                     <circleGeometry args={[width * 0.35, 24]} />
                     <meshStandardMaterial color="#000" />
                 </mesh>
                 <mesh position={[0, -0.4, 0]}>
                     <cylinderGeometry args={[width * 0.34, width * 0.34, 0.8, 24, 1, true]} />
                     <meshStandardMaterial color="#050505" side={THREE.DoubleSide} />
                 </mesh>
             </group>
         );
    }

    // 4. Characters, Items, Enemies: VOXEL MESHES
    const isFlash = (entity.flashTimer && entity.flashTimer > 0) || 
                    (entity.type === EntityType.PLAYER && (entity as PlayerEntity).invincibleTimer > 0 && Math.floor((entity as PlayerEntity).invincibleTimer / 4) % 2 === 0);

    return (
        <group ref={groupRef}>
            <VoxelMesh 
                spriteMatrix={spriteMatrix} 
                colors={palette} 
                scaleFactor={width} 
                flash={!!isFlash} 
            />
        </group>
    );
});

// The Static Environment
const DungeonMesh: React.FC<{ engine: GameEngine, assets: AssetLoader }> = React.memo(({ engine, assets }) => {
    const room = engine.currentRoom;
    if (!room) return null;

    const theme = ROOM_THEMES[room.themeId ?? 0] || ROOM_THEMES[0];
    const floorTex = assets.getTexture(`FLOOR_THEME_${theme.id}`) || assets.getTexture('FLOOR');
    const wallTex = assets.getTexture(`WALL_THEME_${theme.id}`) || assets.getTexture('WALL');
    const rockTex = assets.getTexture(`ROCK_THEME_${theme.id}`) || assets.getTexture('ROCK');
    const bgTex = assets.getTexture(`BG_THEME_${theme.id}`) || null;

    // Floor Plane
    const floorMeshes: React.ReactNode[] = [];
    const wallMeshes: React.ReactNode[] = [];

    room.layout.forEach((row, r) => {
        row.forEach((tile, c) => {
            const x = c - (ROOM_WIDTH - 1) / 2;
            const z = r - (ROOM_HEIGHT - 1) / 2;
            const key = `${r}-${c}`;

            // Floor
            floorMeshes.push(
                <mesh key={`f-${key}`} position={[x, 0, z]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                    <planeGeometry args={[1, 1]} />
                    <meshStandardMaterial map={floorTex} color={tile === 3 ? theme.wall.shadow : "#ffffff"} />
                </mesh>
            );

            if (tile === 1) { // Wall
                wallMeshes.push(
                    <mesh key={`w-${key}`} position={[x, 0.5, z]} castShadow receiveShadow>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial map={wallTex || undefined} color="white" />
                    </mesh>
                );
            } else if (tile === 2) { // Rock
                wallMeshes.push(
                    <mesh key={`r-${key}`} position={[x, 0.5, z]} castShadow receiveShadow>
                        <boxGeometry args={[1, 1, 1]} />
                        <meshStandardMaterial map={rockTex || undefined} color={theme.obstacle.main} />
                    </mesh>
                );
            }
        });
    });

    // Doors
    const doorOpenT = room.doorAnim
        ? (room.doorAnim.state === 'open' ? 1 : room.doorAnim.state === 'closed' ? 0 : room.doorAnim.t)
        : (room.cleared ? 1 : 0);

    const createShutterDoor = (x: number, z: number, rotY: number, key: string) => {
        const doorWidth = 3;
        const doorHeight = 1;
        const frameDepth = 0.18;
        const frameThickness = 0.1;
        const panelWidth = doorWidth / 2;
        const panelHeight = doorHeight - frameThickness;
        const openShift = (doorWidth / 2) + (panelWidth / 2) - 0.05;
        const closedShift = panelWidth / 2;
        const panelShift = closedShift + (openShift - closedShift) * doorOpenT;
        const indicatorColor = doorOpenT > 0.95 ? '#22c55e' : '#ef4444';

        return (
            <group key={`door-${key}`} position={[x, 0.5, z]} rotation={[0, rotY, 0]}>
                <mesh castShadow receiveShadow position={[0, (doorHeight / 2) - (frameThickness / 2), 0]}>
                    <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameDepth]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_FRAME} />
                </mesh>
                <mesh castShadow receiveShadow position={[-(doorWidth / 2) - (frameThickness / 2), 0, 0]}>
                    <boxGeometry args={[frameThickness, doorHeight, frameDepth]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_FRAME} />
                </mesh>
                <mesh castShadow receiveShadow position={[(doorWidth / 2) + (frameThickness / 2), 0, 0]}>
                    <boxGeometry args={[frameThickness, doorHeight, frameDepth]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_FRAME} />
                </mesh>

                <mesh castShadow receiveShadow position={[-panelShift, 0, 0]}>
                    <boxGeometry args={[panelWidth, panelHeight, 0.08]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_LOCKED} />
                </mesh>
                <mesh castShadow receiveShadow position={[panelShift, 0, 0]}>
                    <boxGeometry args={[panelWidth, panelHeight, 0.08]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_LOCKED} />
                </mesh>

                <mesh position={[0, (doorHeight / 2) - 0.18, frameDepth / 2 + 0.04]}>
                    <boxGeometry args={[0.22, 0.12, 0.06]} />
                    <meshStandardMaterial color={indicatorColor} emissive={indicatorColor} emissiveIntensity={0.8} />
                </mesh>
            </group>
        );
    };

    if (room.doors.UP) {
        wallMeshes.push(createShutterDoor(0, -((ROOM_HEIGHT-1)/2) + 0.5, 0, 'u'));
    }
    if (room.doors.DOWN) {
        wallMeshes.push(createShutterDoor(0, ((ROOM_HEIGHT-1)/2) - 0.5, 0, 'd'));
    }
    if (room.doors.LEFT) {
        wallMeshes.push(createShutterDoor(-((ROOM_WIDTH-1)/2) + 0.5, 0, Math.PI/2, 'l'));
    }
    if (room.doors.RIGHT) {
        wallMeshes.push(createShutterDoor(((ROOM_WIDTH-1)/2) - 0.5, 0, Math.PI/2, 'r'));
    }

    return (
        <group>
            {floorMeshes}
            {wallMeshes}
            <mesh position={[0, -0.1, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[30, 20]} />
                {bgTex ? (
                    <meshBasicMaterial map={bgTex} color={theme.bg} />
                ) : (
                    <meshBasicMaterial color={theme.bg} />
                )}
            </mesh>
        </group>
    );
});

export const GameScene: React.FC<RendererProps> = ({ engine }) => {
    const { camera } = useThree();

    useFrame(() => {
        engine.cameraQuaternion.copy(camera.quaternion);
    });

    const roomKey = engine.currentRoom ? `${engine.currentRoom.x},${engine.currentRoom.y}` : 'void';

    return (
        <group>
            <ambientLight intensity={0.6} />
            <directionalLight 
                position={[10, 20, 10]} 
                intensity={1.0} 
                castShadow 
                shadow-bias={-0.0001}
            />
            
            <pointLight position={[0, 8, 0]} intensity={0.5} distance={20} />

            <group key={roomKey}>
                <DungeonMesh engine={engine} assets={engine.assets} />
            </group>

            <EntityGroup key={engine.player.id} entity={engine.player} engine={engine} />
            
            {engine.entities.map(ent => (
                <EntityGroup key={ent.id} entity={ent} engine={engine} />
            ))}
        </group>
    );
};
