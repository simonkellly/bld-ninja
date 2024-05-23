import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { routeTree } from '@/routeTree.gen';
import { setSearchDebug } from 'cubing/search'
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { HotkeysProvider } from 'react-hotkeys-hook';

setSearchDebug({
  logPerf: false,
  showWorkerInstantiationWarnings: false,
});

const hashHistory = createHashHistory();

const router = createRouter({
  routeTree,
  history: hashHistory,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root')!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <HotkeysProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
          <Toaster />
        </TooltipProvider>
      </HotkeysProvider>
    </StrictMode>
  );
}
