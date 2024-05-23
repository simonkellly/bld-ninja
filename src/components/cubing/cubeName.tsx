import { CubeStore } from "@/lib/smartCube";
import { useStore } from "@tanstack/react-store";

export default function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube?.deviceName ?? 'Connected Cube'}</>;
}