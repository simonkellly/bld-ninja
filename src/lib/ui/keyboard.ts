export function shouldIgnoreEvent(ev: KeyboardEvent) {
  if (
    ev.target instanceof HTMLInputElement ||
    ev.target instanceof HTMLTextAreaElement ||
    ev.target instanceof HTMLButtonElement ||
    ev.target instanceof HTMLSelectElement
  )
    return true;

  if (ev.target instanceof HTMLElement) {
    return ev.target.role !== null;
  }

  return false;
}
