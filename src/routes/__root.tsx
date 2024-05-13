import { SiGithub } from '@icons-pack/react-simple-icons';
import {
  Link,
  ParseRoute,
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import {
  Box,
  Home,
  LifeBuoy,
  LucideProps,
  Share,
  SquareUser,
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

export const Route = createRootRoute({
  component: () => (
    <TooltipProvider>
      <div className="grid h-screen w-full pl-[56px]">
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
          <header className="sticky top-0 z-10 flex h-[57px] items-center gap-1 border-b bg-background px-4">
            <img src={bldNinjaLogo} className="h-10" />
            <Button
              variant="outline"
              size="sm"
              className="ml-auto gap-1.5 text-sm"
            >
              <Share className="size-3.5" />
              Share
            </Button>
          </header>
          <main className="grid flex-1 gap-4 overflow-auto p-4 grid-cols-1">
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
