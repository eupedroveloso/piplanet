"use client";

import { useSyncExternalStore } from "react";

/**
 * Store mínimo salvo no localStorage do navegador (tudo fica no aparelho, de graça).
 * A chave pode depender do perfil que entrou (cada um tem o próprio progresso).
 */
export function createPersistentStore<T>(chave: string | (() => string), initial: T) {
  const listeners = new Set<() => void>();
  const keyAtual = () => (typeof chave === "function" ? chave() : chave);
  let cachedKey: string | undefined;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = initial;

  function read(): T {
    if (typeof window === "undefined") return initial;
    const key = keyAtual();
    const raw = window.localStorage.getItem(key);
    if (raw !== cachedRaw || key !== cachedKey) {
      cachedKey = key;
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
    const prev = read();
    let next = updater(prev);
    if (next !== prev && next && typeof next === "object" && "atualizadoEm" in (next as object)) {
      next = { ...next, atualizadoEm: Date.now() };
    }
    window.localStorage.setItem(keyAtual(), JSON.stringify(next));
    listeners.forEach((l) => l());
    aoGravar?.(keyAtual(), next);
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => e.key === keyAtual() && listener();
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  function useStore(): T {
    return useSyncExternalStore(subscribe, read, () => initial);
  }

  /** Substitui tudo (sem mexer em atualizadoEm): usado ao baixar do servidor. */
  function substituir(valor: T) {
    window.localStorage.setItem(keyAtual(), JSON.stringify(valor));
    listeners.forEach((l) => l());
  }

  let aoGravar: ((chave: string, valor: T) => void) | undefined;
  function quandoGravar(fn: (chave: string, valor: T) => void) {
    aoGravar = fn;
  }

  return { read, write, useStore, substituir, quandoGravar };
}

/** Perfil que entrou (cookie legível pg_perfil). */
export function perfilAtual(): string {
  if (typeof document === "undefined") return "pietro";
  const m = document.cookie.match(/(?:^|; )pg_perfil=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : "pietro";
}

/** Chave de armazenamento do perfil atual. O Pietro herda o progresso salvo antes dos perfis existirem. */
export function chaveDoPerfil(base: string) {
  return () => {
    const perfil = perfilAtual();
    const chave = `${base}:${perfil}`;
    if (typeof window !== "undefined" && perfil === "pietro" && !window.localStorage.getItem(chave)) {
      const antigo = window.localStorage.getItem(base);
      if (antigo) window.localStorage.setItem(chave, antigo);
    }
    return chave;
  };
}
