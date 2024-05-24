import { createFileRoute } from '@tanstack/react-router';
import TimerPage from '@/timer/timerPage';

export const Route = createFileRoute('/timer')({
  component: TimerPage,
});
