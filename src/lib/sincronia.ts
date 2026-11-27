"use client";

import { mesclar } from "./mesclar";
import { progressStore, type Progress } from "./progress";
import { perfilPorId } from "@/content/perfis";
import { perfilAtual } from "./store";

/**
 * O progresso vale em QUALQUER aparelho: o banco guarda a versão oficial.
 * - Ao abrir, a cada mudança (2 s depois) e ao voltar para o app: envia o que tem aqui;
 *   o servidor junta com o dos outros aparelhos e devolve tudo, que fica salvo aqui também.
 * - Se um adulto corrigiu no painel, este aparelho recebe a versão corrigida.
 * Sem internet, o progresso continua salvo no aparelho e sobe na próxima vez.
 */
let iniciado = false;
let timer: ReturnType<typeof setTimeout> | undefined;
let enviando = false;
let deNovo = false;

const chaveBase = () => `pg:sync:${perfilAtual()}`;
const base = () => Number(localStorage.getItem(chaveBase()) ?? 0);

async function sincronizar(keepalive = false) {
  if (perfilPorId(perfilAtual())?.visitante) return; // visitante: progresso só no aparelho
  if (enviando) {
    deNovo = true;
    return;
  }
  enviando = true;
  try {
    const r = await fetch("/api/progresso", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ perfil: perfilAtual(), dados: progressStore.read(), base: base() }),
      keepalive,
    }).catch(() => null);
    if (!r?.ok) return;
    const j = (await r.json().catch(() => null)) as { dados: Progress; corrigido: boolean; agora: number } | null;
    if (!j?.dados) return;
    // o que ele jogou enquanto o pedido ia e voltava também entra (exceto se houve correção no painel)
    const final = j.corrigido ? j.dados : mesclar(progressStore.read(), j.dados);
    progressStore.substituir({ ...progressStore.read(), ...final });
    localStorage.setItem(chaveBase(), String(j.agora));
  } finally {
    enviando = false;
    if (deNovo) {
      deNovo = false;
      agendar();
    }
  }
}

function agendar() {
  clearTimeout(timer);
  timer = setTimeout(() => sincronizar(), 2000);
}

export function iniciarSincronia() {
  if (iniciado || typeof window === "undefined") return;
  iniciado = true;
  progressStore.quandoGravar(() => agendar());
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      clearTimeout(timer);
      sincronizar(true);
    } else {
      sincronizar();
    }
  });
  sincronizar();
}
