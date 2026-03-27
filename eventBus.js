/** Tiny pub/sub event bus for cross-module communication. */

const listeners = {};

/**
 * Subscribe to an event.
 * @param {string} event
 * @param {Function} handler
 */
export function on(event, handler) {
  if (!listeners[event]) listeners[event] = [];
  listeners[event].push(handler);
}

/**
 * Unsubscribe from an event.
 * @param {string} event
 * @param {Function} handler
 */
export function off(event, handler) {
  if (!listeners[event]) return;
  listeners[event] = listeners[event].filter(h => h !== handler);
}

/**
 * Emit an event with an optional payload.
 * @param {string} event
 * @param {*} payload
 */
export function emit(event, payload) {
  if (!listeners[event]) return;
  listeners[event].forEach(h => h(payload));
}
