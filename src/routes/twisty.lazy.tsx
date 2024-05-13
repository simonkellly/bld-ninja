import { createLazyFileRoute } from '@tanstack/react-router';
import Twisty from '@/components/cubing/twisty';

export const Route = createLazyFileRoute('/twisty')({
  component: TwistyExample,
});

function TwistyExample() {
  return (
    <div className="w-64 h-64">
      <Twisty />
    </div>
  );
}
