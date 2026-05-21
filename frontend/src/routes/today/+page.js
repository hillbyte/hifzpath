import { getToday } from '$lib/api.js';

export function load() {
  return {
    streamed: {
      todayPromise: getToday()
    }
  };
}
