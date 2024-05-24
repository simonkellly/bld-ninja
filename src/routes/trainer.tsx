import { ActionBar, ActionButton, ActionEnd, ActionMiddle, ActionStart } from "@/components/layout/ActionBar";
import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy } from "lucide-react";

export const Route = createFileRoute('/trainer')({
  component: Trainer,
});

function Trainer() {
  return (
    <div className="flex flex-col justify-between h-dvh w-screen p-2">
      <ActionBar>
        <ActionStart>
          <ActionButton icon={LifeBuoy} />
        </ActionStart>
        <ActionMiddle>Middle</ActionMiddle>
        <ActionEnd>End</ActionEnd>
      </ActionBar>
    </div>
  );
}