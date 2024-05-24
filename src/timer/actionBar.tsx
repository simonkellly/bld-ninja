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
import { forwardRef } from 'react';
import CubeName from '@/components/cubing/cubeName';
import { useTheme } from '@/components/theme-provider';
import { Button, ButtonProps } from '@/components/ui/button';
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

const TopButton = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ ...props }, ref) => (
    <Button
      ref={ref}
      variant="ghost"
      size={null}
      className={'h-full aspect-square p-1' + (props.className || '')}
      onClick={e => {
        e.currentTarget.blur();
        if (props.onClick) {
          props.onClick(e);
        }
      }}
      {...props}
    />
  )
);

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const actualTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <TopButton
      onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
    >
      {actualTheme === 'dark' && <Sun className="h-4" />}
      {actualTheme === 'light' && <Moon className="h-4" />}
    </TopButton>
  );
}

export function SessionSelector() {
  return (
    <Select value="3bld" disabled>
      <SelectTrigger className="max-w-40 h-full py-0 pointer-events-auto">
        <SelectValue placeholder="Sessions" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Sessions</SelectLabel>
          <SelectItem value="3bld">3BLD</SelectItem>
          <SelectItem value="edges">Edges</SelectItem>
          <SelectItem value="corners">Corners</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

export function ActionBar() {
  const cube = useStore(CubeStore, state => state.cube);

  return (
    <div className="bg-card rounded-lg border w-full h-12 p-1 relative">
      <div className="h-full flex justify-between">
        <div className="h-full">
          <TopButton asChild>
            <Link to="/">
              <ArrowLeft className="h-4" />
            </Link>
          </TopButton>
          <ThemeToggle />
        </div>
        <div className="h-full">
          <Button
            variant="ghost"
            size={null}
            className="h-full aspect-square p-2 sm:aspect-auto"
            onClick={e => {
              e.currentTarget.blur();
              connect();
            }}
          >
            {cube && <BluetoothConnected className="sm:mr-2 h-4 w-4" />}
            {!cube && <Bluetooth className="sm:mr-2 h-4 w-4" />}
            <span className="hidden sm:inline">
              <CubeName />
            </span>
          </Button>
          {cube && (
            <TopButton onClick={() => reset()}>
              <RotateCcw className="h-4 w-4" />
            </TopButton>
          )}
        </div>
      </div>
      <div className="h-full w-full justify-center absolute top-0 left-0 flex p-1.5 pointer-events-none">
        <SessionSelector />
      </div>
    </div>
  );
}
