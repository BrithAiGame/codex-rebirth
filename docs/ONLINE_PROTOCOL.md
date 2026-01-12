# Online Multiplayer Protocol (WebSocket)

This document defines a complete multiplayer protocol and lifecycle for the game.
The goal is deterministic, synchronized gameplay between two clients (or more).
No authentication is required at this stage.

The design below assumes:
- A dedicated WebSocket server.
- Server-authoritative simulation with fixed tick rate.
- Clients send input; server sends state.
- Optional deterministic lockstep fallback (described in Appendix B).

## 1. Transport

- WebSocket (JSON messages).
- One connection per client.
- Server maintains rooms and player sessions.

### Message Envelope

All messages follow this shape:

```json
{
  "t": "message_type",
  "roomId": "123456",
  "seq": 42,
  "clientTime": 1700000000000,
  "payload": { ... }
}
```

Fields:
- `t`: message type string.
- `roomId`: optional for non-room messages.
- `seq`: client sequence number for ordering and ACKs.
- `clientTime`: client timestamp (ms).
- `payload`: message-specific content.

Server responses may include:

```json
{
  "t": "message_type",
  "roomId": "123456",
  "serverTime": 1700000000000,
  "ack": 42,
  "payload": { ... }
}
```

## 2. Room Lifecycle

### 2.1 Create Room

Client -> Server:
```json
{ "t": "room.create", "payload": { "maxPlayers": 4 } }
```

Server -> Client:
```json
{
  "t": "room.created",
  "roomId": "123456",
  "payload": {
    "roomId": "123456",
    "hostId": "p1",
    "maxPlayers": 4
  }
}
```

### 2.2 Join Room

Client -> Server:
```json
{ "t": "room.join", "roomId": "123456" }
```

Server -> Client (success):
```json
{
  "t": "room.joined",
  "roomId": "123456",
  "payload": {
    "playerId": "p2",
    "hostId": "p1",
    "players": [
      { "id": "p1", "slot": 0, "characterId": "alpha", "ready": false },
      { "id": "p2", "slot": 1, "characterId": "alpha", "ready": false }
    ]
  }
}
```

Server -> Client (error):
```json
{
  "t": "room.error",
  "payload": { "code": "ROOM_NOT_FOUND", "message": "Room not found." }
}
```

### 2.3 Leave Room

Client -> Server:
```json
{ "t": "room.leave", "roomId": "123456" }
```

Server -> Room:
```json
{
  "t": "room.player_left",
  "roomId": "123456",
  "payload": { "playerId": "p2" }
}
```

If host leaves, server can:
- Promote next player to host, or
- Close the room and notify all clients.

## 3. Lobby And Character Selection

### 3.1 Update Character

Client -> Server:
```json
{
  "t": "room.select_character",
  "roomId": "123456",
  "payload": { "characterId": "sniper" }
}
```

Server -> Room:
```json
{
  "t": "room.player_update",
  "roomId": "123456",
  "payload": { "playerId": "p2", "characterId": "sniper" }
}
```

### 3.2 Ready State (optional)

Client -> Server:
```json
{ "t": "room.ready", "roomId": "123456", "payload": { "ready": true } }
```

Server -> Room:
```json
{
  "t": "room.player_update",
  "roomId": "123456",
  "payload": { "playerId": "p2", "ready": true }
}
```

## 4. Game Start

### 4.1 Host Starts Game

Client -> Server:
```json
{ "t": "game.start", "roomId": "123456" }
```

Server:
- Locks lobby.
- Generates a deterministic `baseSeed`.
- Sends initial game config and snapshot.

Server -> Room:
```json
{
  "t": "game.start",
  "roomId": "123456",
  "payload": {
    "baseSeed": 987654,
    "difficulty": "NORMAL",
    "floorLevel": 1,
    "players": [
      { "id": "p1", "slot": 0, "characterId": "alpha" },
      { "id": "p2", "slot": 1, "characterId": "sniper" }
    ]
  }
}
```

Clients should initialize their local `GameEngine` with the given seed and characters.
Server remains authoritative.

## 5. Simulation Model (Server-Authoritative)

### 5.1 Tick Rate

- Fixed tick: 60 Hz.
- Server advances game state every tick.
- Clients send input for each tick or at input change boundaries.

### 5.2 Input Message

Client -> Server (sent at 30-60 Hz or on change):
```json
{
  "t": "game.input",
  "roomId": "123456",
  "payload": {
    "tick": 12345,
    "input": {
      "move": { "x": 0, "y": -1 },
      "shoot": { "x": 1, "y": 0 },
      "bomb": false,
      "pause": false,
      "restart": false
    }
  }
}
```

Notes:
- Inputs are applied per player per tick.
- Server may accept a small tick window (e.g., +/- 2 ticks) to tolerate latency.

### 5.3 State Snapshot

