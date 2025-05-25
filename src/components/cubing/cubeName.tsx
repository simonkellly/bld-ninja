import { useStore } from '@tanstack/react-store';
import { CubeStore } from '@/lib/smartCube';

export default function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube ? (cube?.name ?? 'Connected') : 'Disconnected'}</>;
}
