
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { Stats } from '@react-three/drei';
import { GameEngine } from './game';
import { InputManager } from './utils';
import { GameStatus, Settings, Language, KeyMap, Stats as GameStats, Vector2, ItemType } from './types';
import { CONSTANTS, TRANSLATIONS, DEFAULT_KEYMAP } from './constants';
import { CHARACTERS } from './config/characters';
import { ITEMS, DROPS } from './config/items';
import { AssetLoader } from './assets';
import { GameScene } from './Renderer3D';
import * as THREE from 'three';

// --- UI Components ---

// Pixel Heart Icon
const PixelHeart: React.FC<{ full: boolean }> = ({ full }) => (
    <svg viewBox="0 0 16 16" className="w-6 h-6 md:w-8 md:h-8 mr-1 drop-shadow-md" style={{imageRendering: 'pixelated'}}>
       <path d="M2 5 h2 v3 h-2 v-3 M4 3 h2 v2 h-2 v-2 M6 3 h4 v2 h-4 v-2 M10 3 h2 v2 h-2 v-2 M12 5 h2 v3 h-2 v-3 M2 8 h2 v3 h-2 v-3 M12 8 h2 v3 h-2 v-3 M4 11 h2 v2 h-2 v-2 M10 11 h2 v2 h-2 v-2 M6 13 h4 v2 h-4 v-2" 
             fill={full ? "#ef4444" : "#374151"} /> 
       <path d="M4 4 h2 v1 h-2 v-1 M10 4 h1 v1 h-1 v-1" fill={full ? "#fca5a5" : "#4b5563"} opacity="0.6"/>
    </svg>
);

// Stat Bar (for Character Select)
const StatBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => (
    <div className="flex items-center gap-2 w-full text-sm md:text-base font-bold tracking-wide">
        <span className="w-10 text-gray-400 text-right">{label}</span>
        <div className="flex-1 h-3 bg-gray-800 rounded border border-gray-600 overflow-hidden relative">
            <div 
                className="h-full transition-all duration-300"
                style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: color }}
            />
        </div>
        <span className="w-6 text-right text-white">{value}</span>
    </div>
);

const AttributePill: React.FC<{ icon: string; value: string; title: string; className?: string }> = ({ icon, value, title, className }) => (
    <div className={`flex items-center gap-1 px-2 py-1 rounded border border-gray-700 bg-black/40 text-xs md:text-sm font-bold text-gray-200 ${className || ''}`} title={title} aria-label={title}>
        <span aria-hidden="true">{icon}</span>
        <span>{value}</span>
    </div>
);

// Icons
const PauseIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white">
        <rect x="6" y="4" width="4" height="16" rx="1" />
        <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
);

const PlayIcon = () => (
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current text-white">
        <path d="M8 5v14l11-7z" />
    </svg>
);

// Sprite Preview Component
const SpritePreview: React.FC<{ spriteName: string, assetLoader: AssetLoader, size?: number, className?: string }> = ({ spriteName, assetLoader, size = 64, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        const source = assetLoader.get(spriteName);
        if (canvas && source) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.imageSmoothingEnabled = false;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Maintain aspect ratio
                const scale = Math.min(canvas.width / source.width, canvas.height / source.height);
                const w = source.width * scale;
                const h = source.height * scale;
                const x = (canvas.width - w) / 2;
                const y = (canvas.height - h) / 2;
                ctx.drawImage(source, 0, 0, source.width, source.height, x, y, w, h);
            }
        }
    }, [spriteName, assetLoader]);
    return <canvas ref={canvasRef} width={size} height={size} className={className} style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
};

// Virtual Joystick
interface JoystickProps {
  onMove: (vec: Vector2) => void;
  color?: string;
  label?: string;
}

const VirtualJoystick: React.FC<JoystickProps> = ({ onMove, color = 'white', label }) => {
    const size = 120;
    const stickSize = 50;
    const [active, setActive] = useState(false);
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const ref = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => setActive(true);
    const handleTouchMove = (e: React.TouchEvent) => {
        if (!ref.current) return;
        const touch = e.targetTouches[0]; 
        const rect = ref.current.getBoundingClientRect();
        const dx = touch.clientX - (rect.left + rect.width / 2);
        const dy = touch.clientY - (rect.top + rect.height / 2);
        const dist = Math.sqrt(dx*dx + dy*dy);
        const maxDist = (size / 2) - (stickSize / 2);
        const angle = Math.atan2(dy, dx);
        const cappedDist = Math.min(dist, maxDist);
        const cappedX = Math.cos(angle) * cappedDist;
        const cappedY = Math.sin(angle) * cappedDist;
        
        setPos({ x: cappedX, y: cappedY });
        onMove({ x: cappedX / maxDist, y: cappedY / maxDist });
    };
    const handleTouchEnd = () => {
        setActive(false);
        setPos({ x: 0, y: 0 });
        onMove({ x: 0, y: 0 });
    };

    return (
        <div className="flex flex-col items-center justify-center select-none touch-none">
            <div 
                ref={ref}
                className={`relative rounded-full flex items-center justify-center border-4 transition-colors ${active ? 'border-white bg-white/10' : 'border-white/20 bg-black/20'}`}
                style={{ width: size, height: size }}
                onTouchStart={handleTouchStart} 
                onTouchMove={handleTouchMove} 
                onTouchEnd={handleTouchEnd} 
                onTouchCancel={handleTouchEnd}
            >
                <div 
                    className={`absolute rounded-full shadow-lg ${active ? 'bg-white' : 'bg-white/50'}`}
                    style={{ 
                        width: stickSize, 
                        height: stickSize, 
                        transform: `translate(${pos.x}px, ${pos.y}px)`,
                        backgroundColor: active ? color : undefined
                    }} 
                />
            </div>
            {label && <div className="mt-2 text-gray-500 text-xs font-bold uppercase tracking-widest">{label}</div>}
        </div>
    );
};

