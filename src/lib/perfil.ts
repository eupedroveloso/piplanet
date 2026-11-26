"use client";

import { useSyncExternalStore } from "react";
import { perfilPorId, PERFIS, type Perfil } from "@/content/perfis";
import { perfilAtual } from "./store";

const nada = () => () => {};

/** Perfil que entrou (lido do cookie). No servidor, assume o Pietro. */
export function usePerfil(): Perfil {
  const id = useSyncExternalStore(nada, perfilAtual, () => "pietro");
  return perfilPorId(id) ?? PERFIS[0];
}

/** Sai do perfil e volta para a tela "Quem vai jogar?". */
export async function trocarPerfil() {
  await fetch("/api/entrar", { method: "DELETE" }).catch(() => null);
  window.location.assign("/entrar");
}
