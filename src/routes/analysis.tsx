import { createFileRoute } from '@tanstack/react-router';
import Analysis from '@/analysis/analysis';

export const Route = createFileRoute('/analysis')({
  component: RouteComponent,
});

function RouteComponent() {
  return <Analysis />;
}
