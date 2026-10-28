import { useState } from "react";
import sampleRoom from "../fixtures/sampleRoom.json";
import { sendToServer } from "../net/roomSocket";
import { useRoomStore } from "../state/roomStore";
import type { Vec3 } from "../types/room";

const fmt = (v: Vec3) => v.map((n) => n.toFixed(2)).join(", ");

function SelectedPanel() {
  const obj = useRoomStore((s) => s.objects.find((o) => o.id === s.selectedId));
  const mode = useRoomStore((s) => s.transformMode);
  const setMode = useRoomStore((s) => s.setTransformMode);
  const removeObject = useRoomStore((s) => s.removeObject);
  if (!obj) return <p className="muted">Click an object in the room to select it.</p>;

  const remove = () => {
    removeObject(obj.id);
    sendToServer({ type: "object_remove", id: obj.id });
  };

  return (
    <div className="selected">
      <h3>{obj.name}</h3>
      <dl>
        <dt>id</dt>
        <dd>{obj.id}</dd>
        <dt>position</dt>
        <dd>{fmt(obj.position)}</dd>
        <dt>rotation°</dt>
        <dd>{fmt(obj.rotation)}</dd>
        <dt>parts</dt>
        <dd>{obj.parts.length}</dd>
      </dl>
      <div className="row">
        <button className={mode === "translate" ? "active" : ""} onClick={() => setMode("translate")}>
          Move <kbd>T</kbd>
        </button>
        <button className={mode === "rotate" ? "active" : ""} onClick={() => setMode("rotate")}>
          Rotate <kbd>R</kbd>
        </button>
        <button className="danger" onClick={remove}>
          Delete
        </button>
      </div>
    </div>
  );
}

/** Dev helper: paste Gemini output (a full room or a single object) to render it without the backend. */
function JsonImport() {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const setState = useRoomStore((s) => s.setState);
  const upsertObject = useRoomStore((s) => s.upsertObject);

  const apply = () => {
    setError(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      setError((e as Error).message);
      return;
    }
    if (parsed && typeof parsed === "object" && "objects" in parsed) {
      setState(parsed);
      return;
    }
    const obj = upsertObject(parsed);
    if (!obj) setError("Not a room or an object with at least one valid part.");
    else sendToServer({ type: "object_upsert", object: obj });
  };

  return (
    <details className="import">
      <summary>Paste JSON</summary>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder='{"name":"box","parts":[{"shape":"box","size":[1,1,1],"position":[0,0.5,0]}]}'
        spellCheck={false}
      />
      {error && <p className="error">{error}</p>}
      <div className="row">
        <button onClick={apply} disabled={!text.trim()}>
          Apply
        </button>
        <button onClick={() => setState(sampleRoom)}>Load sample room</button>
      </div>
    </details>
  );
}

export function Sidebar() {
  const objects = useRoomStore((s) => s.objects);
  const selectedId = useRoomStore((s) => s.selectedId);
  const select = useRoomStore((s) => s.select);

  return (
    <aside className="sidebar">
      <section>
        <h2>Selected</h2>
        <SelectedPanel />
      </section>
      <section className="grow">
        <h2>Objects ({objects.length})</h2>
        {objects.length === 0 ? (
          <p className="muted">The room is empty. Objects appear here as the backend adds them.</p>
        ) : (
          <ul className="object-list">
            {objects.map((o) => (
              <li key={o.id}>
                <button className={o.id === selectedId ? "active" : ""} onClick={() => select(o.id)}>
                  {o.name}
                  <span className="muted">{o.id}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <JsonImport />
      </section>
    </aside>
  );
}
