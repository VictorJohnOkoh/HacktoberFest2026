import { useRoomStore } from "../state/roomStore";

export function Lighting() {
  const { width, depth, height } = useRoomStore((s) => s.room);
  const extent = Math.max(width, depth);

  return (
    <>
      <hemisphereLight args={["#fff8ee", "#6b5a48", 0.9]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[extent * 0.6, height * 2.5, extent * 0.8]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-camera-left={-extent}
        shadow-camera-right={extent}
        shadow-camera-top={extent}
        shadow-camera-bottom={-extent}
        shadow-camera-near={0.1}
        shadow-camera-far={extent * 6}
      />
      {/* Ceiling light so the room interior isn't flat. */}
      <pointLight position={[0, height - 0.2, 0]} intensity={4} distance={extent * 2.5} decay={1.5} color="#ffe9c7" />
    </>
  );
}
