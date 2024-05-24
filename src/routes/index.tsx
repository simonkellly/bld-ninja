import { SiGithub } from '@icons-pack/react-simple-icons';
import { Link, createFileRoute } from '@tanstack/react-router';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import bldNinjaLogo from '/bldninja-logo-v1.svg';

export const Route = createFileRoute('/')({
  component: Index,
});

function PlannedFeature({ id, label, checked }: { id: string; label: string, checked?: boolean}) {
  return (
    <div className="flex items-center space-x-2 p-1">
      <Checkbox id={id} checked={checked} className="cursor-default" />
      <label
        htmlFor={id}
        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {label}
      </label>
    </div>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const actualTheme =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(actualTheme === 'dark' ? 'light' : 'dark')}
    >
      {actualTheme === 'dark' && <Sun className="h-4 w-4" />}
      {actualTheme === 'light' && <Moon className="h-4 w-4" />}
    </Button>
  );
}

function Index() {
  return (
    <main className="flex flex-col h-screen w-screen items-center justify-center container">
      <Card className="sm:m-4">
        <CardHeader>
          <CardTitle>BLD Ninja</CardTitle>
          <CardDescription>Under construction.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            Try out the in progress trainer {' '}
            <Link to="/timer" className="underline">
              here
            </Link>.
          </p>
          <br />
          <p>
            This project is open source! The source is hosted on our{' '}
            <a
              className="underline"
              href="https://github.com/simonkellly/bld-ninja"
            >
              GitHub page
            </a>
            .
          </p>
          <br />
          <p>Planned features:</p>
          <PlannedFeature id="timer" label="Standard timer functionality" checked />
          <PlannedFeature id="dnf-analysis" label="DNF Analysis" />
          <PlannedFeature id="in-solve-timing" label="In solve case timing" checked />
          <PlannedFeature
            id="algsheet-import"
            label="Algsheet importing and generation"
          />
          <PlannedFeature
            id="reconstruction-export"
            label="Reconstruction export"
          />
          <br />
          <img
            src={bldNinjaLogo}
            alt="BLD Ninja logo"
            className="w-96 m-auto"
          />
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <ThemeToggle />
          <Button asChild>
            <a href="https://github.com/simonkellly/bld-ninja"><SiGithub className="mr-2 h-4 w-4" /> GitHub</a>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
