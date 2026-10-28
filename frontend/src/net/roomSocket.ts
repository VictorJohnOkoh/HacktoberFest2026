import { useEffect } from "react";
import { useRoomStore } from "../state/roomStore";
import type { ClientMessage, ServerMessage } from "./protocol";

export const ROOM_WS_URL = import.meta.env.VITE_ROOM_WS_URL ?? "ws://localhost:8000/ws";

let socket: WebSocket | null = null;

/** Send a message to the backend. Silently dropped while disconnected. */
export function sendToServer(msg: ClientMessage): boolean {
  if (socket?.readyState !== WebSocket.OPEN) return false;
  socket.send(JSON.stringify(msg));
  return true;
}

function handleMessage(data: unknown) {
  if (typeof data !== "string") return;
  let msg: ServerMessage;
  try {
    msg = JSON.parse(data);
  } catch {
    console.warn("[room-ws] ignoring non-JSON message", data);
    return;
  }
  const store = useRoomStore.getState();
  switch (msg.type) {
    case "room_state":
      store.setState(msg.state);
      break;
    case "object_upsert":
      store.upsertObject(msg.object);
      break;
    case "object_update":
      store.updateObject(msg.id, msg.changes);
      break;
    case "object_remove":
      store.removeObject(msg.id);
      break;
    case "room_update":
      store.updateShell(msg.changes);
      break;
    default:
      console.warn("[room-ws] unknown message type", msg);
  }
}

/** Keeps a WebSocket to the backend open for the lifetime of the component, reconnecting with backoff. */
export function useRoomSocket(url: string = ROOM_WS_URL) {
  useEffect(() => {
    let disposed = false;
    let retryDelay = 500;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const { setConnection } = useRoomStore.getState();

    const connect = () => {
      if (disposed) return;
      setConnection("connecting");
      const ws = new WebSocket(url);
      socket = ws;

      ws.onopen = () => {
        retryDelay = 500;
        setConnection("open");
        ws.send(JSON.stringify({ type: "request_state" } satisfies ClientMessage));
      };
      ws.onmessage = (e) => handleMessage(e.data);
      ws.onclose = () => {
        if (socket === ws) socket = null;
        if (disposed) return;
        setConnection("closed");
        retryTimer = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 10_000);
      };
      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      disposed = true;
      clearTimeout(retryTimer);
      socket?.close();
      socket = null;
    };
  }, [url]);
}
