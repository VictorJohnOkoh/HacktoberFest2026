/**
 * Room JSON contract shared with the backend / Gemini pipeline.
 *
 * Conventions:
 *  - Units are metres. +Y is up. The floor is the plane y = 0, centred on the origin.
 *  - Room spans x in [-width/2, width/2] and z in [-depth/2, depth/2].
 *  - Object `position` is the centre of the object's base on the floor.
 *  - Part `position` is relative to its object's origin and is the centre of the part.
 *  - All rotations are in DEGREES (easier for an LLM to get right).
 */

export type Vec3 = [number, number, number];

export type PartShape = "box" | "cylinder" | "sphere" | "cone" | "torus" | "capsule";

export interface Part {
  shape: PartShape;
  /** box: [width, height, depth] */
  size: Vec3;
  /** sphere, cone, torus, capsule, cylinder (when radiusTop/Bottom are omitted) */
  radius: number;
  radiusTop: number;
  radiusBottom: number;
  /** cylinder, cone, capsule */
  height: number;
  /** torus tube thickness */
  tube: number;
  position: Vec3;
  rotation: Vec3;
  color: string;
  metalness: number;
  roughness: number;
  opacity: number;
}

export interface RoomObject {
  id: string;
  name: string;
  position: Vec3;
  rotation: Vec3;
  scale: Vec3;
  parts: Part[];
}

export interface RoomShell {
  width: number;
  depth: number;
  height: number;
  floorColor: string;
  wallColor: string;
}

export interface RoomState {
  room: RoomShell;
  objects: RoomObject[];
}

export const DEFAULT_SHELL: RoomShell = {
  width: 5,
  depth: 4,
  height: 2.7,
  floorColor: "#b08a64",
  wallColor: "#e9e4dc",
};

export const EMPTY_ROOM: RoomState = { room: DEFAULT_SHELL, objects: [] };

const SHAPES: readonly PartShape[] = ["box", "cylinder", "sphere", "cone", "torus", "capsule"];

// ---------------------------------------------------------------------------
// Normalisation: turn untrusted JSON (LLM output) into a fully-populated state.
// Anything invalid falls back to a sensible default instead of throwing.
// ---------------------------------------------------------------------------

type Loose = Record<string, unknown>;

const isObj = (v: unknown): v is Loose => typeof v === "object" && v !== null && !Array.isArray(v);

function num(v: unknown, fallback: number, min = -Infinity, max = Infinity): number {
  const n = typeof v === "string" ? Number(v) : v;
  if (typeof n !== "number" || !Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function vec3(v: unknown, fallback: Vec3): Vec3 {
  if (Array.isArray(v)) {
    return [num(v[0], fallback[0]), num(v[1], fallback[1]), num(v[2], fallback[2])];
  }
  if (isObj(v)) {
    return [num(v.x, fallback[0]), num(v.y, fallback[1]), num(v.z, fallback[2])];
  }
  if (typeof v === "number" && Number.isFinite(v)) return [v, v, v];
  return fallback;
}

function str(v: unknown, fallback: string): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

let autoId = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(autoId++).toString(36)}`;

export function normalizePart(raw: unknown): Part | null {
  if (!isObj(raw)) return null;
  const shapeRaw = str(raw.shape ?? raw.type ?? raw.geometry, "box").toLowerCase();
  const shape = (SHAPES as readonly string[]).includes(shapeRaw) ? (shapeRaw as PartShape) : "box";
  const radius = num(raw.radius, 0.25, 0.001);
  return {
    shape,
    size: vec3(raw.size ?? raw.dimensions, [1, 1, 1]).map((n) => Math.max(0.001, Math.abs(n))) as Vec3,
    radius,
    radiusTop: num(raw.radiusTop, radius, 0),
    radiusBottom: num(raw.radiusBottom, radius, 0),
    height: num(raw.height, 1, 0.001),
    tube: num(raw.tube, radius * 0.25, 0.001),
    position: vec3(raw.position, [0, 0, 0]),
    rotation: vec3(raw.rotation, [0, 0, 0]),
    color: str(raw.color, "#9a9a9a"),
    metalness: num(raw.metalness, 0.05, 0, 1),
    roughness: num(raw.roughness, 0.7, 0, 1),
    opacity: num(raw.opacity, 1, 0, 1),
  };
}

export function normalizeObject(raw: unknown): RoomObject | null {
  if (!isObj(raw)) return null;
  const partsRaw = Array.isArray(raw.parts) ? raw.parts : [];
  const parts = partsRaw.map(normalizePart).filter((p): p is Part => p !== null);
  if (parts.length === 0) return null;
  const name = str(raw.name ?? raw.label, "object");
  return {
    id: str(raw.id, nextId(name.toLowerCase().replace(/\W+/g, "-"))),
    name,
    position: vec3(raw.position, [0, 0, 0]),
    rotation: vec3(raw.rotation, [0, 0, 0]),
    scale: vec3(raw.scale, [1, 1, 1]),
    parts,
  };
}

export function normalizeShell(raw: unknown, base: RoomShell = DEFAULT_SHELL): RoomShell {
  if (!isObj(raw)) return base;
  return {
    width: num(raw.width, base.width, 0.5, 100),
    depth: num(raw.depth, base.depth, 0.5, 100),
    height: num(raw.height, base.height, 0.5, 20),
    floorColor: str(raw.floorColor, base.floorColor),
    wallColor: str(raw.wallColor, base.wallColor),
  };
}

export function normalizeRoomState(raw: unknown): RoomState {
  if (!isObj(raw)) return EMPTY_ROOM;
  const objectsRaw = Array.isArray(raw.objects) ? raw.objects : [];
  return {
    room: normalizeShell(raw.room),
    objects: objectsRaw.map(normalizeObject).filter((o): o is RoomObject => o !== null),
  };
}