// Utils
const formatKey = (code: string) => {
    if (code.startsWith('Key')) return code.replace('Key', '');
    if (code.startsWith('Arrow')) return code.replace('Arrow', '↑'); 
    if (code === 'Space') return 'SPC';
    if (code === 'Escape') return 'ESC';
    if (code === 'Enter') return 'ENT';
    return code;
};

// Camera Control
const CameraRig = () => {
    const { camera, size } = useThree();
    useFrame(() => {
        const targetWidth = 18;
        camera.zoom = size.width / targetWidth;
        camera.updateProjectionMatrix();
    });
    return null;
};

// Main Loop
const GameLoop: React.FC<{ engine: GameEngine, input: React.MutableRefObject<InputManager | null>, joyMove: React.MutableRefObject<Vector2>, joyShoot: React.MutableRefObject<Vector2>, fpsLock: 30 | 60 }> = ({ engine, input, joyMove, joyShoot, fpsLock }) => {
    const { invalidate } = useThree();
    useEffect(() => {
        const frameInterval = 1000 / fpsLock;
        let lastTime = performance.now();
        let accumulator = 0;
        const loop = () => {
            const now = performance.now();
            const delta = now - lastTime;
            lastTime = now;
            accumulator += delta;

            let didUpdate = false;
            let steps = 0;
            while (accumulator >= frameInterval && steps < 2) {
                if (input.current) {
                    if (engine.status === GameStatus.PLAYING) {
                        const kbMove = input.current.getMovementVector();
                        const kbShoot = input.current.getShootingDirection();
                        const move = {
                            x: (Math.abs(kbMove.x) > 0 ? kbMove.x : joyMove.current.x),
                            y: (Math.abs(kbMove.y) > 0 ? kbMove.y : joyMove.current.y)
                        };
                        const shoot = (kbShoot && (Math.abs(kbShoot.x) > 0 || Math.abs(kbShoot.y) > 0)) ? kbShoot : (Math.abs(joyShoot.current.x) > 0.2 || Math.abs(joyShoot.current.y) > 0.2) ? joyShoot.current : null;
                        const restart = input.current.isRestartPressed();
                        const pause = input.current.isPausePressed();
                        engine.update({ move, shoot, restart, pause });
                    }
                }
                accumulator -= frameInterval;
                didUpdate = true;
                steps++;
            }
            if (didUpdate) invalidate();
            requestAnimationFrame(loop);
        };
        const id = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(id);
    }, [engine, input, joyMove, joyShoot, invalidate, fpsLock]);
    return null;
};

// --- SETTINGS CONFIG ---
const SETTING_ITEMS = [
    { id: 'lang', type: 'select' },
    { id: 'joystick', type: 'toggle' },
    { id: 'minimap', type: 'toggle' },
    { id: 'fpsLock', type: 'select' },
    { id: 'fps', type: 'toggle' },
    { id: 'fullscreen', type: 'toggle' },
    // Keys follow after this...
];

const ORDERED_KEYS = [
    'moveUp', 'moveDown', 'moveLeft', 'moveRight', 
    'shootUp', 'shootDown', 'shootLeft', 'shootRight', 
    'restart', 'pause', 'toggleFullscreen'
] as (keyof KeyMap)[];

const SETTINGS_STORAGE_KEY = 'birth-settings';

