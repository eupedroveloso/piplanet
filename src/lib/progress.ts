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

/** Resultado de um nivelamento (teste de leitura). nível 1..6; acertos por nível: [certos, total]. */
export interface Nivelamento {
  data: string;
  nivel: number;
  acertos: Record<number, [number, number]>;
}

/** Flashcard com repetição espaçada (caixas de Leitner). */
export interface Carta {
  caixa: number;
  proxima: number;
}

export interface Progress {
  patinhas: number;
  animaisColetados: string[];
  fases: Record<string, ResultadoFase>;
  nivelamentos: Nivelamento[];
  cartas: Record<string, Carta>;
}

export const progressStore = createPersistentStore<Progress>("pg:progress:v3", {
  patinhas: 0,
  animaisColetados: [],
  fases: {},
  nivelamentos: [],
  cartas: {},
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

export function registrarNivelamento(n: Nivelamento) {
  progressStore.write((p) => ({ ...p, nivelamentos: [...p.nivelamentos, n].slice(-30) }));
}

const DIA = 24 * 60 * 60 * 1000;
/** Intervalo até a carta voltar, por caixa: 1 = já, 2 = amanhã, 3 = 2 dias, 4 = 4 dias, 5 = 8 dias. */
const INTERVALOS = [0, 0, DIA, 2 * DIA, 4 * DIA, 8 * DIA];

/** Atualiza a carta: leu sozinho → sobe de caixa (volta mais tarde); senão → volta para a caixa 1. */
export function avaliarCarta(id: string, leuSozinho: boolean) {
  progressStore.write((p) => {
    const atual = p.cartas[id]?.caixa ?? 1;
    const caixa = leuSozinho ? Math.min(5, atual + 1) : 1;
    return { ...p, cartas: { ...p.cartas, [id]: { caixa, proxima: Date.now() + INTERVALOS[caixa] } } };
  });
}
