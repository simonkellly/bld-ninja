import { useStore } from '@tanstack/react-store';
import {
  GanCubeEvent,
} from 'gan-web-bluetooth';
import { useEffect, useState } from 'react';
import { CubeStore } from '@/lib/smartCube';

export const useTrainer = () => {
  const cube = useStore(CubeStore, state => state.cube);

  const [solution, setSolution] = useState<string[]>([]);

  useEffect(() => {
    const subscription = cube?.events$.subscribe((event: GanCubeEvent) => {
      if (event.type !== 'MOVE') return;

      setSolution((s) => [...s, event.move]);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [cube]);

  return {
    solution,
  }
}