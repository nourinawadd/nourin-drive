/**
 * events.js — lightweight publish/subscribe EventBus.
 * Modules communicate through the bus without direct coupling.
 *
 * Usage:
 *   bus.on('app:open', ({ id }) => wm.open(id));
 *   bus.emit('app:open', { id: 'explorer' });
 *   bus.off('app:open', handler);
 */
export class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #handlers = new Map();

  /**
   * Subscribe to an event.
   * @param {string}   event
   * @param {Function} fn
   * @returns {Function} unsubscribe function
   */
  on(event, fn) {
    if (!this.#handlers.has(event)) this.#handlers.set(event, new Set());
    this.#handlers.get(event).add(fn);
    return () => this.off(event, fn);
  }

  /**
   * Unsubscribe a specific handler.
   * @param {string}   event
   * @param {Function} fn
   */
  off(event, fn) {
    this.#handlers.get(event)?.delete(fn);
  }

  /**
   * Emit an event with optional data.
   * @param {string} event
   * @param {*}      [data]
   */
  emit(event, data) {
    this.#handlers.get(event)?.forEach(fn => fn(data));
  }
}
