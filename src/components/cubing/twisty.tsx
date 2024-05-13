import * as Cubing from 'cubing/twisty';
import { useEffect, useRef } from 'react';
import cube from '/cube-colors.png';

export default function Twisty() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    console.log('Twisty mounted');
    const newViewer = new Cubing.TwistyPlayer({
      visualization: 'auto',
      experimentalSetupAnchor: 'end',
      alg: "y' y' U' E D R2 r2 F2 B2 U E D' R2 L2' z2 S2 U U D D S2 F2' B2",
      background: 'none',
      hintFacelets: 'none',
      controlPanel: 'none',
      cameraLatitude: 45,
      cameraLongitude: 0,
      tempoScale: 1.5,
      experimentalStickering: 'picture',
      experimentalSprite: cube,
    });

    newViewer.style.width = '100%';
    newViewer.style.height = '100%';

    newViewer.play();
    containerRef.current?.replaceChildren(newViewer);
  }, [containerRef]);

  return <div className="flex w-64 h-64" ref={containerRef} />;
}
