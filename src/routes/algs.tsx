import Algs from '@/algs'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/algs')({
  component: RouteComponent,
})

function RouteComponent() {
  return <Algs />
}
