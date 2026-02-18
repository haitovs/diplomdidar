/**
 * Lifecycle Manager
 * Tracks listeners, timers, and animation frames for explicit cleanup.
 */
export class LifecycleManager {
  constructor() {
    this.cleanups = [];
    this.timeoutIds = new Set();
    this.intervalIds = new Set();
    this.rafIds = new Set();
  }

  /**
   * Register a listener and track its cleanup.
   */
  on(target, event, handler, options) {
    if (!target?.addEventListener) {
      return () => {};
    }

    target.addEventListener(event, handler, options);
    const cleanup = () => target.removeEventListener(event, handler, options);
    this.cleanups.push(cleanup);
    return cleanup;
  }

  /**
   * Register a timeout and track it.
   */
  timeout(handler, delay) {
    const id = setTimeout(() => {
      this.timeoutIds.delete(id);
      handler();
    }, delay);

    this.timeoutIds.add(id);
    return id;
  }

  /**
   * Register an interval and track it.
   */
  interval(handler, delay) {
    const id = setInterval(handler, delay);
    this.intervalIds.add(id);
    return id;
  }

  /**
   * Register requestAnimationFrame and track it.
   */
  raf(handler) {
    const id = requestAnimationFrame((ts) => {
      this.rafIds.delete(id);
      handler(ts);
    });
    this.rafIds.add(id);
    return id;
  }

  /**
   * Clear all tracked resources.
   */
  cleanup() {
    this.cleanups.splice(0).forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn('Listener cleanup failed:', err);
      }
    });

    this.timeoutIds.forEach((id) => clearTimeout(id));
    this.timeoutIds.clear();

    this.intervalIds.forEach((id) => clearInterval(id));
    this.intervalIds.clear();

    this.rafIds.forEach((id) => cancelAnimationFrame(id));
    this.rafIds.clear();
  }
}

