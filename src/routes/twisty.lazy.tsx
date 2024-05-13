import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/twisty')({
  component: Twisty,
});

function Twisty() {
  return (
    <div className="w-64 h-64">
      <Twisty />
    </div>
  );
}
