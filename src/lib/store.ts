"use client";

import { useSyncExternalStore } from "react";

/**
 * Store mínimo salvo no localStorage do navegador.
 * Sem backend e sem login: tudo fica no aparelho, de graça.
 */
export function createPersistentStore<T>(key: string, initial: T) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null | undefined;
  let cachedValue: T = initial;

  function read(): T {
    if (typeof window === "undefined") return initial;
    const raw = window.localStorage.getItem(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      try {
        cachedValue = raw ? { ...initial, ...JSON.parse(raw) } : initial;
      } catch {
        cachedValue = initial;
      }
    }
    return cachedValue;
  }

  function write(updater: (prev: T) => T) {
    const next = updater(read());
    window.localStorage.setItem(key, JSON.stringify(next));
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === key && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => initial);
  }

  return { read, write, useStore };
}
