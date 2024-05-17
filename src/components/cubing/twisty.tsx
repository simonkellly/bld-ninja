import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { TwistyPlayer } from 'cubing/twisty';
import cubeImage from '/cube-colors.png';

export default function Twisty({ className }: { className: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const player = new TwistyPlayer({
      visualization: 'auto',
      background: 'none',
      hintFacelets: 'none',
      controlPanel: 'none',
      cameraLatitude: 25,
      cameraLongitude: 25,
      tempoScale: 2,
      experimentalStickering: 'picture',
      experimentalSprite: cubeImage,
    });

    player.style.width = '100%';
    player.style.height = '100%';

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(player);
  }, [containerRef]);

  const classes = cn('flex', className);
  return <div className={classes} ref={containerRef} />;
}
