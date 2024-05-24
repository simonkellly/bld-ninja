import '@fontsource-variable/jetbrains-mono';
import {
  RouterProvider,
  createHashHistory,
  createRouter,
} from '@tanstack/react-router';
import { setSearchDebug } from 'cubing/search';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { routeTree } from '@/routeTree.gen';
import './index.css';

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
      <ThemeProvider>
        <HotkeysProvider>
          <TooltipProvider>
            <RouterProvider router={router} />
            <Toaster />
          </TooltipProvider>
        </HotkeysProvider>
      </ThemeProvider>
    </StrictMode>
  );
}
