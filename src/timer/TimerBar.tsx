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
import CubeName from '@/components/cubing/cubeName';
import {
  ActionBar,
  ActionStart,
  ActionButton,
  ActionMiddle,
  ActionEnd,
  ActionIcon,
} from '@/components/layout/ActionBar';
import { useTheme } from '@/components/theme-provider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CubeStore, connect, reset } from '@/lib/smartCube';

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

export function SessionSelector() {
  return (
    <Select value="3bld">
      <SelectTrigger className="max-w-40 h-full py-0">
        <SelectValue placeholder="Sessions" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sessions</SelectLabel>
          <SelectItem value="3bld">3BLD</SelectItem>
          <SelectItem value="edges" disabled>
            Edges
          </SelectItem>
          <SelectItem value="corners" disabled>
            Corners
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
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
      <ActionMiddle>
        <SessionSelector />
      </ActionMiddle>
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
