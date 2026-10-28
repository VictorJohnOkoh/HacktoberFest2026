/**
 * WebSocket messages between the backend and this frontend. All messages are JSON
 * objects with a `type` field. The backend is the source of truth for the room.
 *
 * Server -> client
 *   { type: "room_state",    state: RoomState }                    full snapshot (send on connect)
 *   { type: "object_upsert", object: RoomObject }                  add or replace one object
 *   { type: "object_update", id: string, changes: Partial<RoomObject> }   merge fields into one object
 *   { type: "object_remove", id: string }
 *   { type: "room_update",   changes: Partial<RoomShell> }         resize / recolour the room
 *
 * Client -> server
 *   { type: "request_state" }                                      ask for a fresh snapshot
 *   { type: "object_update", id, changes }                         user moved/rotated an object
 *   { type: "object_upsert", object }                              user pasted an object in the dev panel
 *   { type: "object_remove", id }                                  user deleted an object
 */

import type { RoomObject, RoomShell, RoomState } from "../types/room";

export type ServerMessage =
  | { type: "room_state"; state: RoomState }
  | { type: "object_upsert"; object: RoomObject }
  | { type: "object_update"; id: string; changes: Partial<RoomObject> }
  | { type: "object_remove"; id: string }
  | { type: "room_update"; changes: Partial<RoomShell> };

export type ClientMessage =
  | { type: "request_state" }
  | { type: "object_update"; id: string; changes: Partial<RoomObject> }
  | { type: "object_upsert"; object: RoomObject }
  | { type: "object_remove"; id: string };
