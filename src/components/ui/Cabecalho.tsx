"use client";

import { trocarPerfil, usePerfil } from "@/lib/perfil";
import { ANIMAIS } from "@/content/animais";
import { totalEstrelas, useProgress } from "@/lib/progress";
import { motion } from "motion/react";
import { speak } from "@/lib/speech";
import { Arte } from "./Arte";
import { BotaoRedondo, BotaoRedondoLink } from "./BotaoRedondo";
import { BotaoSom } from "./BotaoSom";
import { Contador } from "./Contador";
import { MOLA_ENTRADA, MOLA_TOQUE } from "./movimento";

/** Topo das telas principais: avatar, saudação, placar e botão de som. */
/** `estreito`: alinha com telas de conteúdo (ex.: álbum); padrão é largo, para o mapa em tela cheia. */
export function Cabecalho({ estreito = false }: { estreito?: boolean }) {
  const perfil = usePerfil();
  const p = useProgress();
  return (
    <header className={`mx-auto flex w-full ${estreito ? "max-w-3xl" : "max-w-6xl"} items-start justify-between gap-2 px-3 sm:gap-3 sm:px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-3`}>
      {/* Cartão de vidro: avatar + saudação + placar, tudo junto e leve */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={MOLA_ENTRADA}
        className="flex min-w-0 items-center gap-2 rounded-[2rem] py-1.5 pr-2 pl-1.5 vidro sm:gap-3 sm:py-2 sm:pr-3 sm:pl-2"
      >
        <motion.button
          type="button"
          aria-label={`Oi, ${perfil.nome}!`}
          onClick={() => speak(`Oi, ${perfil.nome}! Toque nos bichos do mapa para jogar.`)}
          whileHover={{ rotate: -6, scale: 1.05 }}
          whileTap={{ scale: 0.9 }}
          transition={MOLA_TOQUE}
          className="grid size-12 shrink-0 place-items-center rounded-full bg-amarelo-claro ring-2 ring-amarelo"
        >
          <Arte nome={perfil.avatar} className="size-9" />
        </motion.button>
        <div className="flex min-w-0 flex-col gap-1">
          {/* No celular a saudação vem pela voz (toque no avatar) para sobrar espaço ao mapa */}
          <h1 className="hidden truncate px-1 text-lg leading-tight font-extrabold text-roxo sm:block">Oi, {perfil.nome}!</h1>
          <div className="flex flex-wrap gap-1 sm:gap-1.5">
            <Contador icone="ui/estrela" valor={totalEstrelas(p)} rotulo="estrelas" />
            <Contador icone="ui/patinhas" valor={p.patinhas} rotulo="patinhas" />
            <Contador icone="ui/album" valor={p.animaisColetados.length} total={ANIMAIS.length} rotulo="figurinhas" />
          </div>
        </div>
      </motion.div>
      <div className="flex flex-col gap-2 sm:flex-row">
        {perfil.temSenha && (
          <BotaoRedondoLink href="/painel" aria-label="Aprendizado do Pietro">
            <Arte nome="ui/nivel" className="size-7" />
          </BotaoRedondoLink>
        )}
        <BotaoRedondo aria-label="Trocar de perfil" onClick={trocarPerfil}>
          <Arte nome="ui/casa" className="size-7" />
        </BotaoRedondo>
        <BotaoSom />
      </div>
    </header>
  );
}
