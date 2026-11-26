"use client";

import { useGLTF } from "@react-three/drei";
import type * as THREE from "three";
import type { PaisId } from "@/content/paises";
import { montarMundo } from "./decoracao";
import { criarIlha, geometriaTerreno, type Ilha } from "./ilha";
import { modelosLigados, urlModelos } from "./modelos";

/**
 * CARREGAMENTO DO MUNDO 3D
 * - A ilha é gerada em ETAPAS (silhueta/relevo → decoração → terreno), devolvendo o quadro entre elas:
 *   a tela de carregamento continua animando no celular em vez de congelar ~1 s.
 * - Tudo fica em cache (criarIlha e montarMundo já guardam; o terreno, que depende do que está liberado, guarda aqui).
 * - Pré-carregamento em segundo plano (quando o aparelho está ocioso): o próximo país liberado e,
 *   no planeta, o país atual. Só CPU e rede: nada vai para a GPU antes de o país abrir (seguro no iPhone).
 */

/** Terreno por país, com a chave do que está liberado (mudou um bioma → gera de novo). */
const cacheTerreno = new Map<PaisId, { chave: string; geo: THREE.BufferGeometry }>();

const chaveLiberados = (ilha: Ilha, liberados: Record<string, boolean>) =>
  ilha.biomas.map((b) => (liberados[b.id] ? 1 : 0)).join("");

export function terrenoEmCache(ilha: Ilha, liberados: Record<string, boolean>) {
  const chave = chaveLiberados(ilha, liberados);
  const pronto = cacheTerreno.get(ilha.pais);
  if (pronto && pronto.chave === chave) return pronto.geo;
  // a geometria antiga pode ainda estar na tela: o R3F a descarta ao trocar; aqui só sai do cache
  const geo = geometriaTerreno(ilha, liberados);
  cacheTerreno.set(ilha.pais, { chave, geo });
  return geo;
}

/** Devolve o quadro ao navegador (para a tela de carregamento animar entre as etapas). */
const respirar = () => new Promise<void>((r) => setTimeout(r, 0));

/** Espera o aparelho ficar ocioso (Safari não tem requestIdleCallback: usa um atraso). */
function quandoOcioso(fn: () => void) {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
  if (w.requestIdleCallback) w.requestIdleCallback(fn, { timeout: 4000 });
  else setTimeout(fn, 1500);
}

/** Gera ilha, decoração e terreno em etapas, cedendo o quadro entre elas. */
export async function gerarIlhaEmEtapas(pais: PaisId, liberados: Record<string, boolean>): Promise<Ilha> {
  await respirar();
  const ilha = criarIlha(pais);
  await respirar();
  montarMundo(ilha);
  await respirar();
  terrenoEmCache(ilha, liberados);
  return ilha;
}

const jaPedidos = new Set<string>();

/** Pré-carrega um país em segundo plano: o pacote de modelos (rede) e a geração da ilha (CPU, uma etapa por ociosidade). */
export function precarregarPais(pais: PaisId, liberados: Record<string, boolean>) {
  if (typeof window === "undefined" || jaPedidos.has(pais)) return;
  jaPedidos.add(pais);
  if (modelosLigados()) useGLTF.preload(urlModelos(pais), false, true);
  quandoOcioso(() => {
    const ilha = criarIlha(pais);
    quandoOcioso(() => {
      montarMundo(ilha);
      quandoOcioso(() => terrenoEmCache(ilha, liberados));
    });
  });
}
