"use client";

import { motion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { CRIANCAS, noGenero, perfilPorId } from "@/content/perfis";
import type { Progress } from "@/lib/progress";
import { Arte, BotaoRedondo, Esqueleto, MOLA_ENTRADA, MOLA_TOQUE, NavInferior } from "@/components/ui";
import { carregar, escolherAlvo, metricas, useAlvo, VAZIO } from "./dados";

/** Hora atual, lida só em efeitos e eventos. */
const agoraMs = () => Date.now();

/**
 * Progresso da criança escolhida (Pietro ou Pérola), vindo de carregar() (banco; no teste local, o aparelho).
 * Recarrega quando a escolha muda (a escolha vale para todas as telas dos Pais).
 */
export function useEspelho() {
  const alvo = useAlvo();
  const [dados, setDados] = useState<Progress | null>(null);
  const [carregadoPara, setCarregadoPara] = useState<string | null>(null);
  const [agora, setAgora] = useState(0);
  const [versao, setVersao] = useState(0);

  useEffect(() => {
    let vivo = true;
    carregar().then((c) => {
      if (!vivo) return;
      setDados(c.dados);
      setAgora(agoraMs());
      setCarregadoPara(alvo);
    });
    return () => {
      vivo = false;
    };
  }, [alvo, versao]);

  const carregando = carregadoPara !== alvo;
  const base = (!carregando && dados) || VAZIO;
  return {
    alvo,
    crianca: perfilPorId(alvo) ?? CRIANCAS()[0],
    carregando,
    base,
    m: metricas(base, agora),
    agora,
    recarregar: () => {
      setCarregadoPara(null);
      setVersao((v) => v + 1);
    },
  };
}

/** Seletor de criança (rostos lado a lado; a escolhida em destaque). */
export function SeletorCrianca({ alvo }: { alvo: string }) {
  return (
    <div role="tablist" aria-label="Criança" className="flex shrink-0 gap-1 rounded-full bg-branco/80 p-1 shadow-suave">
      {CRIANCAS().map((c) => {
        const ativa = c.id === alvo;
        return (
          <motion.button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={ativa}
            aria-label={c.nome}
            onClick={() => !ativa && escolherAlvo(c.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.9 }}
            transition={MOLA_TOQUE}
            className="relative grid size-12 place-items-center rounded-full"
          >
            {ativa && (
              <motion.span
                layoutId="crianca-espelho"
                transition={MOLA_ENTRADA}
                className={`absolute inset-0 rounded-full ring-[3px] ${c.personagem === "perola" ? "bg-verde-claro ring-verde" : "bg-amarelo-claro ring-amarelo"}`}
              />
            )}
            <Arte nome={c.avatar} className={`relative size-10 transition-[filter,opacity] duration-300 ${ativa ? "" : "opacity-60 grayscale-[0.5]"}`} />
          </motion.button>
        );
      })}
    </div>
  );
}

/**
 * Moldura das telas-espelho dos Pais (somente leitura): seletor de criança + título + atualizar,
 * conteúdo (sem rolagem) e o rodapé dos Pais. Enquanto carrega, mostra o esqueleto (nunca dados da outra criança).
 */
export function TelaEspelho({
  titulo,
  icone,
  esp,
  children,
}: {
  titulo: string;
  icone: string;
  esp: ReturnType<typeof useEspelho>;
  children: ReactNode;
}) {
  const { crianca, alvo, carregando, recarregar } = esp;
  return (
    <div className="mx-auto flex h-dvh w-full max-w-6xl flex-col gap-3 overflow-hidden px-4 pt-[max(env(safe-area-inset-top),0.75rem)] sm:px-6">
      <div className="flex shrink-0 items-center gap-2.5">
        <SeletorCrianca alvo={alvo} />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Arte nome={icone} className="hidden size-7 shrink-0 sm:block" />
          <h1 className="text-base leading-tight font-extrabold text-roxo sm:text-xl">
            {titulo} {noGenero(crianca.genero, "do", "da")} {crianca.nome}
          </h1>
        </div>
        <BotaoRedondo aria-label="Atualizar" fala={false} onClick={recarregar}>
          <motion.span
            aria-hidden
            animate={carregando ? { rotate: 360 } : { rotate: 0 }}
            transition={carregando ? { repeat: Infinity, duration: 1, ease: "linear" } : MOLA_TOQUE}
            className="grid place-items-center text-2xl leading-none font-extrabold text-roxo"
          >
            ↻
          </motion.span>
        </BotaoRedondo>
      </div>
      <div className="relative min-h-0 flex-1">
        {carregando ? (
          <div role="status" aria-label="Carregando" className="grid content-start gap-3 md:grid-cols-2 md:gap-4">
            <Esqueleto className="h-24" />
            <Esqueleto className="h-48" />
            <Esqueleto className="hidden h-48 md:block" />
            <Esqueleto className="hidden h-24 md:block" />
          </div>
        ) : (
          <motion.div key={alvo} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={MOLA_ENTRADA} className="h-full">
            {children}
          </motion.div>
        )}
      </div>
      <NavInferior />
    </div>
  );
}
