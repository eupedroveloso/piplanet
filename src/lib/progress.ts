"use client";

import { createPersistentStore } from "./store";

/**
 * GAMIFICAÇÃO (sem punição)
 * - Patinhas 🐾: pontos ganhos a cada bicho lido. Nunca diminuem.
 * - Estrelas ⭐: 1 a 3 por fase. Terminar sempre dá pelo menos 1. Guarda o melhor resultado.
 * - Álbum: cada bicho lido vira figurinha.
 * - Fases se desbloqueiam em sequência; territórios inteiros viram medalha.
 */

export interface ResultadoFase {
  estrelas: 1 | 2 | 3;
  melhorPontos: number;
  vezes: number;
}

export interface Progress {
  patinhas: number;
  animaisColetados: string[];
  fases: Record<string, ResultadoFase>;
}

export const progressStore = createPersistentStore<Progress>("pg:progress:v3", {
  patinhas: 0,
  animaisColetados: [],
  fases: {},
});

export const useProgress = progressStore.useStore;

export const PONTOS = {
  /** Por bicho montado. */
  bicho: 10,
  /** Extra quando monta sem nenhum erro. */
  semErro: 5,
  /** Extra ao concluir a fase. */
  fase: 20,
} as const;

/** Até 1 erro na fase toda: 3 estrelas. Até 4: 2 estrelas. Mais que isso: 1 estrela. */
export function calcularEstrelas(errosNaFase: number): 1 | 2 | 3 {
  if (errosNaFase <= 1) return 3;
  if (errosNaFase <= 4) return 2;
  return 1;
}

export function ganharPatinhas(qtd: number) {
  progressStore.write((p) => ({ ...p, patinhas: p.patinhas + qtd }));
}

export function coletarAnimal(id: string): boolean {
  let novo = false;
  progressStore.write((p) => {
    if (p.animaisColetados.includes(id)) return p;
    novo = true;
    return { ...p, animaisColetados: [...p.animaisColetados, id] };
  });
  return novo;
}

export function concluirFase(chave: string, estrelas: 1 | 2 | 3, pontos: number) {
  progressStore.write((p) => {
    const antes = p.fases[chave];
    return {
      ...p,
      fases: {
        ...p.fases,
        [chave]: {
          estrelas: Math.max(estrelas, antes?.estrelas ?? 1) as 1 | 2 | 3,
          melhorPontos: Math.max(pontos, antes?.melhorPontos ?? 0),
          vezes: (antes?.vezes ?? 0) + 1,
        },
      },
    };
  });
}

export function totalEstrelas(p: Progress) {
  return Object.values(p.fases).reduce((s, f) => s + f.estrelas, 0);
}
