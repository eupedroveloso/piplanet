"use client";

import { useEffect } from "react";
import { ANIMAIS } from "@/content/animais";
import { perfilPorId } from "@/content/perfis";
import { progressStore } from "@/lib/progress";
import { iniciarSincronia } from "@/lib/sincronia";
import { perfilAtual } from "@/lib/store";

/** Liga a sincronização do progresso com o banco (invisível). */
export function Sincronia() {
  useEffect(() => {
    if (location.pathname.startsWith("/entrar")) return;
    // visitante: todas as figurinhas já no álbum (e nas cartas), gravadas no aparelho
    if (perfilPorId(perfilAtual())?.visitante) {
      const todos = ANIMAIS.map((a) => a.id);
      const p = progressStore.read();
      if (todos.some((id) => !p.animaisColetados.includes(id))) progressStore.write((x) => ({ ...x, animaisColetados: todos }));
    }
    iniciarSincronia();
  }, []);
  return null;
}
