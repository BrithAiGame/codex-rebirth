import express from "express";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";

const PORT = 8001;

type MoveVector = { x: number; y: number };

type PlayerInput = {
  move?: MoveVector;
  shoot?: MoveVector;
  bomb?: boolean;
  pause?: boolean;
  restart?: boolean;
};

type ClientMessage = {
  t: string;
  roomId?: string;
  seq?: number;
  clientTime?: number;
  payload?: any;
};

type ServerMessage = {
  t: string;
  roomId?: string;
  serverTime: number;
  ack?: number;
  payload?: any;
};

type Player = {
  id: string;
  ws: WebSocket;
  slot: number;
  characterId: string;
  ready: boolean;
};

type GameState = {
  seed: number;
};

type Room = {
  id: string;
  hostId: string;
  maxPlayers: number;
  players: Map<string, Player>;
  locked: boolean;
  baseSeed: number;
  state: GameState | null;
};

type Session = {
  playerId: string;
  roomId?: string;
};

const app = express();
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const rooms = new Map<string, Room>();
const sessions = new Map<WebSocket, Session>();

function now() {
  return Date.now();
}

function send(ws: WebSocket, msg: Omit<ServerMessage, "serverTime">, ack?: number) {
  if (ws.readyState !== WebSocket.OPEN) return;
  const payload: ServerMessage = {
    ...msg,
    serverTime: now(),
    ...(ack !== undefined ? { ack } : {})
  };
  ws.send(JSON.stringify(payload));
}

function broadcast(room: Room, msg: Omit<ServerMessage, "serverTime">) {
  for (const player of room.players.values()) {
    send(player.ws, msg);
  }
}

function broadcastExcept(room: Room, exceptId: string, msg: Omit<ServerMessage, "serverTime">) {
  for (const player of room.players.values()) {
    if (player.id === exceptId) continue;
    send(player.ws, msg);
  }
}

function error(ws: WebSocket, code: string, message: string, ack?: number) {
  send(
    ws,
    {
      t: "room.error",
      payload: { code, message }
    },
    ack
  );
}

function createRoomId() {
  let id = "";
  do {
    id = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms.has(id));
  return id;
}

function createPlayerId(room: Room) {
  return `p${room.players.size + 1}`;
}

function getRoomPlayerList(room: Room) {
  return Array.from(room.players.values()).map((player) => ({
    id: player.id,
    slot: player.slot,
    characterId: player.characterId,
    ready: player.ready
  }));
}

function startRoom(room: Room) {
  room.state = { seed: room.baseSeed };
}

function stopRoom(room: Room) {
  return;
}

function handleLeave(ws: WebSocket, session: Session) {
  const roomId = session.roomId;
  if (!roomId) return;
  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.get(session.playerId);
  if (player) {
    room.players.delete(session.playerId);
    broadcast(room, {
      t: "room.player_left",
      roomId,
      payload: { playerId: session.playerId }
    });
  }

  if (room.players.size === 0) {
    stopRoom(room);
    rooms.delete(roomId);
    session.roomId = undefined;
    sessions.set(ws, session);
    return;
  }

  if (room.hostId === session.playerId) {
    const nextHost = room.players.values().next().value as Player;
    room.hostId = nextHost.id;
    broadcast(room, {
      t: "room.player_update",
      roomId,
      payload: { playerId: nextHost.id, hostId: room.hostId }
    });
  }

  session.roomId = undefined;
  sessions.set(ws, session);
}

function ensureRoom(roomId: string | undefined, ws: WebSocket, ack?: number) {
  if (!roomId) {
    error(ws, "ROOM_NOT_FOUND", "Room not found.", ack);
    return null;
  }
  const room = rooms.get(roomId);
  if (!room) {
    error(ws, "ROOM_NOT_FOUND", "Room not found.", ack);
    return null;
  }
  return room;
}

function canControlRoom(ws: WebSocket, room: Room, ack?: number) {
  const session = sessions.get(ws);
  if (!session || session.playerId !== room.hostId) {
    error(ws, "NOT_HOST", "Only the host can perform this action.", ack);
    return false;
  }
  return true;
}

