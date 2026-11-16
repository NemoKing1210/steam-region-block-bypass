import { Codes, logError } from './debug.js';

const listeners = new Map();

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  listeners.get(event)?.delete(fn);
}

export function emit(event, payload) {
  listeners.get(event)?.forEach((fn) => {
    try {
      fn(payload);
    } catch (error) {
      logError(Codes.BUS_LISTENER, `listener for "${event}" failed`, {
        event,
        error: String(error?.message || error),
      });
    }
  });
}
