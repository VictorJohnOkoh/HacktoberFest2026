import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRoomStore } from "../state/roomStore";
import { Lighting } from "./Lighting";
import { RoomShell } from "./RoomShell";
import { SceneObject } from "./SceneObject";

function Objects() {
  const objects = useRoomStore((s) => s.objects);
  return objects.map((o) => <SceneObject key={o.id} object={o} />);
}

export function RoomScene() {
  const { width, depth, height } = useRoomStore((s) => s.room);
  const select = useRoomStore((s) => s.select);
  const extent = Math.max(width, depth);

  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [extent * 0.9, height * 1.8, extent * 1.2], fov: 45, near: 0.05, far: 200 }}
      onPointerMissed={() => select(null)}
    >
      <color attach="background" args={["#1d2027"]} />
      <Lighting />
      <RoomShell />
      <Objects />
      <OrbitControls
        makeDefault
        target={[0, height * 0.3, 0]}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={1}
        maxDistance={extent * 4}
      />
    </Canvas>
  );
}
