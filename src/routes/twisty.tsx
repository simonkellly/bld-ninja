import { createFileRoute } from '@tanstack/react-router';
import BTCubeDisplay from '@/components/cubing/btCubeDisplay';

export const Route = createFileRoute('/twisty')({
  component: TwistyExample,
});

function TwistyExample() {
  return <BTCubeDisplay className="w-64 h-64" />;
}
