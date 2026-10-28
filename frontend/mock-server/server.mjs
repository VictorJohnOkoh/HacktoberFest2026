// Stand-in for the real backend so the frontend can be developed on its own.
//   npm run mock        -> serves the sample room on ws://localhost:8000/ws
//   npm run mock:demo   -> also simulates "Gemma edits" every few seconds
import { readFileSync } from "node:fs";
import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT ?? 8000);
const DEMO = process.argv.includes("--demo");

const state = JSON.parse(readFileSync(new URL("../src/fixtures/sampleRoom.json", import.meta.url), "utf8"));

const wss = new WebSocketServer({ port: PORT, path: "/ws" });

const broadcast = (msg, except) => {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) if (client !== except && client.readyState === 1) client.send(data);
};

function apply(msg) {
  switch (msg.type) {
    case "object_upsert": {
      const i = state.objects.findIndex((o) => o.id === msg.object.id);
      if (i === -1) state.objects.push(msg.object);
      else state.objects[i] = msg.object;
      return true;
    }
    case "object_update": {
      const obj = state.objects.find((o) => o.id === msg.id);
      if (obj) Object.assign(obj, msg.changes);
      return Boolean(obj);
    }
    case "object_remove":
      state.objects = state.objects.filter((o) => o.id !== msg.id);
      return true;
    case "room_update":
      Object.assign(state.room, msg.changes);
      return true;
  }
  return false;
}

wss.on("connection", (ws) => {
  console.log(`client connected (${wss.clients.size} total)`);
  ws.send(JSON.stringify({ type: "room_state", state }));
  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    if (msg.type === "request_state") {
      ws.send(JSON.stringify({ type: "room_state", state }));
    } else if (apply(msg)) {
      console.log("client ->", msg.type, msg.id ?? msg.object?.id ?? "");
      broadcast(msg, ws);
    }
  });
});

if (DEMO) {
  let n = 0;
  setInterval(() => {
    const { width, depth } = state.room;
    const step = n++ % 3;
    let msg;
    if (step === 0) {
      msg = {
        type: "object_upsert",
        object: {
          id: `crate-${n}`,
          name: `Crate ${n}`,
          position: [(Math.random() - 0.5) * (width - 1), 0, (Math.random() - 0.5) * (depth - 1)],
          rotation: [0, Math.random() * 90, 0],
          parts: [{ shape: "box", size: [0.4, 0.4, 0.4], position: [0, 0.2, 0], color: `hsl(${Math.random() * 360}, 45%, 55%)` }],
        },
      };
    } else if (step === 1) {
      const chair = state.objects.find((o) => o.id === "chair-1");
      msg = { type: "object_update", id: "chair-1", changes: { rotation: [0, ((chair?.rotation?.[1] ?? 0) + 45) % 360, 0] } };
    } else {
      const crates = state.objects.filter((o) => o.id.startsWith("crate-"));
      if (crates.length < 3) return;
      msg = { type: "object_remove", id: crates[0].id };
    }
    apply(msg);
    broadcast(msg);
    console.log("demo  ->", msg.type);
  }, 3000);
}

console.log(`mock room server on ws://localhost:${PORT}/ws${DEMO ? " (demo edits on)" : ""}`);
