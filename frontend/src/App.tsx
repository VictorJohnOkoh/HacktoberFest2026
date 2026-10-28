import { useEffect } from "react";
import { ROOM_WS_URL, sendToServer, useRoomSocket } from "./net/roomSocket";
import { RoomScene } from "./scene/RoomScene";
import { useRoomStore, type ConnectionStatus } from "./state/roomStore";
import { Sidebar } from "./ui/Sidebar";

const STATUS_LABEL: Record<ConnectionStatus, string> = {
  connecting: "Connecting…",
  open: "Live",
  closed: "Offline. Retrying",
};

function useKeyboardShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;
      const { selectedId, select, setTransformMode, removeObject } = useRoomStore.getState();
      switch (e.key.toLowerCase()) {
        case "t":
          setTransformMode("translate");
          break;
        case "r":
          setTransformMode("rotate");
          break;
        case "escape":
          select(null);
          break;
        case "delete":
        case "backspace":
          if (selectedId) {
            removeObject(selectedId);
            sendToServer({ type: "object_remove", id: selectedId });
          }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

export default function App() {
  useRoomSocket();
  useKeyboardShortcuts();
  const connection = useRoomStore((s) => s.connection);

  return (
    <div className="app">
      <header className="topbar">
        <h1>Room Builder</h1>
        <span className={`status status-${connection}`} title={ROOM_WS_URL}>
          <span className="dot" />
          {STATUS_LABEL[connection]}
        </span>
      </header>
      <main className="viewport">
        <RoomScene />
      </main>
      <Sidebar />
    </div>
  );
}
