import { createFileRoute } from '@tanstack/react-router';
import Timer from '@/timer/Timer';

export const Route = createFileRoute('/timer')({
  component: Timer,
});
