export interface RoomTheme {
  id: number;
  name: string;
  wallSprite: string;
  floorSprite: string;
  rockSprite: string;
  bgSprite: string;
  wall: { base: string; highlight: string; shadow: string };
  floor: { base: string; var1: string; var2: string };
  rock: { base: string; highlight: string; shadow: string };
  obstacle: { main: string; dark: string; highlight: string };
  bg: string;
}

export const ROOM_THEMES: RoomTheme[] = [
  {
    id: 0,
    name: 'crypt',
    wallSprite: 'WALL_VARIANT_0',
    floorSprite: 'FLOOR_VARIANT_0',
    rockSprite: 'ROCK_VARIANT_0',
    bgSprite: 'BG_VARIANT_0',
    wall: { base: '#2a2a2a', highlight: '#3d3d3d', shadow: '#141414' },
    floor: { base: '#1b1b1b', var1: '#222222', var2: '#151515' },
    rock: { base: '#4a4a4a', highlight: '#666666', shadow: '#1b1b1b' },
    obstacle: { main: '#5b5b5b', dark: '#2b2b2b', highlight: '#8a8a8a' },
    bg: '#0a0a0a'
  },
  {
    id: 1,
    name: 'ember',
    wallSprite: 'WALL_VARIANT_1',
    floorSprite: 'FLOOR_VARIANT_1',
    rockSprite: 'ROCK_VARIANT_1',
    bgSprite: 'BG_VARIANT_1',
    wall: { base: '#3b1d10', highlight: '#5a2a14', shadow: '#1f0b06' },
    floor: { base: '#24130a', var1: '#2f180d', var2: '#1a0d07' },
    rock: { base: '#6b3417', highlight: '#8f4b22', shadow: '#2a1207' },
    obstacle: { main: '#f97316', dark: '#9a3412', highlight: '#ffedd5' },
    bg: '#120604'
  },
  {
    id: 2,
    name: 'moss',
    wallSprite: 'WALL_VARIANT_2',
    floorSprite: 'FLOOR_VARIANT_2',
    rockSprite: 'ROCK_VARIANT_2',
    bgSprite: 'BG_VARIANT_2',
    wall: { base: '#1f2a1f', highlight: '#2f3d2f', shadow: '#0f140f' },
    floor: { base: '#182118', var1: '#1f2a1f', var2: '#121a12' },
    rock: { base: '#3a4a3a', highlight: '#556b55', shadow: '#1b221b' },
    obstacle: { main: '#22c55e', dark: '#166534', highlight: '#bbf7d0' },
    bg: '#0b120b'
  },
  {
    id: 3,
    name: 'frost',
    wallSprite: 'WALL_VARIANT_3',
    floorSprite: 'FLOOR_VARIANT_3',
    rockSprite: 'ROCK_VARIANT_3',
    bgSprite: 'BG_VARIANT_3',
    wall: { base: '#1f2b34', highlight: '#2f3c47', shadow: '#10161b' },
    floor: { base: '#17222a', var1: '#1f2b34', var2: '#0f171d' },
    rock: { base: '#3a4f5e', highlight: '#5b7487', shadow: '#1a2229' },
    obstacle: { main: '#38bdf8', dark: '#075985', highlight: '#e0f2fe' },
    bg: '#0a1016'
  },
  {
    id: 4,
    name: 'royal',
    wallSprite: 'WALL_VARIANT_0',
    floorSprite: 'FLOOR_VARIANT_2',
    rockSprite: 'ROCK_VARIANT_1',
    bgSprite: 'BG_VARIANT_0',
    wall: { base: '#261f3a', highlight: '#3a2f57', shadow: '#130f1f' },
    floor: { base: '#1b1629', var1: '#241d36', var2: '#120f1c' },
    rock: { base: '#3f2f5f', highlight: '#5b4a87', shadow: '#1b1430' },
    obstacle: { main: '#8b5cf6', dark: '#4c1d95', highlight: '#ddd6fe' },
    bg: '#0d0a16'
  },
  {
    id: 5,
    name: 'toxic',
    wallSprite: 'WALL_VARIANT_1',
    floorSprite: 'FLOOR_VARIANT_0',
    rockSprite: 'ROCK_VARIANT_2',
    bgSprite: 'BG_VARIANT_1',
    wall: { base: '#24320f', highlight: '#314615', shadow: '#111a07' },
    floor: { base: '#1a240b', var1: '#22310f', var2: '#101806' },
    rock: { base: '#3a4f16', highlight: '#5b7a23', shadow: '#19220a' },
    obstacle: { main: '#84cc16', dark: '#3f6212', highlight: '#d9f99d' },
    bg: '#0b1206'
  },
  {
    id: 6,
    name: 'ash',
    wallSprite: 'WALL_VARIANT_2',
    floorSprite: 'FLOOR_VARIANT_1',
    rockSprite: 'ROCK_VARIANT_3',
    bgSprite: 'BG_VARIANT_2',
    wall: { base: '#2f2f33', highlight: '#3f3f45', shadow: '#141417' },
    floor: { base: '#1f1f23', var1: '#29292e', var2: '#17171a' },
    rock: { base: '#55555c', highlight: '#7a7a83', shadow: '#242428' },
    obstacle: { main: '#a3a3a3', dark: '#404040', highlight: '#f5f5f5' },
    bg: '#0b0b0d'
  },
  {
    id: 7,
    name: 'abyss',
    wallSprite: 'WALL_VARIANT_3',
    floorSprite: 'FLOOR_VARIANT_3',
    rockSprite: 'ROCK_VARIANT_0',
    bgSprite: 'BG_VARIANT_3',
    wall: { base: '#0f1620', highlight: '#1b2533', shadow: '#070b10' },
    floor: { base: '#0b1017', var1: '#121a25', var2: '#06080c' },
    rock: { base: '#1f2b3b', highlight: '#2f4258', shadow: '#0b1016' },
    obstacle: { main: '#111827', dark: '#000000', highlight: '#9ca3af' },
    bg: '#05070b'
  },
  {
    id: 8,
    name: 'saffron',
    wallSprite: 'WALL_VARIANT_1',
    floorSprite: 'FLOOR_VARIANT_2',
    rockSprite: 'ROCK_VARIANT_1',
    bgSprite: 'BG_VARIANT_1',
    wall: { base: '#3a2b14', highlight: '#533d1d', shadow: '#1b1207' },
    floor: { base: '#261b0d', var1: '#2f210f', var2: '#181107' },
    rock: { base: '#5b3c1a', highlight: '#7a5324', shadow: '#221508' },
    obstacle: { main: '#f59e0b', dark: '#92400e', highlight: '#fef3c7' },
    bg: '#120b05'
  },
  {
    id: 9,
    name: 'tide',
    wallSprite: 'WALL_VARIANT_0',
    floorSprite: 'FLOOR_VARIANT_3',
    rockSprite: 'ROCK_VARIANT_2',
    bgSprite: 'BG_VARIANT_0',
    wall: { base: '#0f2b2a', highlight: '#1a403e', shadow: '#071615' },
    floor: { base: '#0b201f', var1: '#132c2a', var2: '#071615' },
    rock: { base: '#1f4a46', highlight: '#2f6b66', shadow: '#0f2422' },
    obstacle: { main: '#14b8a6', dark: '#0f766e', highlight: '#99f6e4' },
    bg: '#061110'
  }
];
