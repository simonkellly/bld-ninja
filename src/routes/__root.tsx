import { SiGithub } from '@icons-pack/react-simple-icons';
import {
  Link,
  ParseRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { useStore } from '@tanstack/react-store';
import * as Bluetooth from 'cubing/bluetooth';
import {
  Box,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LucideProps,
  Share,
  SquareUser,
} from 'lucide-react';
import {
  Bluetooth as BT,
  BluetoothConnected as BTConnected,
} from 'lucide-react';
import React from 'react';
import { Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CubeStore } from '@/lib/smartCube';
import { cn } from '@/lib/utils';
import { routeTree } from '@/routeTree.gen';
import bldNinjaLogo from '/bldninja-logo-v1.svg';

type ValidRoutes = ParseRoute<typeof routeTree>['fullPath'];

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then(res => ({
          default: res.TanStackRouterDevtools,
        }))
      );

function SidebarButton({
  label,
  icon,
  link,
  className,
}: {
  label: string;
  icon: React.ForwardRefExoticComponent<LucideProps>;
  link?: ValidRoutes;
  className?: string;
}) {
  const buttonClass = cn('rounded-lg', className);
  const Icon = icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to={link} disabled={!link}>
          <Button
            variant="ghost"
            size="icon"
            className={buttonClass}
            aria-label={label}
          >
            <Icon className="size-5" />
          </Button>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={5}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function CubeStatus() {
  const cube = useStore(CubeStore, state => state.cube);

  const onClick = async () => {
    let newCube: Bluetooth.BluetoothPuzzle | null = null;
    try {
      newCube = await Bluetooth.connectSmartPuzzle();
    } finally {
      CubeStore.setState(state => ({ ...state, cube: newCube }));
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-sm gap-1.5"
      onClick={onClick}
    >
      {cube === null ? (
        <BT className="size-3.5" />
      ) : (
        <BTConnected className="size-3.5" />
      )}
      {cube === null ? 'Connect Cube' : cube.name() ?? 'Cube Connected'}
    </Button>
  );
}

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <div className="grid min-h-screen w-full pl-[56px]">
        <aside className="inset-y fixed  left-0 z-20 flex h-full flex-col border-r">
          <div className="border-b p-2">
            <a href="https://github.com/simonkellly/bld-ninja">
              <Button variant="outline" size="icon" aria-label="Home">
                <SiGithub className="size-5 fill-foreground" />
              </Button>
            </a>
          </div>
          <nav className="grid gap-1 p-2">
            <SidebarButton label="Home" icon={Home} link="/" />
            <SidebarButton
              label="Dashboard"
              icon={LayoutDashboard}
              link="/dashboard"
            />
            <SidebarButton label="Cube" icon={Box} link="/twisty" />
          </nav>
          <nav className="mt-auto grid gap-1 p-2">
            <SidebarButton label="Help" icon={LifeBuoy} className="mt-auto" />
            <SidebarButton
              label="Account"
              icon={SquareUser}
              className="mt-auto"
            />
          </nav>
        </aside>
        <div className="flex flex-col">
          <header className="sticky top-0 z-10 h-[57px] gap-1 border-b bg-background px-4 flex justify-between items-center">
            <img src={bldNinjaLogo} className="h-10" />
            <CubeStatus />
            <Button variant="outline" size="sm" className="gap-1.5 text-sm">
              <Share className="size-3.5" />
              Share
            </Button>
          </header>
          <main className="w-full h-[calc(100vh-57px)]">
            <Outlet />
          </main>
        </div>
      </div>
      <Suspense>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </TooltipProvider>
  ),
});
