import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
});


import Twisty from '@/components/cubing/twisty';
import { CubeStore } from '@/lib/smartCube';
import { useStore } from '@tanstack/react-store';

function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube?.name() ?? "Connected Cube"}</>
}

function Dashboard() {

  return (
    <div className="h-full w-full flex flex-col">
      <h2 className="text-2xl font-medium text-center p-4 flex-none">
        Uw Bw Rw Lw' Uw U Lw2 L Dw' U' Uw2 B2 Lw L D2 Lw Uw' Fw' Rw Bw D2 L2 Dw' Fw'
        F U2 Fw2 U2 Dw' Lw2 Fw2 F Rw' Uw' Dw Lw' F' R U' F U' Dw2 Lw F U2 R2 Bw L2
        Lw2 Bw2 Fw' L2 B Uw L Lw2 U Dw' Lw Rw
      </h2>
      <div className="flex grow h-full items-center">
        <h1 className="text-8xl font-bold text-white text-center m-auto">1:13.84</h1>
      </div>
      <div className="w-full grid grid-cols-3">
        <fieldset className="rounded-lg border p-4 m-4 hover:bg-muted">
          <legend className="-ml-1 px-1 text-sm font-medium">
            <CubeName />
          </legend>
          <Twisty className="w-full h-64 m-auto" />
        </fieldset>
      </div>
    </div>
  );
}
