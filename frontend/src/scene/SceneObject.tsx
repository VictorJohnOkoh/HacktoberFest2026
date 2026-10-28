import { TransformControls } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import { memo, useState } from "react";
import { MathUtils, type Group } from "three";
import { sendToServer } from "../net/roomSocket";
import { useRoomStore } from "../state/roomStore";
import type { RoomObject, Vec3 } from "../types/room";
import { PartMesh } from "./PartMesh";

const PartMeshMemo = memo(PartMesh);

const round = (n: number) => Math.round(n * 1000) / 1000;

export function SceneObject({ object }: { object: RoomObject }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [hovered, setHovered] = useState(false);
  const selected = useRoomStore((s) => s.selectedId === object.id);
  const mode = useRoomStore((s) => s.transformMode);
  const select = useRoomStore((s) => s.select);
  const updateObject = useRoomStore((s) => s.updateObject);

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    select(object.id);
  };

  // Commit the gizmo result to the store and the backend when the user lets go.
  const commitTransform = () => {
    if (!group) return;
    group.position.y = Math.max(0, group.position.y);
    const changes = {
      position: group.position.toArray().map(round) as Vec3,
      rotation: [group.rotation.x, group.rotation.y, group.rotation.z].map((r) =>
        round(MathUtils.radToDeg(r)),
      ) as Vec3,
    };
    updateObject(object.id, changes);
    sendToServer({ type: "object_update", id: object.id, changes });
  };

  return (
    <>
      <group
        ref={setGroup}
        name={object.id}
        position={object.position}
        rotation={object.rotation.map(MathUtils.degToRad) as Vec3}
        scale={object.scale}
        onClick={onClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        {object.parts.map((part, i) => (
          <PartMeshMemo key={i} part={part} highlighted={selected || hovered} />
        ))}
      </group>
      {selected && group && (
        <TransformControls
          object={group}
          mode={mode}
          size={0.8}
          onMouseUp={commitTransform}
        />
      )}
    </>
  );
}
