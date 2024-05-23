import { createRootRoute, Outlet } from '@tanstack/react-router';
import { HotkeysProvider } from 'react-hotkeys-hook';
import Navbar from '@/components/layout/navbar';
import Sidebar from '@/components/layout/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/toaster';

export const Route = createRootRoute({
  component: () => {
    return (
      <HotkeysProvider initiallyActiveScopes={['timer']}>
        <TooltipProvider>
          <div className="grid min-h-screen w-full pl-[56px]">
            <Sidebar />
            <div className="flex flex-col">
              <Navbar />
              <main className="w-full h-[calc(100vh-57px)]">
                <Outlet />
              </main>
            </div>
          </div>
          <Toaster />
        </TooltipProvider>
      </HotkeysProvider>
    );
  },
});
