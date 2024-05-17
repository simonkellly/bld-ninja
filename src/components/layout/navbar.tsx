import { CubeStore, connect, reset } from "@/lib/smartCube";
import { useStore } from "@tanstack/react-store";
import { Button } from "@/components/ui/button";
import { Bluetooth, BluetoothConnected, RotateCcw } from "lucide-react";
import bldNinjaLogo from '/bldninja-logo-v1.svg';

function CubeStatus() {
  const cube = useStore(CubeStore, state => state.cube);
  console.log(cube);

  const onClick = async () => {
    connect();
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
      <img src={bldNinjaLogo} className="h-10" />
      <CubeStatus />
      <Button variant="outline" size="sm" className="gap-1.5 text-sm" onClick={reset}>
        <RotateCcw className="size-3.5" />
        Reset
      </Button>
    </header>
  );
}