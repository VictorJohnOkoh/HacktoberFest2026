import { create } from "zustand";
import {
  EMPTY_ROOM,
  normalizeObject,
  normalizeRoomState,
  normalizeShell,
  type RoomObject,
  type RoomState,
} from "../types/room";

export type ConnectionStatus = "connecting" | "open" | "closed";
export type TransformMode = "translate" | "rotate";

interface RoomStore extends RoomState {
  connection: ConnectionStatus;
  selectedId: string | null;
  transformMode: TransformMode;

  setState: (raw: unknown) => void;
  upsertObject: (raw: unknown) => RoomObject | null;
  updateObject: (id: string, changes: unknown) => void;
  removeObject: (id: string) => void;
  updateShell: (changes: unknown) => void;
  setConnection: (status: ConnectionStatus) => void;
  select: (id: string | null) => void;
  setTransformMode: (mode: TransformMode) => void;
}

export const useRoomStore = create<RoomStore>()((set, get) => ({
  ...EMPTY_ROOM,
  connection: "connecting",
  selectedId: null,
  transformMode: "translate",

  setState: (raw) => {
    const next = normalizeRoomState(raw);
    set((s) => ({
      ...next,
      selectedId: next.objects.some((o) => o.id === s.selectedId) ? s.selectedId : null,
    }));
  },

  upsertObject: (raw) => {
    const obj = normalizeObject(raw);
    if (!obj) return null;
    set((s) => {
      const i = s.objects.findIndex((o) => o.id === obj.id);
      const objects = i === -1 ? [...s.objects, obj] : s.objects.map((o, j) => (j === i ? obj : o));
      return { objects };
    });
    return obj;
  },

  updateObject: (id, changes) => {
    const current = get().objects.find((o) => o.id === id);
    if (!current || typeof changes !== "object" || changes === null) return;
    const merged = normalizeObject({ ...current, ...changes, id });
    if (!merged) return;
    set((s) => ({ objects: s.objects.map((o) => (o.id === id ? merged : o)) }));
  },

  removeObject: (id) =>
    set((s) => ({
      objects: s.objects.filter((o) => o.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    })),

  updateShell: (changes) =>
    set((s) => ({ room: normalizeShell({ ...s.room, ...(changes as object) }, s.room) })),

  setConnection: (connection) => set({ connection }),
  select: (selectedId) => set({ selectedId }),
  setTransformMode: (transformMode) => set({ transformMode }),
}));
