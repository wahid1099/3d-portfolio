import { useSyncExternalStore } from "react";

/** Tiny external store: lets DOM labels and 3D nodes share hover state without re-rendering the tree. */
export type Store<T> = { get: () => T; set: (v: T) => void; subscribe: (fn: () => void) => () => void };

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const subs = new Set<() => void>();
  return {
    get: () => value,
    set(next: T) {
      if (next === value) return;
      value = next;
      subs.forEach((f) => f());
    },
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => {
        subs.delete(fn);
      };
    },
  };
}

export function useStore<T>(store: Store<T>) {
  return useSyncExternalStore(store.subscribe, store.get, store.get);
}

export const techHover = createStore<string | null>(null);
export const pointer = { x: 0, y: 0 };

/** DOM nodes the WebGL scene positions every frame (projected labels). */
export const labelEls = new Map<string, HTMLElement>();
export const layerEls = new Map<string, HTMLElement>();

if (typeof window !== "undefined") {
  window.addEventListener(
    "pointermove",
    (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    },
    { passive: true },
  );
}
