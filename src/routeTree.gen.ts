/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TwistyImport } from './routes/twisty'
import { Route as DashboardImport } from './routes/dashboard'
import { Route as IndexImport } from './routes/index'

// Create/Update Routes

const TwistyRoute = TwistyImport.update({
  path: '/twisty',
  getParentRoute: () => rootRoute,
} as any)

const DashboardRoute = DashboardImport.update({
  path: '/dashboard',
  getParentRoute: () => rootRoute,
} as any)

const IndexRoute = IndexImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      preLoaderRoute: typeof IndexImport
      parentRoute: typeof rootRoute
    }
    '/dashboard': {
      preLoaderRoute: typeof DashboardImport
      parentRoute: typeof rootRoute
    }
    '/twisty': {
      preLoaderRoute: typeof TwistyImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  DashboardRoute,
  TwistyRoute,
])

/* prettier-ignore-end */
