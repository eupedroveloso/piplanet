"use client";

import { chaveDoPerfil, createPersistentStore } from "./store";

export interface Settings {
  /** Voz ligada (leitura de sílabas, palavras e curiosidades). */
  voz: boolean;
  /** Velocidade da fala. 0.8 é um pouco mais devagar que o normal. */
  velocidadeVoz: number;
  /** Último país visitado no mapa (abre direto nele ao voltar de um jogo). */
  ultimoPais: string | null;
}

export const settingsStore = createPersistentStore<Settings>(chaveDoPerfil("pg:settings"), {
  voz: true,
  velocidadeVoz: 0.8,
  ultimoPais: null,
});

export const useSettings = settingsStore.useStore;