export default function App() {
  const engineRef = useRef<GameEngine | null>(null);
  const inputRef = useRef<InputManager | null>(null);
  const joystickMoveRef = useRef<Vector2>({ x: 0, y: 0 });
  const joystickShootRef = useRef<Vector2>({ x: 0, y: 0 });
  const keyListRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const uiAssetLoader = useMemo(() => new AssetLoader(), []);
  
  const [displayDims, setDisplayDims] = useState({ width: 1, height: 1 });
  
  const [gameStats, setGameStats] = useState<{
    hp: number; maxHp: number; floor: number; score: number; seed: number; items: number; notification: string | null;
    dungeon: {x:number, y:number, type: string, visited: boolean}[];
    currentRoomPos: {x:number, y:number};
    stats?: GameStats; nearbyItem?: any; boss?: any;
    themeName?: string | null;
    restartTimer?: number;
    inventory?: ItemType[];
  } | null>(null);
  
  const [status, setStatus] = useState<GameStatus>(GameStatus.MENU);
  const [showSettings, setShowSettings] = useState(false);
  
  const [waitingForKey, setWaitingForKey] = useState<keyof KeyMap | null>(null);
  const [menuSelection, setMenuSelection] = useState(0); 
  const [settingsSelection, setSettingsSelection] = useState(0);
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const [floorTransition, setFloorTransition] = useState<{ phase: 'in' | 'out'; key: number } | null>(null);
  const floorRef = useRef<number | null>(null);

  const [settings, setSettings] = useState<Settings>(() => {
    const isMobile = typeof window !== 'undefined' && (window.innerWidth <= 768 || /Mobi|Android/i.test(navigator.userAgent));
    const baseSettings: Settings = {
        language: Language.ZH_CN,
        showMinimap: true,
        showFPS: false,
        fpsLock: 60,
        isFullScreen: false,
        enableJoysticks: isMobile,
        keyMap: { ...DEFAULT_KEYMAP }
    };
    if (typeof window === 'undefined') return baseSettings;

    try {
        const storedRaw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (!storedRaw) return baseSettings;
        const stored = JSON.parse(storedRaw);
        const langValues = Object.values(Language);
        const language = langValues.includes(stored.language) ? stored.language : baseSettings.language;
        const fpsLock = stored.fpsLock === 30 ? 30 : 60;
        return {
            ...baseSettings,
            language,
            showMinimap: stored.showMinimap ?? baseSettings.showMinimap,
            showFPS: stored.showFPS ?? baseSettings.showFPS,
            fpsLock,
            enableJoysticks: stored.enableJoysticks ?? baseSettings.enableJoysticks,
            keyMap: { ...baseSettings.keyMap, ...(stored.keyMap || {}) },
            isFullScreen: !!document.fullscreenElement
        };
    } catch {
        return baseSettings;
    }
  });

  const t = (key: string) => {
    if (key.includes(':')) {
        const parts = key.split(':');
        const name = TRANSLATIONS[settings.language][parts[0]] || parts[0];
        const desc = TRANSLATIONS[settings.language][parts[1]] || parts[1];
        return `${name}: ${desc}`;
    }
    return TRANSLATIONS[settings.language][key] || key;
  };

  useEffect(() => {
    const handleResize = () => {
        if (containerRef.current) {
            const { clientWidth, clientHeight } = containerRef.current;
            
            // Mobile Adaptation Constraint: 
            // The canvas should never exceed 90% of the available view port to ensure 
            // it doesn't touch the edges or interfere with browser UI/gestures.
            const MAX_RATIO = 0.90;
            const maxWidth = clientWidth * MAX_RATIO;
            const maxHeight = clientHeight * MAX_RATIO;

            const aspect = CONSTANTS.CANVAS_WIDTH / CONSTANTS.CANVAS_HEIGHT;
            
            // Try to fit by width
            let w = maxWidth;
            let h = w / aspect;
            
            // If resulting height is too tall, fit by height instead
            if (h > maxHeight) {
                h = maxHeight;
                w = h * aspect;
            }
            
            setDisplayDims({ width: Math.floor(w), height: Math.floor(h) });
        }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    const interval = setInterval(handleResize, 500);
    return () => {
        window.removeEventListener('resize', handleResize);
        clearInterval(interval);
    };
  }, [settings.enableJoysticks, status]);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
        if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFsChange = () => setSettings(s => ({...s, isFullScreen: !!document.fullscreenElement}));
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    inputRef.current = new InputManager(settings.keyMap);
    engineRef.current = new GameEngine((stats) => {
      setGameStats(stats);
      if (engineRef.current?.status !== status) {
        setStatus(engineRef.current?.status || GameStatus.MENU);
      }
    });
    engineRef.current.cameraQuaternion = new THREE.Quaternion();
    return () => { inputRef.current?.destroy(); };
  }, []);

  useEffect(() => { if (inputRef.current) inputRef.current.updateKeyMap(settings.keyMap); }, [settings.keyMap]);

  useEffect(() => {
    const currentFloor = gameStats?.floor ?? null;
    if (currentFloor === null) return;
    if (floorRef.current === null) {
        floorRef.current = currentFloor;
        return;
    }
    if (floorRef.current !== currentFloor) {
        floorRef.current = currentFloor;
        const transitionKey = Date.now();
        setFloorTransition({ phase: 'out', key: transitionKey });
        const toIn = setTimeout(() => setFloorTransition({ phase: 'in', key: transitionKey }), 1000);
        const toClear = setTimeout(() => setFloorTransition(null), 2000);
        return () => { clearTimeout(toIn); clearTimeout(toClear); };
    }
  }, [gameStats?.floor]);

  // Key Rebinding Listener
  useEffect(() => {
    if (!waitingForKey) return;
    const handleRebind = (e: KeyboardEvent) => {
      e.preventDefault(); e.stopPropagation();
      const code = e.code;
      if (code === 'Escape') { setWaitingForKey(null); return; }
      setSettings(prev => ({ ...prev, keyMap: { ...prev.keyMap, [waitingForKey]: code } }));
      setWaitingForKey(null);
    };
    window.addEventListener('keydown', handleRebind, { once: true });
    return () => window.removeEventListener('keydown', handleRebind);
  }, [waitingForKey]);

  const startGame = () => {
    if (engineRef.current) {
      engineRef.current.startNewGame(CHARACTERS[selectedCharIndex].id);
      setStatus(GameStatus.PLAYING);
      setShowSettings(false);
    }
  };
  
  const resumeGame = () => { if (engineRef.current) { engineRef.current.resumeGame(); setStatus(GameStatus.PLAYING); } };
  const returnToMenu = () => { if (engineRef.current) engineRef.current.status = GameStatus.MENU; setStatus(GameStatus.MENU); setShowSettings(false); };
  const toggleMobilePause = () => {
      if (status === GameStatus.PLAYING) { if (engineRef.current) engineRef.current.status = GameStatus.PAUSED; setStatus(GameStatus.PAUSED); } 
      else if (status === GameStatus.PAUSED) { resumeGame(); }
  };
  const simulateEnter = () => {
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', bubbles: true }));
  };

  // Reset menu selection when state changes
  useEffect(() => {
      setMenuSelection(0);
      setSettingsSelection(0);
  }, [status, showSettings]);

  // Keyboard Navigation System
  useEffect(() => {
      if (waitingForKey) return; 

      const handleMenuNav = (e: KeyboardEvent) => {
           // Prevent scrolling with arrows in menus
           if (status !== GameStatus.PLAYING && ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {
               e.preventDefault();
           }

           const isEnter = e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter';
           const isEsc = e.code === 'Escape';

           // Global Toggle
           if (e.code === settings.keyMap.toggleFullscreen) {
               toggleFullScreen();
               return;
           }

           // --- SETTINGS MENU NAV ---
           if (showSettings) {
               const totalItems = SETTING_ITEMS.length + ORDERED_KEYS.length + 1; // +1 for Close

               if (e.code === 'ArrowUp') setSettingsSelection(p => (p - 1 + totalItems) % totalItems);
               if (e.code === 'ArrowDown') setSettingsSelection(p => (p + 1) % totalItems);
               
               // Language Toggle (Index 0)
               if (settingsSelection === 0 && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
                   const langs = Object.values(Language);
                   const idx = langs.indexOf(settings.language);
                   const dir = e.code === 'ArrowLeft' ? -1 : 1;
                   setSettings(s => ({...s, language: langs[(idx + dir + langs.length) % langs.length]}));
               }
               if (settingsSelection === 3 && (e.code === 'ArrowLeft' || e.code === 'ArrowRight')) {
                   setSettings(s => ({...s, fpsLock: s.fpsLock === 60 ? 30 : 60}));
               }

               if (isEnter) {
                   if (settingsSelection === 0) { // Lang
                        const langs = Object.values(Language);
                        const idx = langs.indexOf(settings.language);
                        setSettings(s => ({...s, language: langs[(idx + 1) % langs.length]}));
                   }
                   else if (settingsSelection === 1) setSettings(s => ({...s, enableJoysticks: !s.enableJoysticks}));
                   else if (settingsSelection === 2) setSettings(s => ({...s, showMinimap: !s.showMinimap}));
                   else if (settingsSelection === 3) setSettings(s => ({...s, fpsLock: s.fpsLock === 60 ? 30 : 60}));
                   else if (settingsSelection === 4) setSettings(s => ({...s, showFPS: !s.showFPS}));
                   else if (settingsSelection === 5) toggleFullScreen();
                   // Key Bindings
                   else if (settingsSelection >= 6 && settingsSelection < 6 + ORDERED_KEYS.length) {
                       const keyIdx = settingsSelection - 6;
                       setWaitingForKey(ORDERED_KEYS[keyIdx]);
                   }
                   // Close
                   else if (settingsSelection === totalItems - 1) {
                       setShowSettings(false);
                   }
               }
               
               if (isEsc) setShowSettings(false);
               
               // Auto-scroll logic for list
               if (keyListRef.current && settingsSelection >= 6) {
                   const listIndex = settingsSelection - 6;
                   // Simple heuristic to scroll list
                   const element = keyListRef.current.children[listIndex] as HTMLElement;
                   if(element) element.scrollIntoView({block: "nearest"});
               }
               return; 
           }

           // --- MAIN MENU NAV ---
           if (status === GameStatus.MENU) {
              if (e.code === 'ArrowUp') setMenuSelection(prev => (prev - 1 + 2) % 2);
              if (e.code === 'ArrowDown') setMenuSelection(prev => (prev + 1) % 2);
              if (isEnter) { 
                  if (menuSelection === 0) setStatus(GameStatus.CHARACTER_SELECT); 
                  else setShowSettings(true); 
              }
           }
           // --- PAUSE MENU NAV ---
           else if (status === GameStatus.PAUSED) {
              if (e.code === 'ArrowUp') setMenuSelection(prev => (prev - 1 + 4) % 4);
              if (e.code === 'ArrowDown') setMenuSelection(prev => (prev + 1) % 4);
              if (isEnter) {
                   if (menuSelection === 0) resumeGame();
                   if (menuSelection === 1) setShowSettings(true);
                   if (menuSelection === 2) returnToMenu();
                   if (menuSelection === 3 && gameStats) navigator.clipboard.writeText(gameStats.seed.toString());
              }
              if (isEsc) resumeGame();
           }
           // --- GAME OVER NAV ---
           else if (status === GameStatus.GAME_OVER) {
               if (e.code === 'ArrowUp') setMenuSelection(prev => (prev - 1 + 2) % 2);
               if (e.code === 'ArrowDown') setMenuSelection(prev => (prev + 1) % 2);
               if (isEnter) {
                   if (menuSelection === 0) startGame();
                   if (menuSelection === 1) returnToMenu();
               }
           }
           // --- CHAR SELECT NAV ---
           else if (status === GameStatus.CHARACTER_SELECT) {
               if (e.code === 'ArrowLeft') setSelectedCharIndex(p => (p - 1 + CHARACTERS.length) % CHARACTERS.length);
               if (e.code === 'ArrowRight') setSelectedCharIndex(p => (p + 1) % CHARACTERS.length);
               if (isEnter) startGame();
               if (isEsc) setStatus(GameStatus.MENU);
           }
      };
      window.addEventListener('keydown', handleMenuNav);
      return () => window.removeEventListener('keydown', handleMenuNav);
  }, [status, showSettings, menuSelection, waitingForKey, selectedCharIndex, settingsSelection, settings, gameStats]);

  const selectedChar = CHARACTERS[selectedCharIndex];
  const isInGame = status === GameStatus.PLAYING || status === GameStatus.PAUSED;

  const getBtnClass = (index: number) => `px-8 py-3 mb-2 md:mb-4 font-bold text-xl border-4 transition-all duration-75 transform text-center w-64 md:w-80 ${
      menuSelection === index 
        ? 'bg-white text-black border-white scale-105' 
        : 'bg-black/60 text-gray-400 border-gray-700 hover:border-gray-500'
  }`;

  const stats = gameStats?.stats;
  const floorThemeLabel = gameStats?.themeName || '???';
  const fireRate = stats ? Math.max(0.1, Math.round((60 / stats.fireRate) * 10) / 10) : null;
  const range = stats ? Math.round(stats.range) : null;
  const speed = stats ? Math.round(stats.speed * 10) / 10 : null;
  const knockback = stats ? Math.round(stats.knockback * 10) / 10 : null;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#050505] text-white select-none overflow-hidden" style={{ fontFamily: "'GameFontZh', monospace" }}>
      
      {/* HEADER */}
      <header className="flex-none h-16 bg-neutral-900 border-b border-gray-800 flex items-center justify-between px-4 z-50 shadow-md">
         <div className="flex flex-col items-start w-1/3">
            {isInGame && (
                <>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1 hidden md:block">{t('HEALTH')}</div>
                    <div className="flex flex-wrap max-w-[200px]">
                        {gameStats ? (() => {
                            const hearts = [];
                            const totalHearts = Math.ceil(gameStats.maxHp / 2);
                            for(let i=0; i<totalHearts; i++) {
                                const heartHealth = Math.max(0, Math.min(2, gameStats.hp - (i * 2)));
                                hearts.push(<PixelHeart key={i} full={heartHealth > 0} />);
                            }
                            return hearts;
                        })() : <div className="text-gray-700 text-sm">--/--</div>}
                    </div>
                </>
            )}
         </div>
         <div className="flex flex-col items-center w-1/3">
            {isInGame && (
                <>
                    <div className="flex items-baseline gap-2">
                        <span className="text-amber-500 font-black text-2xl md:text-3xl tracking-tighter">
                            第{gameStats?.floor || 1}层【{(gameStats?.floor || 1) <= 5 ? floorThemeLabel : '???'}】
                        </span>
                    </div>
                    <div className="text-gray-400 font-bold text-sm md:text-base tracking-widest">{gameStats?.score || 0}</div>
                </>
            )}
         </div>
         <div className="flex items-center justify-end w-1/3 gap-2">
             <div onClick={toggleMobilePause} className="md:hidden p-2 bg-gray-800 rounded border border-gray-700 active:bg-gray-700">
                 {status === GameStatus.PAUSED ? <PlayIcon /> : <PauseIcon />}
             </div>
         </div>
      </header>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col relative bg-[#0a0a0a]">
              <div ref={containerRef} className="flex-1 flex items-center justify-center p-2 relative w-full h-full">
                  {stats && isInGame && (
                      <div className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
                          <AttributePill icon="🔫" value={`${fireRate}`} title="Fire Rate" />
                          <AttributePill icon="🎯" value={`${range}`} title="Range" />
                          <AttributePill icon="🏃" value={`${speed}`} title="Speed" />
                          <AttributePill icon="💥" value={`${knockback}`} title="Knockback" />
                      </div>
                  )}
                  <div 
                    className="relative shadow-2xl overflow-hidden bg-black border-4 border-neutral-800" 
                    style={{ width: displayDims.width, height: displayDims.height }}
                  >
                        {floorTransition && (
                            <div
                                key={floorTransition.key}
                                className={`mosaic-overlay ${floorTransition.phase === 'out' ? 'mosaic-in' : 'mosaic-out'}`}
                            />
                        )}
                        <Canvas
                            orthographic
                            shadows
                            dpr={window.devicePixelRatio}
                            gl={{ antialias: false, toneMapping: THREE.NoToneMapping }}
                            camera={{ position: [0, 40, 30], zoom: 50, near: 0.1, far: 1000 }}
                            onCreated={({ camera, scene }) => {
                                scene.background = new THREE.Color('#111');
                                camera.lookAt(0, 0, 0); 
                            }}
                        >
                            <CameraRig />
                            {settings.showFPS && <Stats className="fps-stats" />}
                            {engineRef.current && (
                                <>
                                <GameLoop engine={engineRef.current} input={inputRef} joyMove={joystickMoveRef} joyShoot={joystickShootRef} fpsLock={settings.fpsLock} />
                                    <GameScene engine={engineRef.current} />
                                </>
                            )}
                        </Canvas>

                        {/* RESTART BAR */}
                        {gameStats && gameStats.restartTimer !== undefined && gameStats.restartTimer > 0 && (
                            <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
                                <div className="text-red-500 text-lg md:text-xl mb-2 font-black tracking-widest bg-black/90 px-4 py-1 rounded border border-red-500/50 shadow-lg whitespace-nowrap">{t('HOLD_R')}</div>
                                <div className="w-48 md:w-64 h-4 bg-gray-900 rounded-full overflow-hidden border border-gray-500 shadow-xl">
                                    <div className="h-full bg-red-600" style={{width: `${Math.min(100, (gameStats.restartTimer / 60) * 100)}%`}} />
                                </div>
                            </div>
                        )}

                        {/* BOSS BAR */}
                        {gameStats && gameStats.boss && (
                            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 w-[80%] max-w-[600px] z-10">
                                <div className="text-center text-red-500 font-bold mb-1 text-lg tracking-[0.2em] uppercase drop-shadow-md">{gameStats.boss.name}</div>
                                <div className="h-4 bg-red-950/80 border-2 border-red-900 rounded-sm relative overflow-hidden shadow-lg">
                                    <div className="h-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-300" style={{ width: `${(gameStats.boss.hp / gameStats.boss.maxHp) * 100}%` }} />
                                </div>
                            </div>
                        )}

                        {/* PICKUP NOTIFICATION */}
                        {gameStats && gameStats.nearbyItem && (
                            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/95 border border-amber-500 px-4 py-2 rounded text-center z-40 shadow-xl min-w-[200px]">
                                <div className="text-amber-400 font-bold text-lg">{t(gameStats.nearbyItem.name as string)}</div>
                                <div className="text-gray-400 text-sm">{t(gameStats.nearbyItem.desc as string)}</div>
                            </div>
                        )}

                        {/* MAIN MENU */}
                        {status === GameStatus.MENU && !showSettings && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
                                <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-400 to-blue-900 mb-8 tracking-tighter drop-shadow-2xl">{t('GAME_TITLE')}</h1>
                                <button className={getBtnClass(0)} onClick={() => setStatus(GameStatus.CHARACTER_SELECT)} onMouseEnter={() => setMenuSelection(0)}>{t('START_RUN')}</button>
                                <button className={getBtnClass(1)} onClick={() => setShowSettings(true)} onMouseEnter={() => setMenuSelection(1)}>{t('SETTINGS')}</button>
                            </div>
                        )}

                        {/* PAUSE MENU */}
                        {status === GameStatus.PAUSED && !showSettings && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md">
                                <h2 className="text-5xl md:text-6xl font-black text-white mb-8 tracking-[0.2em] border-b-4 border-white pb-4">{t('PAUSE_TITLE')}</h2>
                                <div className="flex flex-col items-center">
                                    <button className={getBtnClass(0)} onClick={resumeGame} onMouseEnter={() => setMenuSelection(0)}>{t('RESUME')}</button>
                                    <button className={getBtnClass(1)} onClick={() => setShowSettings(true)} onMouseEnter={() => setMenuSelection(1)}>{t('SETTINGS')}</button>
                                    <button className={getBtnClass(2)} onClick={returnToMenu} onMouseEnter={() => setMenuSelection(2)}>{t('RETURN_TO_MENU')}</button>
                                    <button className={getBtnClass(3)} onClick={() => gameStats && navigator.clipboard.writeText(gameStats.seed.toString())} onMouseEnter={() => setMenuSelection(3)}>
                                        <span className="flex items-center justify-between w-full text-sm md:text-base">
                                            <span className="mr-3">SEED: {gameStats?.seed ?? '--'}</span>
                                            <span className="px-2 py-1 border border-gray-500 text-[10px] uppercase tracking-widest">Copy</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* GAME OVER */}
                        {status === GameStatus.GAME_OVER && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md">
                                <h2 className="text-6xl font-black text-red-600 mb-4">{t('GAME_OVER')}</h2>
                                <div className="text-white mb-8 text-2xl font-bold">{t('SCORE')}: <span className="text-yellow-400">{gameStats?.score}</span></div>
                                <button className={getBtnClass(0)} onClick={startGame} onMouseEnter={() => setMenuSelection(0)}>{t('TRY_AGAIN')}</button>
                                <button className={getBtnClass(1)} onClick={returnToMenu} onMouseEnter={() => setMenuSelection(1)}>{t('RETURN_TO_MENU')}</button>
                            </div>
                        )}

                        {/* CHARACTER SELECT */}
                        {status === GameStatus.CHARACTER_SELECT && (
                            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
                                <div className="flex items-center gap-8 mb-8">
                                    <button onClick={() => setSelectedCharIndex(p => (p - 1 + CHARACTERS.length) % CHARACTERS.length)} className="text-6xl text-gray-600 hover:text-white">‹</button>
                                    <div className="text-center">
                                        <div className="w-32 h-32 mx-auto bg-gray-800 rounded-full mb-4 flex items-center justify-center border-4 border-gray-700 overflow-hidden">
                                            <div className="transform scale-[2.5]"><SpritePreview spriteName={selectedChar.sprite} assetLoader={uiAssetLoader} /></div>
                                        </div>
                                        <div className="text-3xl font-black text-cyan-400 mb-2">{t(selectedChar.nameKey)}</div>
                                        <div className="text-gray-400 h-12 text-sm max-w-[200px] mx-auto">{t(selectedChar.descKey)}</div>
                                        <div className="mt-4 space-y-1 bg-gray-900 p-3 rounded border border-gray-700 w-64">
                                            <StatBar label="HP" value={selectedChar.baseStats.hp} max={10} color="#ef4444" />
                                            <StatBar label="DMG" value={selectedChar.baseStats.damage} max={6} color="#ef4444" />
                                            <StatBar label="SPD" value={selectedChar.baseStats.speed} max={2.5} color="#3b82f6" />
                                        </div>
                                    </div>
                                    <button onClick={() => setSelectedCharIndex(p => (p + 1) % CHARACTERS.length)} className="text-6xl text-gray-600 hover:text-white">›</button>
                                </div>
                                <button className="px-10 py-3 bg-white text-black font-black text-2xl hover:bg-cyan-400 transition-colors" onClick={startGame}>START</button>
                                <button className="mt-4 text-gray-500 hover:text-white underline" onClick={() => setStatus(GameStatus.MENU)}>CANCEL</button>
                            </div>
                        )}

                        {/* SETTINGS MODAL */}
                        {showSettings && (
                            <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
                                <div className="bg-neutral-900 border-2 border-gray-600 p-6 w-full max-w-lg shadow-2xl max-h-[90%] overflow-y-auto flex flex-col">
                                    <h2 className="text-3xl font-bold text-white mb-4 border-b border-gray-700 pb-2">{t('SETTING_TITLE')}</h2>
                                    <div className="space-y-2 flex-1 overflow-y-auto pr-2 custom-scrollbar" ref={keyListRef}>
                                        
                                        {/* 0: Language */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 0 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={() => {
                                            const langs = Object.values(Language);
                                            const idx = langs.indexOf(settings.language);
                                            setSettings(s => ({...s, language: langs[(idx + 1) % langs.length]}));
                                        }} onMouseEnter={() => setSettingsSelection(0)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_LANG')}</span>
                                            <div className="flex gap-1">
                                                {Object.values(Language).map(l => (
                                                    <span key={l} className={`px-2 py-1 text-xs font-bold border rounded ${settings.language === l ? 'bg-white text-black' : 'text-gray-500 border-gray-700'}`}>{l.split('-')[1] || l.toUpperCase()}</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 1: Joysticks */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 1 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={() => setSettings(s => ({...s, enableJoysticks: !s.enableJoysticks}))} onMouseEnter={() => setSettingsSelection(1)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_JOYSTICKS')}</span>
                                            <div className={`w-6 h-6 border rounded flex items-center justify-center ${settings.enableJoysticks ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                                {settings.enableJoysticks && <div className="w-3 h-3 bg-white rounded-sm" />}
                                            </div>
                                        </div>

                                        {/* 2: Minimap */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 2 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={() => setSettings(s => ({...s, showMinimap: !s.showMinimap}))} onMouseEnter={() => setSettingsSelection(2)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_MINIMAP')}</span>
                                            <div className={`w-6 h-6 border rounded flex items-center justify-center ${settings.showMinimap ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                                {settings.showMinimap && <div className="w-3 h-3 bg-white rounded-sm" />}
                                            </div>
                                        </div>

                                        {/* 3: FPS Lock */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 3 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={() => setSettings(s => ({...s, fpsLock: s.fpsLock === 60 ? 30 : 60}))} onMouseEnter={() => setSettingsSelection(3)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_FPS_LOCK')}</span>
                                            <div className="flex gap-1">
                                                {[30, 60].map(v => (
                                                    <span key={v} className={`px-2 py-1 text-xs font-bold border rounded ${settings.fpsLock === v ? 'bg-white text-black' : 'text-gray-500 border-gray-700'}`}>{v}FPS</span>
                                                ))}
                                            </div>
                                        </div>

                                        {/* 4: FPS */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 4 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={() => setSettings(s => ({...s, showFPS: !s.showFPS}))} onMouseEnter={() => setSettingsSelection(4)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_FPS')}</span>
                                            <div className={`w-6 h-6 border rounded flex items-center justify-center ${settings.showFPS ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                                {settings.showFPS && <div className="w-3 h-3 bg-white rounded-sm" />}
                                            </div>
                                        </div>

                                        {/* 5: Fullscreen */}
                                        <div className={`flex justify-between items-center p-2 rounded cursor-pointer ${settingsSelection === 5 ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} onClick={toggleFullScreen} onMouseEnter={() => setSettingsSelection(5)}>
                                            <span className="text-gray-300 font-bold">{t('SETTING_FULLSCREEN')}</span>
                                            <div className={`w-6 h-6 border rounded flex items-center justify-center ${settings.isFullScreen ? 'bg-cyan-500 border-cyan-500' : 'border-gray-600'}`}>
                                                {settings.isFullScreen && <div className="w-3 h-3 bg-white rounded-sm" />}
                                            </div>
                                        </div>

                                        {/* 5+: Keys */}
                                        <div className="pt-2 border-t border-gray-700 mt-2">
                                            <div className="text-gray-500 text-xs font-bold uppercase mb-2">{t('SETTING_KEYS')}</div>
                                            {ORDERED_KEYS.map((key, idx) => {
                                                const globalIdx = 6 + idx;
                                                const isActive = settingsSelection === globalIdx;
                                                const isWaiting = waitingForKey === key;
                                                return (
                                                    <div key={key} className={`flex justify-between items-center p-2 rounded cursor-pointer mb-1 ${isActive ? 'bg-white/10 border border-white/50' : 'border border-transparent'}`} 
                                                         onClick={() => setWaitingForKey(key)}
                                                         onMouseEnter={() => setSettingsSelection(globalIdx)}>
                                                        <span className="text-gray-400 text-sm">{t(`KEY_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}`)}</span>
                                                        <span className={`font-bold ${isWaiting ? 'text-red-500 animate-pulse' : 'text-cyan-400'}`}>
                                                            {isWaiting ? '...' : formatKey(settings.keyMap[key])}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    
                                    {/* Close Button */}
                                    <div className="mt-4 pt-2 border-t border-gray-700">
                                        <button 
                                            className={`w-full py-3 font-bold border-2 transition-colors ${settingsSelection === (6 + ORDERED_KEYS.length) ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-gray-600'}`} 
                                            onClick={() => setShowSettings(false)}
                                            onMouseEnter={() => setSettingsSelection(6 + ORDERED_KEYS.length)}
                                        >
                                            {t('CLOSE')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                  </div>
              </div>
          </main>

          {/* DESKTOP SIDEBAR */}
          {isInGame && (
          <aside className="hidden md:flex flex-col w-72 bg-[#080808] border-l border-gray-800 z-40">
               <div className="p-4 border-b border-gray-800 bg-black/40 h-72 flex flex-col items-center justify-center">
                   <div className="text-gray-600 text-xs font-bold uppercase mb-2 w-full text-center tracking-widest">{t('MAP')}</div>
                   <div className="relative w-full h-full bg-[#050505] rounded border border-gray-800 flex items-center justify-center overflow-hidden">
                       {settings.showMinimap && gameStats && gameStats.dungeon ? (() => {
                            const xs = gameStats.dungeon.map(r => r.x);
                            const ys = gameStats.dungeon.map(r => r.y);
                            const minX = Math.min(...xs); const maxX = Math.max(...xs);
                            const minY = Math.min(...ys); const maxY = Math.max(...ys);
                            const w = maxX - minX + 1; const h = maxY - minY + 1;
                            const cellSize = Math.min(20, 200 / Math.max(w, h));
                            return (
                                <div className="relative" style={{ width: w*cellSize, height: h*cellSize }}>
                                    {gameStats.dungeon.map((r, i) => (
                                        <div key={i} 
                                            className={`absolute border border-black/20 rounded-sm ${r.x === gameStats.currentRoomPos.x && r.y === gameStats.currentRoomPos.y ? 'bg-white z-10 shadow-[0_0_8px_rgba(255,255,255,0.8)]' : r.visited ? (r.type === 'BOSS' ? 'bg-red-900' : r.type === 'ITEM' ? 'bg-amber-600' : r.type === 'CHEST' ? 'bg-yellow-500' : r.type === 'DEVIL' ? 'bg-rose-700' : 'bg-gray-600') : 'bg-gray-800'}`}
                                            style={{ left: (r.x - minX)*cellSize, top: (r.y - minY)*cellSize, width: cellSize, height: cellSize }} 
                                        />
                                    ))}
                                </div>
                            );
                       })() : <div className="text-gray-800 text-xs">OFFLINE</div>}
                   </div>
               </div>
               <div className="flex-1 p-4 overflow-y-auto custom-scrollbar bg-neutral-900/50">
                   <div className="text-gray-600 text-xs font-bold uppercase mb-3 w-full text-center tracking-widest border-b border-gray-800 pb-2">{t('ITEMS')}</div>
                   <div className="grid grid-cols-4 gap-2">
                       {gameStats && gameStats.inventory && gameStats.inventory.map((itemType, idx) => {
                           const conf = ITEMS.find(i => i.type === itemType) || DROPS.find(d => d.type === itemType);
                           return (
                               <div key={idx} className="aspect-square bg-black border border-gray-700 rounded p-1 flex items-center justify-center relative group hover:border-amber-500 transition-colors">
                                   <SpritePreview spriteName={conf ? conf.sprite : 'ITEM'} assetLoader={uiAssetLoader} size={40} />
                                   <div className="absolute right-full top-0 mr-2 w-48 bg-black border border-amber-600 p-2 z-50 hidden group-hover:block rounded shadow-xl">
                                       <div className="text-amber-500 font-bold text-sm">{conf ? t(conf.nameKey) : itemType}</div>
                                       <div className="text-gray-400 text-xs">{conf ? t(conf.descKey) : ''}</div>
                                   </div>
                               </div>
                           );
                       })}
                       {(!gameStats || !gameStats.inventory || gameStats.inventory.length === 0) && (
                           <div className="col-span-4 text-center text-gray-700 text-xs italic py-4">Empty</div>
                       )}
                   </div>
               </div>
          </aside>
          )}
      </div>

      {/* MOBILE INFO */}
      {isInGame && (
      <div className="md:hidden flex h-24 bg-neutral-900 border-t border-gray-800 flex-none overflow-hidden">
          <div className="w-24 h-full border-r border-gray-800 p-2 flex items-center justify-center bg-black/20">
               {settings.showMinimap && gameStats && gameStats.dungeon && (
                   <div className="relative w-full h-full flex items-center justify-center transform scale-75 origin-center">
                        {(() => {
                            const xs = gameStats.dungeon.map(r => r.x);
                            const ys = gameStats.dungeon.map(r => r.y);
                            const minX = Math.min(...xs); const minY = Math.min(...ys);
                            return (
                                <div className="relative">
                                    {gameStats.dungeon.map((r, i) => (
                                        <div key={i} className={`absolute w-3 h-3 rounded-sm ${r.x === gameStats.currentRoomPos.x && r.y === gameStats.currentRoomPos.y ? 'bg-white' : r.visited ? 'bg-gray-500' : 'bg-gray-800'}`}
                                             style={{ left: (r.x - minX)*12, top: (r.y - minY)*12 }} />
                                    ))}
                                </div>
                            );
                        })()}
                   </div>
               )}
          </div>
          <div className="flex-1 p-2 overflow-x-auto whitespace-nowrap flex items-center gap-2 custom-scrollbar">
               {gameStats && gameStats.inventory && gameStats.inventory.length > 0 ? gameStats.inventory.map((itemType, idx) => {
                   const conf = ITEMS.find(i => i.type === itemType);
                   return (
                       <div key={idx} className="inline-block w-16 h-16 bg-black border border-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                           <SpritePreview spriteName={conf ? conf.sprite : 'ITEM'} assetLoader={uiAssetLoader} size={48} />
                       </div>
                   );
               }) : <span className="text-gray-700 text-sm italic pl-2">No Items</span>}
          </div>
      </div>
      )}

      {/* FOOTER */}
      {settings.enableJoysticks && (
          <div className="flex-none h-48 bg-black/95 border-t-2 border-gray-800 relative z-50 flex items-center justify-between px-8 md:px-32">
              <VirtualJoystick onMove={(v) => joystickMoveRef.current = v} label="MOVE" />
              <div className="flex flex-col gap-4 items-center justify-center">
                  <button onClick={toggleMobilePause} className="w-16 h-16 rounded-full bg-gray-800 border border-gray-600 flex items-center justify-center active:bg-gray-700">
                      {status === GameStatus.PAUSED ? <PlayIcon /> : <PauseIcon />}
                  </button>
                  {/* Added 'A' Button simulating Enter key */}
                  <button onClick={simulateEnter} className="w-16 h-16 rounded-full bg-green-700 border-2 border-green-500 flex items-center justify-center active:bg-green-600 shadow-lg" aria-label="Confirm">
                      <span className="font-black text-2xl text-white">A</span>
                  </button>
              </div>
              <VirtualJoystick onMove={(v) => joystickShootRef.current = v} label="SHOOT" color="#ef4444" />
          </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: #111; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #444; border-radius: 3px; }
        .fps-stats { position: absolute !important; top: 0px !important; left: 0px !important; z-index: 100; transform: scale(1.2); transform-origin: top left; }
        .mosaic-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(0,0,0,0.45) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,0,0,0.45) 1px, transparent 1px);
          background-size: 6px 6px;
          opacity: 0;
          z-index: 70;
        }
        .mosaic-in { animation: mosaicIn 1s steps(6) forwards; }
        .mosaic-out { animation: mosaicOut 1s steps(6) forwards; }
        @keyframes mosaicIn {
          0% { opacity: 0; background-size: 4px 4px; }
          100% { opacity: 1; background-size: 24px 24px; }
        }
        @keyframes mosaicOut {
          0% { opacity: 1; background-size: 24px 24px; }
          100% { opacity: 0; background-size: 4px 4px; }
        }
      `}</style>
    </div>
  );
}
