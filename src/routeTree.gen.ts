/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TimerImport } from './routes/timer'
import { Route as NewTimerImport } from './routes/newTimer'
import { Route as IndexImport } from './routes/index'

// Create/Update Routes

const TimerRoute = TimerImport.update({
  path: '/timer',
  getParentRoute: () => rootRoute,
} as any)

const NewTimerRoute = NewTimerImport.update({
  path: '/newTimer',
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
    '/newTimer': {
      preLoaderRoute: typeof NewTimerImport
      parentRoute: typeof rootRoute
    }
    '/timer': {
      preLoaderRoute: typeof TimerImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren([
  IndexRoute,
  NewTimerRoute,
  TimerRoute,
])

/* prettier-ignore-end */
