"use client";

import { useEffect, useMemo, useState } from "react";
import { chaveFase } from "@/content/jornada";
import type { Progress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { perfilAtual } from "@/lib/store";
import type { Ilha } from "./ilha";

/**
 * CAMINHO SENDO TRILHADO
 * A trilha fica "feita" (colorida) do início até a próxima fase a jogar. Quando a criança
 * acabou de concluir uma fase (ou abre um país pela primeira vez), o trecho novo se desenha
 * do nó antigo até o novo em ~1,5 s, a câmera acompanha de leve e o nó novo acende.
 * Para animar só uma vez: a última posição exibida fica no sessionStorage (por perfil e país).
 */

export const DURACAO_CAMINHO = 1500; // ms
/** Espera a tela de carregamento sumir e a câmera chegar no bioma antes de começar. */
const ATRASO = 1500;

export interface Caminho {
  /** Posição na trilha amostrada (índice de ilha.trilha) de onde parte e onde chega. */
  de: number;
  ate: number;
  /** performance.now() do começo; null = parado em `de` (esperando) ou sem animação (de = ate). */
  t0: number | null;
}

const cacheIndices = new WeakMap<Ilha, number[]>();
/** Índice na trilha (ilha.trilha) do ponto mais perto de cada fase, na ordem de ilha.fases. */
export function indicesDasFases(ilha: Ilha) {
  const pronto = cacheIndices.get(ilha);
  if (pronto) return pronto;
  const idx = ilha.fases.map((f) => {
    let melhor = 0;
    let d = Infinity;
    ilha.trilha.forEach((p, i) => {
      const dd = (p.x - f.pos.x) ** 2 + (p.z - f.pos.z) ** 2;
      if (dd < d) [d, melhor] = [dd, i];
    });
    return melhor;
  });
  cacheIndices.set(ilha, idx);
  return idx;
}

/** Quantas fases da ilha estão concluídas em sequência (= posição da próxima fase a jogar). */
function feitasEmSequencia(ilha: Ilha, progresso: Progress) {
  const k = ilha.fases.findIndex((f) => !(chaveFase(f.territorio, f.fase) in progresso.fases));
  return k < 0 ? ilha.fases.length : k;
}

/** Até onde a trilha fica colorida com k fases feitas: até o nó da próxima fase (ou o fim). */
function feitoAte(ilha: Ilha, k: number) {
  return k >= ilha.fases.length ? ilha.trilha.length - 1 : indicesDasFases(ilha)[k];
}

const chaves = (pais: string) => {
  const perfil = perfilAtual();
  return { vista: `pg:trilha:${pais}:${perfil}`, estreia: `pg:trilha-estreia:${pais}:${perfil}` };
};

export interface Caminhada {
  caminho: Caminho | null;
  /** true enquanto o trecho se desenha (a mãozinha viaja na ponta). */
  andando: boolean;
  /** Nó que acabou de acender ("territorio-fase"), por ~1 s. */
  acender: string | null;
}

export function useCaminhada(ilha: Ilha | null, progresso: Progress, pronto: boolean): Caminhada {
  const k = ilha ? feitasEmSequencia(ilha, progresso) : 0;

  // O que mostrar ANTES de animar (decidido já no primeiro quadro, para o trecho novo não piscar pronto)
  const plano = useMemo(() => {
    if (!ilha || typeof window === "undefined") return null;
    const c = chaves(ilha.pais);
    const visto = window.sessionStorage.getItem(c.vista);
    let de: number | null = null;
    if (visto !== null && Number(visto) < k) de = feitoAte(ilha, Number(visto));
    else if (visto === null && k === 0 && !window.localStorage.getItem(c.estreia)) de = 0; // país novo: do píer até a 1ª fase
    return { de: de ?? feitoAte(ilha, k), ate: feitoAte(ilha, k), animar: de !== null, estreia: de === 0 && k === 0 };
  }, [ilha, k]);

  const [inicio, setInicio] = useState<{ ilha: Ilha; k: number; t0: number } | null>(null);
  const [acender, setAcender] = useState<string | null>(null);
  const [andando, setAndando] = useState(false);

  useEffect(() => {
    if (!ilha || !plano) return;
    const c = chaves(ilha.pais);
    if (!plano.animar) {
      window.sessionStorage.setItem(c.vista, String(k));
      window.localStorage.setItem(c.estreia, "1");
      return;
    }
    if (!pronto) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(
      setTimeout(() => {
        // grava só quando começa de verdade (o StrictMode monta o efeito duas vezes)
        window.sessionStorage.setItem(c.vista, String(k));
        window.localStorage.setItem(c.estreia, "1");
        setInicio({ ilha, k, t0: performance.now() });
        setAndando(true);
        timers.push(
          setTimeout(() => {
            setAndando(false);
            const f = ilha.fases[k];
            if (f) {
              setAcender(`${f.territorio}-${f.fase}`);
              if (!plano.estreia) speak("Oba! Caminho novo!");
            }
            timers.push(setTimeout(() => setAcender(null), 1200));
          }, DURACAO_CAMINHO),
        );
      }, ATRASO),
    );
    return () => timers.forEach(clearTimeout);
  }, [ilha, k, plano, pronto]);

  if (!ilha || !plano) return { caminho: null, andando: false, acender: null };
  const comecou = inicio && inicio.ilha === ilha && inicio.k === k;
  return {
    caminho: { de: plano.de, ate: plano.ate, t0: comecou ? inicio.t0 : null },
    andando: andando && !!comecou,
    acender,
  };
}
