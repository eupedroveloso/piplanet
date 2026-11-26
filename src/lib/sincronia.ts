"use client";

import { progressStore, type Progress } from "./progress";
import { perfilAtual } from "./store";

/**
 * Sincroniza o progresso do perfil atual com o banco:
 * ao abrir, fica com a versão mais nova (aparelho x servidor); a cada mudança, envia (com atraso de 2 s).
 * Sem internet ou sem banco, nada quebra: o progresso continua salvo no aparelho.
 */
let iniciado = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let pendente: Progress | null = null;

function enviar(dados: Progress, keepalive = false) {
  return fetch("/api/progresso", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ perfil: perfilAtual(), dados }),
    keepalive,
  }).catch(() => null);
}

function agendar(dados: Progress) {
  pendente = dados;
  clearTimeout(timer);
  timer = setTimeout(() => {
    if (pendente) enviar(pendente);
    pendente = null;
  }, 2000);
}

export async function iniciarSincronia() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  progressStore.quandoGravar((_, valor) => agendar(valor));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pendente) {
      clearTimeout(timer);
      enviar(pendente, true);
      pendente = null;
    }
  });

  const r = await fetch(`/api/progresso?perfil=${perfilAtual()}`).catch(() => null);
  if (!r?.ok) return;
  const { dados } = (await r.json()) as { dados: Progress | null };
  const local = progressStore.read();
  if (dados && (dados.atualizadoEm ?? 0) > (local.atualizadoEm ?? 0)) {
    progressStore.substituir({ ...local, ...dados });
  } else if (local.atualizadoEm > 0 || local.patinhas > 0) {
    enviar(local);
  }
}
