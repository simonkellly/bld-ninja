import TopBar from '@/components/layout/top-bar'
import { HeroUIProvider, ToastProvider } from '@heroui/react'
import { createRootRoute, Outlet, useRouter, type NavigateOptions, type ToOptions } from '@tanstack/react-router'

declare module "@react-types/shared" {
  interface RouterConfig {
    href: ToOptions['to'];
    routerOptions: Omit<NavigateOptions, keyof ToOptions>;
  }
}

function Root() {
  const router = useRouter();

  return (
    <HeroUIProvider
      navigate={(to, options) => router.navigate({to, ...options})}
      useHref={(to) => router.buildLocation({to}).href}
      className='text-foreground bg-background h-dvh flex flex-col'
    >
      <ToastProvider placement='top-center' />
      <TopBar />
      <Outlet />
    </HeroUIProvider>
  )
}

export const Route = createRootRoute({
  component: Root,
});