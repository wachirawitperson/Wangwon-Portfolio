/**
 * Simple Reactive State Store
 * Provides pub/sub state management with single source of truth.
 */
export function createStore(initialState = {}) {
  let state = { ...initialState };
  const listeners = new Set();

  function getState() {
    return state;
  }

  function setState(updater) {
    const nextState = typeof updater === 'function' ? updater(state) : updater;
    state = { ...state, ...nextState };
    listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('State subscriber error:', err);
      }
    });
    return state;
  }

  function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function reset(newState = initialState) {
    state = { ...newState };
    listeners.forEach((listener) => listener(state));
    return state;
  }

  return {
    getState,
    setState,
    subscribe,
    reset
  };
}
