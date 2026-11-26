"use client";

import { NOME_JOGADOR } from "@/config";
import { ANIMAIS } from "@/content/animais";
import { totalEstrelas, useProgress } from "@/lib/progress";
import { Arte } from "./Arte";
import { BotaoSom } from "./BotaoSom";
import { Contador } from "./Contador";

/** Topo das telas principais: avatar, saudação, placar e botão de som. */
export function Cabecalho() {
  const p = useProgress();
  return (
    <header className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 pt-4 pb-3">
      <span className="grid size-16 shrink-0 place-items-center rounded-md bg-amarelo-claro shadow-[0_5px_0_var(--color-amarelo)]">
        <Arte nome="animais/coruja" className="size-11" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h1 className="w-fit truncate rounded-full bg-branco/90 px-3 text-2xl font-extrabold text-roxo shadow-suave">Oi, {NOME_JOGADOR}!</h1>
        <div className="flex flex-wrap gap-2">
          <Contador icone="ui/estrela" valor={totalEstrelas(p)} rotulo="estrelas" />
          <Contador icone="ui/patinhas" valor={p.patinhas} rotulo="patinhas" />
          <Contador
            icone="ui/album"
            valor={p.animaisColetados.length}
            total={ANIMAIS.length}
            rotulo="figurinhas"
          />
        </div>
      </div>
      <BotaoSom />
    </header>
  );
}
