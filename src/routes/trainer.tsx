import { ActionBar } from "@/timer/actionBar";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute('/trainer')({
  component: Trainer,
});

function Trainer() {
  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2">
      <ActionBar />
    </div>
  );
}