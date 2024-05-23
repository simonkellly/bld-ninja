import TimerPage from '@/timer/timerPage';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: TimerPage,
});
