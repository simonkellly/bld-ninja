import { useStore } from '@tanstack/react-store';
import { Bluetooth, BluetoothConnected, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CubeStore, connect, reset } from '@/lib/smartCube';

function CubeStatus() {
  const cube = useStore(CubeStore, state => state.cube);

  const onClick = async (ev: React.MouseEvent<HTMLButtonElement>) => {
    connect();
    ev.currentTarget.blur();
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-sm gap-1.5"
      onClick={onClick}
    >
      {!cube ? (
        <Bluetooth className="size-3.5" />
      ) : (
        <BluetoothConnected className="size-3.5" />
      )}
      {!cube ? 'Connect Cube' : cube.deviceName}
    </Button>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 h-[57px] gap-1 border-b bg-background px-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        BLD Ninja
      </h1>
      <CubeStatus />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5 text-sm"
        onClick={reset}
      >
        <RotateCcw className="size-3.5" />
        Reset
      </Button>
    </header>
  );
}
