import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
