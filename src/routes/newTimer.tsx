import BTCubeDisplay from "@/components/cubing/btCubeDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ActionBar } from "@/newTimer/actionBar";
import LiveCubeCard from "@/newTimer/liveCubeCard";
import ScrambleDisplay from "@/newTimer/scrambleDisplay";
import DrawScramble from "@/timer/drawScramble";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/newTimer')({
  component: NewTimer,
});

function NewTimer() {
  return (
    <div className="flex flex-col justify-between h-screen w-screen p-2">
      <ActionBar />
      <div
        className="bg-card rounded-lg border w-full relative grow mt-2"
      >
        <ScrambleDisplay />
        <div className="absolute top-0 left-0 w-full h-full flex">
          <h1 className="m-auto text-6xl sm:text-9xl font-extrabold select-none">
            12:34.56
          </h1>
        </div>
      </div>
      <ScrollArea className="h-64 mt-2 rounded-lg">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          <LiveCubeCard />
          <div className="bg-card rounded-lg border h-64">
            <DrawScramble className="h-full w-full p-2" scramble="F2 B2 D F2 L2 F' D2 L U2 L2 U F2 B2 R2 U' F2 U F2 R2 L D'"/>
          </div>
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
          <div className="bg-card rounded-lg border h-64" />
        </div>
      </ScrollArea>
    </div>
  );
}
