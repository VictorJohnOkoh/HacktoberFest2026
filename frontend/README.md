# Room frontend

React Three Fiber app that renders the room JSON and keeps it in sync with the backend over a WebSocket.

```sh
npm install
npm run mock:demo   # fake backend on ws://localhost:8000/ws that streams edits every 3 s
npm run dev         # http://localhost:5173
```

Point it at the real backend with `VITE_ROOM_WS_URL` (see `.env.example`).

## Contracts

- **Room JSON:** `src/types/room.ts`. Units are metres, +Y is up, the floor is y = 0, and rotations are in degrees. Every object is a list of primitive `parts` (box, cylinder, sphere, cone, torus, capsule). Input is normalised leniently, so missing or garbage fields fall back to defaults instead of crashing the scene.
- **WebSocket messages:** `src/net/protocol.ts`. The backend sends `room_state` on connect, then incremental `object_upsert` / `object_update` / `object_remove` / `room_update`.

## Controls

Click an object to select it. **T** switches to move and **R** to rotate. **Delete** removes the object and **Esc** deselects. Drag to orbit and scroll to zoom. The *Paste JSON* panel renders raw Gemini output without a backend.
