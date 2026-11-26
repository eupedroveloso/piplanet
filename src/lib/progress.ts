"use client";

import { useMemo, useSyncExternalStore } from "react";
import { perfilPorId } from "@/content/perfis";
import { chaveDoPerfil, createPersistentStore, perfilAtual } from "./store";

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

/** Flashcard com repetição espaçada (caixas de Leitner) + histórico para o painel dos adultos. */
export interface Carta {
  caixa: number;
  proxima: number;
  /** Quantas vezes a carta foi vista. */
  vistas?: number;
  /** Quantas vezes ele leu sozinho (sem ouvir antes). */
  sozinho?: number;
  /** Última vez vista (ms). */
  ultima?: number;
}

/** Um bicho dentro de uma lição: erros, tempo e se precisou da dica (2+ erros). */
export interface BichoSessao {
  id: string;
  erros: number;
  ms: number;
}

/** Registro de uma sessão (lição, cartas ou nivelamento), para monitorar o aprendizado. */
export interface Sessao {
  tipo: "fase" | "cartas" | "nivelamento";
  /** Fase: "territorio/indice". */
  chave?: string;
  jogo?: string;
  inicio: number;
  fim: number;
  concluida: boolean;
  erros: number;
  estrelas?: number;
  bichos?: BichoSessao[];
  /** Cartas: lidas sozinho / total vistas. */
  lidas?: number;
  vistas?: number;
}

export interface Progress {
  patinhas: number;
  animaisColetados: string[];
  fases: Record<string, ResultadoFase>;
  nivelamentos: Nivelamento[];
  cartas: Record<string, Carta>;
  /** Últimas sessões (para o painel dos adultos). */
  sessoes: Sessao[];
  /** Quando o progresso mudou pela última vez (ms) — usado para sincronizar aparelhos. */
  atualizadoEm: number;
}

export const progressStore = createPersistentStore<Progress>(chaveDoPerfil("pg:progress:v3"), {
  patinhas: 0,
  animaisColetados: [],
  fases: {},
  nivelamentos: [],
  cartas: {},
  sessoes: [],
  atualizadoEm: 0,
});

const semAssinatura = () => () => {};

/** Progresso do perfil atual. `tudoLiberado` vem do perfil (ex.: Pedro tem tudo aberto). */
export function useProgress(): Progress & { tudoLiberado: boolean } {
  const p = progressStore.useStore();
  const liberado = useSyncExternalStore(semAssinatura, () => !!perfilPorId(perfilAtual())?.tudoLiberado, () => false);
  return useMemo(() => ({ ...p, tudoLiberado: liberado }), [p, liberado]);
}

/** "Tudo concluído" para efeito de desbloqueio: qualquer chave existe. */
const TUDO_ABERTO: Record<string, unknown> = new Proxy({}, { has: () => true });

/** O que conta como concluído para liberar fases/biomas/países (tudo, se o perfil tiver tudo liberado). */
export function liberadas(p: Progress & { tudoLiberado?: boolean }): Record<string, unknown> {
  return p.tudoLiberado ? TUDO_ABERTO : p.fases;
}

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
    const antes = p.cartas[id];
    const atual = antes?.caixa ?? 1;
    const caixa = leuSozinho ? Math.min(5, atual + 1) : 1;
    const agora = Date.now();
    return {
      ...p,
      cartas: {
        ...p.cartas,
        [id]: {
          caixa,
          proxima: agora + INTERVALOS[caixa],
          vistas: (antes?.vistas ?? 0) + 1,
          sozinho: (antes?.sozinho ?? 0) + (leuSozinho ? 1 : 0),
          ultima: agora,
        },
      },
    };
  });
}

/** Guarda uma sessão (mantém as 400 mais recentes). Sessões de menos de 3 s são ignoradas. */
export function registrarSessao(s: Sessao) {
  if (s.fim - s.inicio < 3000) return;
  progressStore.write((p) => ({ ...p, sessoes: [...(p.sessoes ?? []), s].slice(-400) }));
}
