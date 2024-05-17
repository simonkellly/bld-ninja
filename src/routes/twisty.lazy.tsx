import { createLazyFileRoute } from '@tanstack/react-router';
import Twisty from '@/components/cubing/twisty';

export const Route = createLazyFileRoute('/twisty')({
  component: TwistyExample,
});

function TwistyExample() {
  return <Twisty className="w-64 h-64" />;
}
