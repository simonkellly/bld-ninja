import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createHashHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from '@/routeTree.gen'
import "@/index.css";

const hashHistory = createHashHistory()

const router = createRouter({ routeTree, history: hashHistory });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<RouterProvider router={router} />
	</StrictMode>,
);
