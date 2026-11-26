"use client";

import { useEffect, useState } from "react";

/** Imagens já carregadas nesta sessão (não pede de novo). */
const prontas = new Set<string>();

function carregar(url: string): Promise<void> {
  if (prontas.has(url)) return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    const fim = () => {
      prontas.add(url);
      resolve();
    };
    img.onload = fim;
    img.onerror = fim; // não trava a tela por uma imagem com problema
    img.src = url;
    if (img.complete) fim();
  });
}

/**
 * Pré-carrega imagens antes de mostrar uma tela (evita bichos aparecendo pela metade).
 * Devolve true quando todas estão prontas (ou depois de `limiteMs`, para nunca travar).
 */
export function usePreCarregar(urls: string[], limiteMs = 4000): boolean {
  const chave = urls.join("|");
  const [prontoPara, setProntoPara] = useState<string | null>(() => (urls.every((u) => prontas.has(u)) ? chave : null));
  useEffect(() => {
    let vivo = true;
    const marcar = () => vivo && setProntoPara(chave);
    // Se tudo já entrou no cache (inclusive entre a renderização e este efeito), avisa a tela numa microtarefa.
    // Antes o efeito saía cedo sem renderizar de novo e a tela ficava presa no esqueleto.
    if (urls.every((u) => prontas.has(u))) {
      queueMicrotask(marcar);
      return () => {
        vivo = false;
      };
    }
    // trava: nunca espera mais que limiteMs
    const t = setTimeout(marcar, limiteMs);
    Promise.all(urls.map(carregar)).then(() => {
      clearTimeout(t);
      marcar();
    });
    return () => {
      vivo = false;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, limiteMs]);
  return prontoPara === chave || urls.every((u) => prontas.has(u));
}

/** Pré-carrega em segundo plano, sem esperar (ex.: imagens da próxima tela). */
export function preCarregarDepois(urls: string[]) {
  if (typeof window === "undefined") return;
  const ir = () => urls.forEach((u) => void carregar(u));
  if ("requestIdleCallback" in window) (window as Window & { requestIdleCallback: (f: () => void) => void }).requestIdleCallback(ir);
  else setTimeout(ir, 1200);
}