Server -> Room (sent every N ticks, e.g., 6 ticks = 10 Hz):
```json
{
  "t": "game.snapshot",
  "roomId": "123456",
  "payload": {
    "tick": 12345,
    "state": {
      "floorLevel": 1,
      "score": 120,
      "seed": 987654,
      "players": [
        {
          "id": "p1",
          "x": 320, "y": 240, "w": 32, "h": 32,
          "hp": 6, "maxHp": 6,
          "stats": { "speed": 2.0, "damage": 1.0, "fireRate": 12, "shotSpeed": 5, "range": 300, "knockback": 1 },
          "cooldown": 4, "invincibleTimer": 12,
          "keys": 1, "bombs": 1
        }
      ],
      "room": {
        "x": 0, "y": 0, "type": "START",
        "doors": { "UP": false, "DOWN": true, "LEFT": false, "RIGHT": true },
        "cleared": true, "forcedOpen": false,
        "layout": "compressed-tile-data",
        "visited": true, "seed": 11111,
        "themeId": 3
      },
      "entities": [
        { "id": "e1", "type": "ENEMY", "x": 100, "y": 100, "w": 32, "h": 32, "hp": 40, "enemyId": "mimic" },
        { "id": "p1proj", "type": "PROJECTILE", "x": 200, "y": 200, "w": 16, "h": 16, "ownerId": "p1", "damage": 10 }
      ]
    }
  }
}
```

Compression:
- `layout` should be RLE or base64-compressed; keep room layout compact.
- Entities can be partial or delta-encoded if bandwidth is a concern.

### 5.4 Delta Updates (Optional)

Server -> Room:
```json
{ "t": "game.delta", "roomId": "123456", "payload": { "tick": 12348, "changes": [...] } }
```

If delta is used, clients must still receive periodic full snapshots to recover.

## 6. Synchronization Guarantees

To ensure identical visuals:
- Server is authoritative for all game state.
- Clients must render only the latest server state.
- If client-side prediction is used, it must be corrected on every snapshot.

Recommended:
- State hash every 2 seconds:
```json
{ "t": "game.hash", "roomId": "123456", "payload": { "tick": 12360, "hash": "abc123" } }
```
- If client hash mismatch: request full snapshot.

## 7. Events And Notifications

Server -> Room:

- Room clear:
```json
{ "t": "game.room_clear", "payload": { "room": { "x": 1, "y": 0 } } }
```

- Item picked:
```json
{ "t": "game.item_picked", "payload": { "playerId": "p1", "itemId": "i123", "itemType": "KEY" } }
```

- Bomb exploded:
```json
{ "t": "game.bomb", "payload": { "x": 320, "y": 240, "radius": 76 } }
```

Events are optional if the snapshot already captures state.
They can be used for client-side FX.

## 8. Room Transitions

When a player crosses a doorway:

Client -> Server:
```json
{ "t": "game.enter_room", "payload": { "dir": "RIGHT" } }
```

Server:
- Validates door state.
- Applies key cost if chest room (floor >= 2).
- Updates player position.
- Broadcasts snapshot or delta.

## 9. Hidden Rooms

Rules:
- Hidden rooms are not shown on minimap until entered.
- Bomb explosion adjacent to hidden room wall opens a door permanently.

Server:
- Tracks hidden room visibility per player.
- When opened, include door in room `doors` and set `forcedOpen=true`.

## 10. Error Handling

Possible error codes:
- `ROOM_NOT_FOUND`
- `ROOM_FULL`
- `ROOM_LOCKED` (game already started)
- `INVALID_ACTION`
- `NOT_HOST`

Server should reply with:
```json
{
  "t": "room.error",
  "payload": { "code": "ROOM_FULL", "message": "Room is full." }
}
```

## 11. Recommended Server Responsibilities

- Maintain room state and player list.
- Run the authoritative `GameEngine` server-side.
- Generate base seed and deterministic RNG.
- Apply inputs at fixed tick.
- Emit periodic snapshots.
- Enforce game rules (keys, bombs, room transitions).

## 12. Client Responsibilities

- Capture input and send to server with tick.
- Render server snapshots.
- Show FX for events (bombs, hits, pickups).
- Handle latency (optional prediction).
- Allow re-sync via snapshots.

## 13. Example Timeline

1. Player A connects -> `room.create`
2. Server -> `room.created`
3. Player B connects -> `room.join`
4. Both select characters -> `room.select_character`
5. Host -> `game.start`
6. Server generates seed and starts ticks
7. Clients send `game.input` per tick
8. Server sends `game.snapshot` periodically
9. Players transition rooms, pick items, fight boss
10. Game ends -> server sends `game.end`

## 14. Appendix A: Minimal Snapshot Fields

If bandwidth is tight, always include:
- Tick, floor level, score
- Current room id and doors
- Player positions, HP, keys, bombs
- Entities: enemies, projectiles, items, bombs, trapdoor

## 15. Appendix B: Lockstep Alternative (Deterministic)

If you prefer lockstep:
- Server only relays inputs.
- All clients run deterministic simulation with the same seed.
- Each tick requires inputs from all players before advancing.
- Requires strict deterministic RNG and no client-only randomness.

Lockstep has lower server CPU but is more sensitive to latency and desync.