function handleMessage(ws: WebSocket, raw: string) {
  let msg: ClientMessage;
  try {
    msg = JSON.parse(raw);
  } catch {
    error(ws, "INVALID_ACTION", "Invalid JSON message.");
    return;
  }

  const ack = msg.seq;

  switch (msg.t) {
    case "room.create": {
      const maxPlayers = Math.max(1, Math.min(8, msg.payload?.maxPlayers ?? 4));
      const roomId = createRoomId();
      const room: Room = {
        id: roomId,
        hostId: "",
        maxPlayers,
        players: new Map(),
        locked: false,
        baseSeed: Math.floor(Math.random() * 1_000_000),
        state: null
      };

      const playerId = createPlayerId(room);
      const player: Player = {
        id: playerId,
        ws,
        slot: 0,
        characterId: "alpha",
        ready: false
      };

      room.hostId = playerId;
      room.players.set(playerId, player);
      rooms.set(roomId, room);
      sessions.set(ws, { playerId, roomId });

      send(
        ws,
        {
          t: "room.created",
          roomId,
          payload: { roomId, hostId: room.hostId, maxPlayers: room.maxPlayers }
        },
        ack
      );
      break;
    }
    case "room.join": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      if (room.locked) {
        error(ws, "ROOM_LOCKED", "Room is locked.", ack);
        return;
      }
      if (room.players.size >= room.maxPlayers) {
        error(ws, "ROOM_FULL", "Room is full.", ack);
        return;
      }

      const playerId = createPlayerId(room);
      const player: Player = {
        id: playerId,
        ws,
        slot: room.players.size,
        characterId: "alpha",
        ready: false
      };
      room.players.set(playerId, player);
      sessions.set(ws, { playerId, roomId: room.id });

      send(
        ws,
        {
          t: "room.joined",
          roomId: room.id,
          payload: {
            playerId,
            hostId: room.hostId,
            players: getRoomPlayerList(room)
          }
        },
        ack
      );

      broadcast(room, {
        t: "room.player_update",
        roomId: room.id,
        payload: {
          playerId: player.id,
          slot: player.slot,
          characterId: player.characterId,
          ready: player.ready
        }
      });
      break;
    }
    case "room.leave": {
      const session = sessions.get(ws);
      if (!session || !session.roomId) {
        error(ws, "INVALID_ACTION", "Not in a room.", ack);
        return;
      }
      handleLeave(ws, session);
      break;
    }
    case "room.select_character": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      const session = sessions.get(ws);
      if (!session) return;
      const player = room.players.get(session.playerId);
      if (!player) return;
      const characterId = msg.payload?.characterId;
      if (typeof characterId !== "string") {
        error(ws, "INVALID_ACTION", "Invalid characterId.", ack);
        return;
      }
      player.characterId = characterId;
      broadcast(room, {
        t: "room.player_update",
        roomId: room.id,
        payload: { playerId: player.id, characterId }
      });
      break;
    }
    case "room.ready": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      const session = sessions.get(ws);
      if (!session) return;
      const player = room.players.get(session.playerId);
      if (!player) return;
      const ready = Boolean(msg.payload?.ready);
      player.ready = ready;
      broadcast(room, {
        t: "room.player_update",
        roomId: room.id,
        payload: { playerId: player.id, ready }
      });
      break;
    }
    case "game.start": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      if (!canControlRoom(ws, room, ack)) return;
      if (room.locked) {
        error(ws, "ROOM_LOCKED", "Room is locked.", ack);
        return;
      }
      room.locked = true;
      room.baseSeed = Math.floor(Math.random() * 1_000_000);

      broadcast(room, {
        t: "game.start",
        roomId: room.id,
        payload: {
          baseSeed: room.baseSeed,
          difficulty: "NORMAL",
          floorLevel: 1,
          players: getRoomPlayerList(room).map((p) => ({
            id: p.id,
            slot: p.slot,
            characterId: p.characterId
          }))
        }
      });

      startRoom(room);
      break;
    }
    case "game.input": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      if (!room.locked || !room.state) {
        error(ws, "INVALID_ACTION", "Game has not started.", ack);
        return;
      }
      const session = sessions.get(ws);
      if (!session) return;
      const tick = msg.payload?.tick;
      if (typeof tick !== "number") {
        error(ws, "INVALID_ACTION", "Invalid tick.", ack);
        return;
      }
      const input = msg.payload?.input;
      if (typeof input !== "object") {
        error(ws, "INVALID_ACTION", "Invalid input.", ack);
        return;
      }

      broadcastExcept(room, session.playerId, {
        t: "game.input_broadcast",
        roomId: room.id,
        payload: {
          playerId: session.playerId,
          tick,
          input
        }
      });
      break;
    }
    case "game.hash": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      const session = sessions.get(ws);
      if (!session) return;
      const tick = msg.payload?.tick;
      const hash = msg.payload?.hash;
      if (typeof tick !== "number" || typeof hash !== "string") {
        error(ws, "INVALID_ACTION", "Invalid hash payload.", ack);
        return;
      }
      broadcast(room, {
        t: "game.hash",
        roomId: room.id,
        payload: { tick, hash, playerId: session.playerId }
      });
      break;
    }
    case "game.enter_room": {
      const room = ensureRoom(msg.roomId, ws, ack);
      if (!room) return;
      const session = sessions.get(ws);
      if (!session) return;
      const dir = msg.payload?.dir;
      if (!dir || typeof dir !== "string") {
        error(ws, "INVALID_ACTION", "Invalid room transition.", ack);
        return;
      }
      broadcast(room, {
        t: "game.enter_room",
        roomId: room.id,
        payload: { dir, playerId: session.playerId, to: msg.payload?.to }
      });
      break;
    }
    default: {
      error(ws, "INVALID_ACTION", "Unknown message type.", ack);
      break;
    }
  }
}

wss.on("connection", (ws) => {
  sessions.set(ws, { playerId: `guest-${Math.floor(Math.random() * 999999)}` });
  (ws as WebSocket & { isAlive?: boolean }).isAlive = true;

  ws.on("pong", () => {
    (ws as WebSocket & { isAlive?: boolean }).isAlive = true;
  });

  ws.on("message", (data) => {
    if (typeof data !== "string") {
      handleMessage(ws, data.toString());
      return;
    }
    handleMessage(ws, data);
  });

  ws.on("close", () => {
    const session = sessions.get(ws);
    if (session) {
      handleLeave(ws, session);
    }
    sessions.delete(ws);
  });
});

const heartbeat = setInterval(() => {
  for (const ws of wss.clients) {
    const client = ws as WebSocket & { isAlive?: boolean };
    if (!client.isAlive) {
      ws.terminate();
      continue;
    }
    client.isAlive = false;
    ws.ping();
  }
}, 30000);

wss.on("close", () => {
  clearInterval(heartbeat);
});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on ${PORT}`);
});
