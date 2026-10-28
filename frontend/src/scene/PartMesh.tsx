import { MathUtils } from "three";
import type { Part } from "../types/room";

const toRad = (r: Part["rotation"]) => r.map(MathUtils.degToRad) as [number, number, number];

function Geometry({ part }: { part: Part }) {
  switch (part.shape) {
    case "box":
      return <boxGeometry args={part.size} />;
    case "cylinder":
      return <cylinderGeometry args={[part.radiusTop, part.radiusBottom, part.height, 32]} />;
    case "sphere":
      return <sphereGeometry args={[part.radius, 32, 16]} />;
    case "cone":
      return <coneGeometry args={[part.radius, part.height, 32]} />;
    case "torus":
      return <torusGeometry args={[part.radius, part.tube, 16, 48]} />;
    case "capsule":
      return <capsuleGeometry args={[part.radius, part.height, 8, 16]} />;
  }
}

export function PartMesh({ part, highlighted }: { part: Part; highlighted: boolean }) {
  return (
    <mesh position={part.position} rotation={toRad(part.rotation)} castShadow receiveShadow>
      <Geometry part={part} />
      <meshStandardMaterial
        color={part.color}
        metalness={part.metalness}
        roughness={part.roughness}
        transparent={part.opacity < 1}
        opacity={part.opacity}
        emissive={highlighted ? "#3b82f6" : "#000000"}
        emissiveIntensity={highlighted ? 0.25 : 0}
      />
    </mesh>
  );
}
