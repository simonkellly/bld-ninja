import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/timer')({
  component: Timer,
})

function Timer() {
  return (
    <div className="p-2">
      <h3>Timer</h3>
      <p>Timer functionality coming soon...</p>
    </div>
  )
} 