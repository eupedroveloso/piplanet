"use client";

import type { Animal } from "@/content/animais";
import { CURIOSIDADES } from "@/content/curiosidades";
import { falarEmSequencia } from "./speech";

/** Qual curiosidade extra de cada bicho foi falada por último (gira a cada toque). */
const proxima = new Map<string, number>();

/** Toda curiosidade começa com esta fala (áudio separado, para não regravar as curiosidades). */
export const VOCE_SABIA = "Você sabia?";

/** Todas as curiosidades do bicho: a principal + as extras. */
export function curiosidadesDe(a: Animal) {
  return [a.curiosidade, ...(CURIOSIDADES[a.id] ?? [])];
}

/**
 * Fala sobre o bicho: o nome, a curiosidade principal na primeira vez e,
 * a cada novo toque, uma curiosidade diferente (dá a volta em todas).
 */
export async function falarSobre(a: Animal, opts: { comNome?: boolean } = {}) {
  const todas = curiosidadesDe(a);
  const i = proxima.get(a.id) ?? 0;
  proxima.set(a.id, (i + 1) % todas.length);
  await falarEmSequencia([...(opts.comNome !== false ? [a.nome] : []), VOCE_SABIA, { texto: todas[i], rate: 0.95 }]);
}
