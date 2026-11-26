"use client";

/**
 * MODO LEVE DO 3D
 * No iPhone/iPad (pouca memória de vídeo e tela 3x) a cena pode derrubar o WebGL. Quando isso acontece uma vez,
 * ligamos o modo leve (fica salvo no aparelho): resolução menor e sem sombras/pós-processamento.
 * Também começa ligado em aparelhos Apple com tela muito densa.
 */
const CHAVE = "pg:3d-leve";

export function modoLeve(): boolean {
  if (typeof window === "undefined") return false;
  if (localStorage.getItem(CHAVE) === "1") return true;
  const apple = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return apple && window.devicePixelRatio >= 3;
}

export function ligarModoLeve() {
  if (typeof window !== "undefined") localStorage.setItem(CHAVE, "1");
}

/** Aparelho de toque (celular ou tablet): dpr no máximo 1,5 e sem o nível "alto" (N8AO). */
export function ehCelular(): boolean {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod|Android/.test(navigator.userAgent) || window.matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 1;
}

/** Resolução máxima recomendada (dpr) para o Canvas. */
export const dprMaximo = () => (modoLeve() ? 1 : 1.5);
