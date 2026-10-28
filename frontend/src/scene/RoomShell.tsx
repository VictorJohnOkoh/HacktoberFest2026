import { Grid } from "@react-three/drei";
import { FrontSide } from "three";
import { useRoomStore } from "../state/roomStore";

/**
 * Floor + four walls. Walls are single-sided planes facing inward, so whichever
 * wall is between the camera and the room is culled — a "dollhouse" view for free.
 */
export function RoomShell() {
  const { width, depth, height, floorColor, wallColor } = useRoomStore((s) => s.room);
  const select = useRoomStore((s) => s.select);

  const walls: { position: [number, number, number]; rotationY: number; length: number }[] = [
    { position: [0, height / 2, -depth / 2], rotationY: 0, length: width }, // back
    { position: [0, height / 2, depth / 2], rotationY: Math.PI, length: width }, // front
    { position: [-width / 2, height / 2, 0], rotationY: Math.PI / 2, length: depth }, // left
    { position: [width / 2, height / 2, 0], rotationY: -Math.PI / 2, length: depth }, // right
  ];

  return (
    <group>
      <mesh
        rotation-x={-Math.PI / 2}
        receiveShadow
        // Deselect on a real click, not at the end of an orbit/gizmo drag.
        onClick={(e) => e.delta < 4 && select(null)}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorColor} roughness={0.85} />
      </mesh>
      {/* Subtle 0.5 m grid so people can judge sizes. */}
      <Grid
        position={[0, 0.002, 0]}
        args={[width, depth]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#00000022"
        sectionSize={1}
        sectionThickness={1}
        sectionColor="#00000033"
        fadeDistance={40}
        side={FrontSide}
      />
      {walls.map((w, i) => (
        <mesh key={i} position={w.position} rotation-y={w.rotationY} receiveShadow>
          <planeGeometry args={[w.length, height]} />
          <meshStandardMaterial color={wallColor} roughness={0.95} side={FrontSide} />
        </mesh>
      ))}
    </group>
  );
}
