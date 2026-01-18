
import React, { useRef, useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { GameEngine } from './game';
import { Entity, EntityType, PlayerEntity, EnemyEntity, ProjectileEntity, ItemEntity, BombEntity, RemotePlayerEntity, Room, SkullEntity } from './types';
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
const MAX_PARTICLES = 1800;
const AMBIENT_PARTICLES = 120;
const MAX_EXPLOSIONS = 24;

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

type Particle = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
    color: THREE.Color;
};

type ExplosionRing = {
    position: THREE.Vector3;
    life: number;
    maxLife: number;
    size: number;
    color: THREE.Color;
};

type AmbientParticle = {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
};

const MAX_PROJECTILE_INSTANCES = 1500;

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

    if (e.type === EntityType.PLAYER || e.type === EntityType.REMOTE_PLAYER) {
        const characterId = e.type === EntityType.PLAYER ? engine.characterId : (e as RemotePlayerEntity).characterId;
        const char = CHARACTERS.find(c => c.id === characterId);
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
    } else if (e.type === EntityType.SKULL) {
        spriteMatrix = SPRITES.SKULL;
        palette = ['', '#e5e7eb', '#9ca3af', '#111827'];
    }

    return { spriteMatrix, palette };
};

// --- COMPONENTS ---

// 3D Entity Container
const EntityGroup: React.FC<{ entity: Entity, engine: GameEngine }> = React.memo(({ entity, engine }) => {
    const groupRef = useRef<THREE.Group>(null);
    const rotationRef = useRef(0);
    const bobOffset = useRef(Math.random() * 100);
    const itemSpinRef = useRef<THREE.Group>(null);
    const itemHeartsRef = useRef<THREE.Group>(null);

    // Calculate dimensions
    const width = entity.w / TILE_SIZE;
    const height = entity.h / TILE_SIZE;

    const { spriteMatrix, palette } = useMemo(() => getEntityAssetData(entity, engine), [entity.type, (entity as any).itemType, (entity as any).enemyType, engine.characterId]);
    const isPlayerEntity = entity.type === EntityType.PLAYER || entity.type === EntityType.REMOTE_PLAYER;
    const characterId = entity.type === EntityType.PLAYER ? engine.characterId : (entity as RemotePlayerEntity).characterId;
    const playerStyle = {
        alpha: { body: '#14b8a6', armor: '#0f766e', accent: '#99f6e4', core: '#38bdf8' },
        titan: { body: '#166534', armor: '#14532d', accent: '#86efac', core: '#22c55e' },
        strider: { body: '#f59e0b', armor: '#a16207', accent: '#fef08a', core: '#f97316' },
        blaster: { body: '#a855f7', armor: '#7e22ce', accent: '#e9d5ff', core: '#c084fc' },
        sniper: { body: '#3b82f6', armor: '#1e40af', accent: '#93c5fd', core: '#60a5fa' },
        swarm: { body: '#ef4444', armor: '#991b1b', accent: '#fecaca', core: '#fb7185' },
        void: { body: '#1f2937', armor: '#0f172a', accent: '#64748b', core: '#94a3b8' }
    }[characterId] || { body: '#14b8a6', armor: '#0f766e', accent: '#99f6e4', core: '#38bdf8' };

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
    if (entity.type === EntityType.PLAYER || entity.type === EntityType.REMOTE_PLAYER || entity.type === EntityType.ENEMY) {
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
                // Spin items only, keep overlays fixed
                if (itemSpinRef.current) itemSpinRef.current.rotation.y += 0.02;
                groupRef.current.rotation.y = 0;
                if (itemHeartsRef.current) {
                    const camForward = new THREE.Vector3(0, 0, -1).applyQuaternion(engine.cameraQuaternion).normalize();
                    const offset = camForward.multiplyScalar(-0.25);
                    itemHeartsRef.current.position.set(offset.x, -0.25, offset.z);
                }
            } else {
                groupRef.current.rotation.y = 0;
            }

            if (entity.type === EntityType.BOMB) {
                const bomb = entity as BombEntity;
                const t = Math.max(0, Math.min(3, bomb.timer));
                const pulseSpeed = 6 + (3 - t) * 4;
                const pulse = 0.9 + Math.sin(state.clock.elapsedTime * pulseSpeed) * 0.12;
                groupRef.current.scale.setScalar(pulse);
            } else {
                groupRef.current.scale.set(1, 1, 1);
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

    // 3. Bombs
    if (entity.type === EntityType.BOMB) {
        return (
            <group ref={groupRef}>
                <mesh castShadow>
                    <sphereGeometry args={[width / 2, 12, 12]} />
                    <meshStandardMaterial color="#111827" emissive="#ef4444" emissiveIntensity={0.6} />
                </mesh>
                <pointLight color="#f97316" intensity={1.8} distance={2.5} decay={2} />
            </group>
        );
    }

    // 4. Trapdoors: Flat
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

    // 5. Skull Marker
    if (entity.type === EntityType.SKULL) {
        const skull = entity as SkullEntity;
        return (
            <group ref={groupRef}>
                <VoxelMesh 
                    spriteMatrix={spriteMatrix} 
                    colors={palette} 
                    scaleFactor={width} 
                    flash={false} 
                />
                <Text
                    position={[0, -0.35, 0]}
                    fontSize={0.18}
                    color="#e5e7eb"
                    anchorX="center"
                    anchorY="top"
                >
                    {skull.label}
                </Text>
            </group>
        );
    }

    // 6. Characters, Items, Enemies: VOXEL MESHES
    const isFlash = (entity.flashTimer && entity.flashTimer > 0) || 
                    (entity.type === EntityType.PLAYER && (entity as PlayerEntity).invincibleTimer > 0 && Math.floor((entity as PlayerEntity).invincibleTimer / 4) % 2 === 0);

    if (isPlayerEntity) {
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
    }

    if (entity.type === EntityType.ITEM) {
        const item = entity as ItemEntity;
        const cost = item.costHearts || 0;
        const heartCount = Math.max(0, Math.min(cost, 4));
        const heartSpacing = 0.12;
        const startX = -((heartCount - 1) * heartSpacing) / 2;
        return (
            <group ref={groupRef}>
                <group ref={itemSpinRef}>
                    <VoxelMesh 
                        spriteMatrix={spriteMatrix} 
                        colors={palette} 
                        scaleFactor={width} 
                        flash={!!isFlash} 
                    />
                </group>
                {heartCount > 0 && (
                    <group ref={itemHeartsRef}>
                        {Array.from({ length: heartCount }).map((_, i) => (
                            <mesh key={`heart-${entity.id}-${i}`} position={[startX + i * heartSpacing, 0, 0]}>
                                <boxGeometry args={[0.08, 0.08, 0.04]} />
                                <meshStandardMaterial color="#ef4444" emissive="#7f1d1d" emissiveIntensity={0.4} />
                            </mesh>
                        ))}
                    </group>
                )}
            </group>
        );
    }

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

const ProjectileField: React.FC<{ engine: GameEngine }> = React.memo(({ engine }) => {
    const friendlyRef = useRef<THREE.InstancedMesh>(null);
    const enemyRef = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const geometry = useMemo(() => new THREE.SphereGeometry(0.5, 6, 6), []);
    const friendlyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: CONSTANTS.COLORS.PROJECTILE_FRIENDLY, toneMapped: false }), []);
    const enemyMat = useMemo(() => new THREE.MeshBasicMaterial({ color: CONSTANTS.COLORS.PROJECTILE_ENEMY, toneMapped: false }), []);

    useFrame(() => {
        let friendlyCount = 0;
        let enemyCount = 0;
        const entities = engine.entities as Entity[];

        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if (ent.type !== EntityType.PROJECTILE) continue;
            const p = ent as ProjectileEntity;
            const width = p.w / TILE_SIZE;
            const cx = p.x + p.w / 2;
            const cy = p.y + p.h / 2;
            const x = to3D(cx, CONSTANTS.CANVAS_WIDTH);
            const z = to3D(cy, CONSTANTS.CANVAS_HEIGHT);
            let y = width / 2;
            if (p.visualZ) y += p.visualZ / TILE_SIZE;

            dummy.position.set(x, y, z);
            dummy.scale.set(width, width, width * 1.1);
            dummy.updateMatrix();

            if (p.ownerId === 'player') {
                if (friendlyCount < MAX_PROJECTILE_INSTANCES && friendlyRef.current) {
                    friendlyRef.current.setMatrixAt(friendlyCount, dummy.matrix);
                    friendlyCount++;
                }
            } else {
                if (enemyCount < MAX_PROJECTILE_INSTANCES && enemyRef.current) {
                    enemyRef.current.setMatrixAt(enemyCount, dummy.matrix);
                    enemyCount++;
                }
            }

        }

        if (friendlyRef.current) {
            friendlyRef.current.count = friendlyCount;
            friendlyRef.current.instanceMatrix.needsUpdate = true;
        }
        if (enemyRef.current) {
            enemyRef.current.count = enemyCount;
            enemyRef.current.instanceMatrix.needsUpdate = true;
        }
    });

    return (
        <group>
            <instancedMesh ref={friendlyRef} args={[geometry, friendlyMat, MAX_PROJECTILE_INSTANCES]} frustumCulled={false} />
            <instancedMesh ref={enemyRef} args={[geometry, enemyMat, MAX_PROJECTILE_INSTANCES]} frustumCulled={false} />
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

    // Extra outer wall ring to fully cover beyond the room boundary
    const outerOffsetX = (ROOM_WIDTH - 1) / 2 + 1;
    const outerOffsetZ = (ROOM_HEIGHT - 1) / 2 + 1;
    const doorGap = 1; // half-width in tiles for the opening
    const skipForDoor = (x: number, z: number) => {
        if (z === -outerOffsetZ && room.doors.UP && Math.abs(x) <= doorGap) return true;
        if (z === outerOffsetZ && room.doors.DOWN && Math.abs(x) <= doorGap) return true;
        if (x === -outerOffsetX && room.doors.LEFT && Math.abs(z) <= doorGap) return true;
        if (x === outerOffsetX && room.doors.RIGHT && Math.abs(z) <= doorGap) return true;
        return false;
    };
    for (let x = -outerOffsetX; x <= outerOffsetX; x += 1) {
        for (let z = -outerOffsetZ; z <= outerOffsetZ; z += 1) {
            const onOuterEdge = x === -outerOffsetX || x === outerOffsetX || z === -outerOffsetZ || z === outerOffsetZ;
            if (!onOuterEdge) continue;
            if (skipForDoor(x, z)) continue;
            const key = `outer-${x}-${z}`;
            wallMeshes.push(
                <mesh key={key} position={[x, 0.5, z]} castShadow receiveShadow>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial map={wallTex || undefined} color="white" />
                </mesh>
            );
        }
    }

    // Doors
    const doorOpenT = room.doorAnim
        ? (room.doorAnim.state === 'open' ? 1 : room.doorAnim.state === 'closed' ? 0 : room.doorAnim.t)
        : (room.cleared ? 1 : 0);

    const getNeighborType = (dx: number, dy: number): Room['type'] | null => {
        const nextRoom = engine.dungeon.find(r => r.x === room.x + dx && r.y === room.y + dy);
        return nextRoom ? nextRoom.type : null;
    };

    const createHiddenHole = (x: number, z: number, rotY: number, key: string) => {
        const holeDepth = 0.12;
        return (
            <group key={`hidden-hole-${key}`} position={[x, 0.5, z]} rotation={[0, rotY, 0]}>
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[1.2, 0.8, holeDepth]} />
                    <meshStandardMaterial color="#0b1b3f" emissive="#0b1b3f" emissiveIntensity={0.25} />
                </mesh>
                <mesh position={[-0.55, 0.25, 0.02]} castShadow receiveShadow>
                    <boxGeometry args={[0.3, 0.35, 0.16]} />
                    <meshStandardMaterial color="#1f2937" />
                </mesh>
                <mesh position={[0.4, -0.15, 0.03]} castShadow receiveShadow>
                    <boxGeometry args={[0.35, 0.28, 0.18]} />
                    <meshStandardMaterial color="#111827" />
                </mesh>
                <mesh position={[-0.1, -0.32, 0.04]} castShadow receiveShadow>
                    <boxGeometry args={[0.25, 0.25, 0.14]} />
                    <meshStandardMaterial color="#0f172a" />
                </mesh>
            </group>
        );
    };

    const createShutterDoor = (x: number, z: number, rotY: number, key: string, neighborType: Room['type'] | null) => {
        if (neighborType === 'HIDDEN' && doorOpenT > 0.1) {
            return createHiddenHole(x, z, rotY, key);
        }
        const doorWidth = 3;
        const doorHeight = 1.2;
        const frameDepth = 0.2;
        const frameThickness = 0.1;
        const panelWidth = doorWidth / 2;
        const panelHeight = doorHeight - frameThickness;
        const openShift = (doorWidth / 2) + (panelWidth / 2) - 0.05;
        const closedShift = panelWidth / 2;
        const panelShift = closedShift + (openShift - closedShift) * doorOpenT;
        const requiresKey = neighborType === 'CHEST' && room.type !== 'CHEST' && engine.floorLevel > 1;
        const hasKey = (engine.player?.keys || 0) > 0;
        const keyLocked = requiresKey && !hasKey;
        const isLocked = (!room.cleared && room.type !== 'START' && room.type !== 'CHEST' && room.type !== 'DEVIL') || keyLocked;
        const canPass = !isLocked;
        let indicatorColor = canPass ? '#22c55e' : '#ef4444';
        if (canPass && requiresKey) {
            indicatorColor = '#fbbf24';
        }

        const panelColor = doorOpenT > 0.7 ? CONSTANTS.PALETTE.DOOR_OPEN : CONSTANTS.PALETTE.DOOR_LOCKED;
        const handleGlow = doorOpenT > 0.7 ? '#22c55e' : '#ef4444';

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
                <mesh castShadow receiveShadow position={[0, -(doorHeight / 2) + (frameThickness / 2), 0]}>
                    <boxGeometry args={[doorWidth + frameThickness * 2, frameThickness, frameDepth]} />
                    <meshStandardMaterial color={CONSTANTS.PALETTE.DOOR_FRAME} />
                </mesh>

                <mesh castShadow receiveShadow position={[-panelShift, 0, 0]}>
                    <boxGeometry args={[panelWidth, panelHeight, 0.08]} />
                    <meshStandardMaterial color={panelColor} emissive={panelColor} emissiveIntensity={0.25} />
                </mesh>
                <mesh castShadow receiveShadow position={[panelShift, 0, 0]}>
                    <boxGeometry args={[panelWidth, panelHeight, 0.08]} />
                    <meshStandardMaterial color={panelColor} emissive={panelColor} emissiveIntensity={0.25} />
                </mesh>

                <mesh position={[0, (doorHeight / 2) - 0.2, frameDepth / 2 + 0.04]}>
                    <boxGeometry args={[0.24, 0.12, 0.06]} />
                    <meshStandardMaterial color={indicatorColor} emissive={indicatorColor} emissiveIntensity={0.9} />
                </mesh>
                <mesh position={[0, -0.05, frameDepth / 2 + 0.03]}>
                    <boxGeometry args={[0.18, 0.18, 0.05]} />
                    <meshStandardMaterial color={handleGlow} emissive={handleGlow} emissiveIntensity={0.5} />
                </mesh>
                <mesh position={[-panelShift * 0.4, 0.1, frameDepth / 2 + 0.05]}>
                    <boxGeometry args={[0.05, 0.7, 0.05]} />
                    <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[panelShift * 0.4, 0.1, frameDepth / 2 + 0.05]}>
                    <boxGeometry args={[0.05, 0.7, 0.05]} />
                    <meshStandardMaterial color="#f8fafc" emissive="#f8fafc" emissiveIntensity={0.6} />
                </mesh>
                <mesh position={[0, doorHeight / 2 + 0.08, 0]}>
                    <boxGeometry args={[0.6, 0.15, 0.14]} />
                    <meshStandardMaterial color="#9a7b52" emissive="#5c4a32" emissiveIntensity={0.25} />
                </mesh>
            </group>
        );
    };

    if (room.doors.UP) {
        wallMeshes.push(createShutterDoor(0, -((ROOM_HEIGHT-1)/2) + 0.5, 0, 'u', getNeighborType(0, -1)));
    }
    if (room.doors.DOWN) {
        wallMeshes.push(createShutterDoor(0, ((ROOM_HEIGHT-1)/2) - 0.5, 0, 'd', getNeighborType(0, 1)));
    }
    if (room.doors.LEFT) {
        wallMeshes.push(createShutterDoor(-((ROOM_WIDTH-1)/2) + 0.5, 0, Math.PI/2, 'l', getNeighborType(-1, 0)));
    }
    if (room.doors.RIGHT) {
        wallMeshes.push(createShutterDoor(((ROOM_WIDTH-1)/2) - 0.5, 0, Math.PI/2, 'r', getNeighborType(1, 0)));
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

const ParticleField: React.FC<{ engine: GameEngine }> = React.memo(({ engine }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);
    const ambientRef = useRef<THREE.InstancedMesh>(null);
    const ringRef = useRef<THREE.InstancedMesh>(null);
    const particlesRef = useRef<Particle[]>([]);
    const ringsRef = useRef<ExplosionRing[]>([]);
    const ambientRefData = useRef<AmbientParticle[]>([]);
    const prevProjectiles = useRef<Map<string, { pos: THREE.Vector3; ownerId: string }>>(new Map());
    const prevBombs = useRef<Map<string, THREE.Vector3>>(new Map());
    const prevFlash = useRef<Map<string, number>>(new Map());
    const roomKeyRef = useRef<string | null>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const geom = useMemo(() => new THREE.SphereGeometry(0.1, 6, 6), []);
    const ringGeom = useMemo(() => new THREE.RingGeometry(0.2, 0.5, 32), []);
    const material = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, toneMapped: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }), []);
    const ringMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fbbf24', transparent: true, opacity: 0.9, toneMapped: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }), []);
    const ambientMat = useMemo(() => new THREE.MeshBasicMaterial({ color: '#374151', transparent: true, opacity: 0.45, toneMapped: false, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending }), []);

    const resetAmbient = () => {
        ambientRefData.current = [];
        const halfW = (ROOM_WIDTH - 1) / 2;
        const halfH = (ROOM_HEIGHT - 1) / 2;
        for (let i = 0; i < AMBIENT_PARTICLES; i++) {
            const x = (Math.random() * 2 - 1) * halfW;
            const z = (Math.random() * 2 - 1) * halfH;
            const y = 0.15 + Math.random() * 0.5;
            ambientRefData.current.push({
                position: new THREE.Vector3(x, y, z),
                velocity: new THREE.Vector3((Math.random() - 0.5) * 0.02, 0.01 + Math.random() * 0.02, (Math.random() - 0.5) * 0.02)
            });
        }
    };

    const spawnParticle = (pos: THREE.Vector3, vel: THREE.Vector3, life: number, size: number, color: THREE.Color) => {
        if (particlesRef.current.length >= MAX_PARTICLES) return;
        particlesRef.current.push({
            position: pos.clone(),
            velocity: vel.clone(),
            life,
            maxLife: life,
            size,
            color: color.clone()
        });
    };

    const spawnBurst = (pos: THREE.Vector3, color: THREE.Color, count: number, speed: number, life: number) => {
        for (let i = 0; i < count; i++) {
            const dir = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.8, Math.random() - 0.5).normalize();
            spawnParticle(pos, dir.multiplyScalar(speed * (0.6 + Math.random() * 0.8)), life * (0.6 + Math.random() * 0.6), 0.06 + Math.random() * 0.08, color);
        }
    };

    useFrame((state) => {
        const roomKey = engine.currentRoom ? `${engine.currentRoom.x},${engine.currentRoom.y}` : 'void';
        if (roomKeyRef.current !== roomKey) {
            roomKeyRef.current = roomKey;
            particlesRef.current = [];
            ringsRef.current = [];
            prevProjectiles.current = new Map();
            prevBombs.current = new Map();
            prevFlash.current = new Map();
            resetAmbient();
        }

        const dt = Math.min(0.05, state.clock.getDelta());

        if (ambientRef.current) {
            const halfW = (ROOM_WIDTH - 1) / 2;
            const halfH = (ROOM_HEIGHT - 1) / 2;
            ambientRefData.current.forEach((p, i) => {
                p.position.addScaledVector(p.velocity, dt * 6);
                if (p.position.x < -halfW) p.position.x = halfW;
                if (p.position.x > halfW) p.position.x = -halfW;
                if (p.position.z < -halfH) p.position.z = halfH;
                if (p.position.z > halfH) p.position.z = -halfH;
                if (p.position.y > 1.2) p.position.y = 0.1;
                dummy.position.copy(p.position);
                dummy.scale.setScalar(0.35);
                dummy.updateMatrix();
                ambientRef.current.setMatrixAt(i, dummy.matrix);
            });
            ambientRef.current.count = ambientRefData.current.length;
            ambientRef.current.instanceMatrix.needsUpdate = true;
        }

        const currentProjectiles = new Map<string, { pos: THREE.Vector3; ownerId: string }>();
        const currentBombs = new Map<string, THREE.Vector3>();
        const entities = engine.entities as Entity[];

        for (let i = 0; i < entities.length; i++) {
            const ent = entities[i];
            if (ent.type === EntityType.PROJECTILE) {
                const p = ent as ProjectileEntity;
                const cx = p.x + p.w / 2;
                const cy = p.y + p.h / 2;
                const pos = new THREE.Vector3(to3D(cx, CONSTANTS.CANVAS_WIDTH), (p.w / TILE_SIZE) / 2, to3D(cy, CONSTANTS.CANVAS_HEIGHT));
                currentProjectiles.set(p.id, { pos, ownerId: p.ownerId });

                const prev = prevProjectiles.current.get(p.id);
                if (prev) {
                    const dir = pos.clone().sub(prev.pos);
                const dist = dir.length();
                if (dist > 0.01) {
                    const color = new THREE.Color(p.ownerId === 'player' ? CONSTANTS.COLORS.PROJECTILE_FRIENDLY : CONSTANTS.COLORS.PROJECTILE_ENEMY);
                    const steps = Math.min(3, Math.ceil(dist / 0.12));
                    for (let s = 0; s < steps; s++) {
                        const t = (s + 1) / (steps + 1);
                        const trailPos = prev.pos.clone().lerp(pos, t);
                        spawnParticle(trailPos, new THREE.Vector3(0, 0.03, 0), 0.45, 0.08, color);
                    }
                }
            }
            } else if (ent.type === EntityType.BOMB) {
                const b = ent as BombEntity;
                const cx = b.x + b.w / 2;
                const cy = b.y + b.h / 2;
                const pos = new THREE.Vector3(to3D(cx, CONSTANTS.CANVAS_WIDTH), (b.w / TILE_SIZE) / 2, to3D(cy, CONSTANTS.CANVAS_HEIGHT));
                currentBombs.set(b.id, pos);
            } else if (ent.type === EntityType.ENEMY || ent.type === EntityType.PLAYER) {
                const last = prevFlash.current.get(ent.id) || 0;
                const current = ent.flashTimer || 0;
                if (current > 0 && last <= 0) {
                    const cx = ent.x + ent.w / 2;
                    const cy = ent.y + ent.h / 2;
                    const pos = new THREE.Vector3(to3D(cx, CONSTANTS.CANVAS_WIDTH), (ent.w / TILE_SIZE) / 2 + 0.1, to3D(cy, CONSTANTS.CANVAS_HEIGHT));
                    const color = new THREE.Color(ent.type === EntityType.PLAYER ? '#93c5fd' : '#fbbf24');
                    spawnBurst(pos, color, 10, 0.8, 0.5);
                }
                prevFlash.current.set(ent.id, current);
            }
        }

        prevProjectiles.current.forEach((prev, id) => {
            if (!currentProjectiles.has(id)) {
                const color = new THREE.Color(prev.ownerId === 'player' ? '#60a5fa' : '#f97316');
                const burstCount = prev.ownerId === 'player' ? 10 : 18;
                const speed = prev.ownerId === 'player' ? 1.0 : 1.4;
                spawnBurst(prev.pos, color, burstCount, speed, 0.6);
            }
        });

        prevProjectiles.current = currentProjectiles;

        prevBombs.current.forEach((pos, id) => {
            if (!currentBombs.has(id)) {
                spawnBurst(pos, new THREE.Color('#f97316'), 60, 2.6, 0.9);
                spawnBurst(pos, new THREE.Color('#fde047'), 40, 2.0, 0.7);
                spawnBurst(pos, new THREE.Color('#fb7185'), 30, 2.2, 0.8);
                spawnBurst(pos, new THREE.Color('#0ea5e9'), 22, 1.6, 0.7);
                for (let i = 0; i < 18; i++) {
                    spawnParticle(
                        pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.4, 0, (Math.random() - 0.5) * 0.4)),
                        new THREE.Vector3((Math.random() - 0.5) * 0.25, 0.45 + Math.random() * 0.35, (Math.random() - 0.5) * 0.25),
                        1.2 + Math.random() * 0.6,
                        0.22 + Math.random() * 0.15,
                        new THREE.Color('#111827')
                    );
                }
                ringsRef.current.push({
                    position: pos.clone().setY(0.06),
                    life: 0.7,
                    maxLife: 0.7,
                    size: 0.7,
                    color: new THREE.Color('#fbbf24')
                });
                ringsRef.current.push({
                    position: pos.clone().setY(0.08),
                    life: 0.9,
                    maxLife: 0.9,
                    size: 1.1,
                    color: new THREE.Color('#f97316')
                });
            }
        });
        prevBombs.current = currentBombs;

        const particles = particlesRef.current;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                particles[i] = particles[particles.length - 1];
                particles.pop();
                continue;
            }
            p.velocity.multiplyScalar(0.96);
            p.position.addScaledVector(p.velocity, dt);
        }

        const rings = ringsRef.current;
        for (let i = rings.length - 1; i >= 0; i--) {
            const r = rings[i];
            r.life -= dt;
            if (r.life <= 0) {
                rings[i] = rings[rings.length - 1];
                rings.pop();
                continue;
            }
        }

        if (meshRef.current) {
            const count = Math.min(particles.length, MAX_PARTICLES);
            for (let i = 0; i < count; i++) {
                const p = particles[i];
                const scale = p.size * (p.life / p.maxLife);
                dummy.position.copy(p.position);
                dummy.scale.setScalar(scale);
                dummy.updateMatrix();
                meshRef.current.setMatrixAt(i, dummy.matrix);
                meshRef.current.setColorAt(i, p.color);
            }
            meshRef.current.count = count;
            meshRef.current.instanceMatrix.needsUpdate = true;
            if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
        }

        if (ringRef.current) {
            const count = Math.min(rings.length, MAX_EXPLOSIONS);
            for (let i = 0; i < count; i++) {
                const r = rings[i];
                const t = 1 - (r.life / r.maxLife);
                const scale = r.size * (0.6 + t * 2.2);
                dummy.position.copy(r.position);
                dummy.scale.set(scale, scale, scale);
                dummy.rotation.set(-Math.PI / 2, 0, 0);
                dummy.updateMatrix();
                ringRef.current.setMatrixAt(i, dummy.matrix);
                ringRef.current.setColorAt(i, r.color.clone().multiplyScalar(1.2 - t));
            }
            ringRef.current.count = count;
            ringRef.current.instanceMatrix.needsUpdate = true;
            if (ringRef.current.instanceColor) ringRef.current.instanceColor.needsUpdate = true;
        }
    });

    return (
        <group>
            <instancedMesh ref={ambientRef} args={[geom, ambientMat, AMBIENT_PARTICLES]} />
            <instancedMesh ref={ringRef} args={[ringGeom, ringMat, MAX_EXPLOSIONS]} />
            <instancedMesh ref={meshRef} args={[geom, material, MAX_PARTICLES]} />
        </group>
    );
});

export const GameScene: React.FC<RendererProps> = ({ engine }) => {
    const { camera } = useThree();

    useFrame(() => {
        engine.cameraQuaternion.copy(camera.quaternion);
    });

    const roomKey = engine.currentRoom ? `${engine.currentRoom.x},${engine.currentRoom.y}:${engine.roomRevision}` : 'void';

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

            <ParticleField engine={engine} />
            <ProjectileField engine={engine} />
            <EntityGroup key={engine.player.id} entity={engine.player} engine={engine} />
            
            {[...engine.entities.filter(ent => ent.type !== EntityType.PROJECTILE), ...Array.from(engine.remotePlayers.values())].map(ent => (
                <EntityGroup key={ent.id} entity={ent} engine={engine} />
            ))}
        </group>
    );
};
