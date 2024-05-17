import {
  createRootRoute,
  Outlet,
} from '@tanstack/react-router';
import { TooltipProvider } from '@/components/ui/tooltip';
import Sidebar from '@/components/layout/sidebar';
import Navbar from '@/components/layout/navbar';

export const Route = createRootRoute({
  component: () => {
    
    return (
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
      </TooltipProvider>
    );
  },
});
