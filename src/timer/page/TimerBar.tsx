import { Link } from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import {
  ArrowLeft,
  Bluetooth,
  BluetoothConnected,
  Moon,
  RotateCcw,
  Sun,
} from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import {
  ActionBar,
  ActionStart,
  ActionButton,
  ActionMiddle,
  ActionEnd,
  ActionIcon,
} from '@/components/ui/action-bar';
import { CubeStore, connect, reset } from '@/lib/cube/smartCube';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const actualTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <ActionButton
      onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
      icon={actualTheme === 'dark' ? Sun : Moon}
    />
  );
}

function CubeName() {
  const cube = useStore(CubeStore, state => state.cube);
  return <>{cube ? (cube?.name ?? 'Connected') : 'Disconnected'}</>;
}

export default function TimerBar() {
  const cube = useStore(CubeStore, state => state.cube);

  return (
    <ActionBar>
      <ActionStart>
        <ActionButton asChild>
          <Link to="/">
            <ActionIcon icon={ArrowLeft} />
          </Link>
        </ActionButton>
        <ThemeToggle />
      </ActionStart>
      <ActionMiddle />
      <ActionEnd>
        <ActionButton
          className="gap-2 sm:aspect-auto sm:px-2"
          onClick={() => connect()}
        >
          <ActionIcon icon={cube ? BluetoothConnected : Bluetooth} />
          <span className="hidden sm:inline">
            <CubeName />
          </span>
        </ActionButton>
        {cube && <ActionButton icon={RotateCcw} onClick={() => reset()} />}
      </ActionEnd>
    </ActionBar>
  );
}
