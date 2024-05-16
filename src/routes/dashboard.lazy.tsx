import { Button } from '@/components/ui/button';
import { CubeStore } from '@/lib/smartCube';
import { createLazyFileRoute } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import { GanCube } from 'cubing/bluetooth';

export const Route = createLazyFileRoute('/dashboard')({
  component: Dashboard,
});

function Dashboard() {
  const cube = useStore(CubeStore, state => state.cube);

  if (cube === null) return <></>

  const action = async () => {
    if (!(cube instanceof GanCube)) return;
    const ganCube = cube as GanCube;
    console.log((await ganCube.getPattern()).toJSON());
    await ganCube.reset();
    console.log((await ganCube.getPattern()).toJSON());
  };

  return (
    <>
      Connected Cube {cube.name()}
      <br />
      <Button variant="secondary" onClick={action}>
        Do Things!
      </Button>
    </>
  );

  // return (
  //   <div className="flex flex-col items-center justify-center w-screen h-[calc(100vh-57px)]gap-6">
  //     <div className="text-3xl font-bold mb-6">R2 U2 F2 R2 B2 D2 L2 D2</div>
  //     <div className="text-8xl font-bold">12.34</div>
  //     <Button className="w-full max-w-[200px]">Start/Stop</Button>
  //   </div>
  // );
}
