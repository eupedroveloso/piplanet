"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ANIMAIS, arteDoAnimal, type Animal } from "@/content/animais";
import {
  animaisDaFase,
  BICHOS_POR_FASE,
  chaveFase,
  JOGOS,
  SEQUENCIA,
  type Fase,
  type Territorio,
} from "@/content/jornada";
import { calcularEstrelas, coletarAnimal, concluirFase, ganharPatinhas, PONTOS } from "@/lib/progress";
import { shuffle } from "@/lib/random";
import { speak } from "@/lib/speech";
import { falarSobre } from "@/lib/falar-bicho";
import {
  Arte,
  Bolinhas,
  Botao,
  BotaoLink,
  BotaoRedondoLink,
  BotaoSom,
  CenarioFundo,
  Comemoracao,
  Estrelas,
  Mascote,
  MOLA_ENTRADA,
  NumeroAnimado,
  Painel,
} from "@/components/ui";

/**
 * MOLDURA COMUM DE TODA FASE
 * Cuida de: tela de início, fila de 5 bichos, pontuação, estrelas, figurinhas,
 * curiosidade depois do acerto e tela final. Cada jogo só desenha a "rodada" de um bicho.
 */

export interface RodadaProps {
  animal: Animal;
  territorio: Territorio;
  fase: Fase;
  acertou: boolean;
  /** Chame a cada tentativa errada (não pune, só conta para as estrelas e a dica). */
  errar: () => void;
  /** Chame quando o bicho for resolvido. */
  acertar: () => void;
}

type Etapa = "inicio" | "jogando" | "acertou" | "fim";

export function JogoFase({
  territorio,
  faseIdx,
  rodada,
}: {
  territorio: Territorio;
  faseIdx: number;
  rodada: (p: RodadaProps) => ReactNode;
}) {
  const fase = territorio.fases[faseIdx];
  const info = JOGOS[fase.jogo];
  const chave = chaveFase(territorio.id, faseIdx);
  const proxChave = SEQUENCIA[SEQUENCIA.indexOf(chave) + 1];

  const [etapa, setEtapa] = useState<Etapa>("inicio");
  const [fila, setFila] = useState<Animal[]>([]);
  const [indice, setIndice] = useState(0);
  const [errosBicho, setErrosBicho] = useState(0);
  const [errosFase, setErrosFase] = useState(0);
  const [pontosFase, setPontosFase] = useState(0);
  const [ganho, setGanho] = useState(0);
  const [figurinhaNova, setFigurinhaNova] = useState(false);
  const [novas, setNovas] = useState<string[]>([]);

  const animal = fila[indice];

  function comecar() {
    const nova = shuffle(animaisDaFase(territorio, fase)).slice(0, BICHOS_POR_FASE);
    setFila(nova);
    setIndice(0);
    setErrosBicho(0);
    setErrosFase(0);
    setPontosFase(0);
    setNovas([]);
    setEtapa("jogando");
    speak(info.instrucao);
  }

  function errar() {
    setErrosBicho((e) => e + 1);
    setErrosFase((e) => e + 1);
  }

  async function acertar() {
    if (!animal || etapa !== "jogando") return;
    const valor = PONTOS.bicho + (errosBicho === 0 ? PONTOS.semErro : 0);
    const nova = coletarAnimal(animal.id);
    ganharPatinhas(valor);
    setGanho(valor);
    setPontosFase((p) => p + valor);
    setFigurinhaNova(nova);
    if (nova) setNovas((n) => [...n, animal.id]);
    setEtapa("acertou");
    await speak(animal.nome);
    await speak(animal.curiosidade, { rate: 0.95 });
  }

  function proximo() {
    const prox = indice + 1;
    if (prox < fila.length) {
      setIndice(prox);
      setErrosBicho(0);
      setEtapa("jogando");
      return;
    }
    const estrelas = calcularEstrelas(errosFase);
    const total = pontosFase + PONTOS.fase;
    ganharPatinhas(PONTOS.fase);
    setPontosFase(total);
    concluirFase(chave, estrelas, total);
    setEtapa("fim");
    speak(`Parabéns! Você ganhou ${estrelas} ${estrelas === 1 ? "estrela" : "estrelas"}!`);
  }

  const topo = (
    <div className="flex items-center gap-2 pt-[env(safe-area-inset-top)] sm:gap-3">
      <BotaoRedondoLink href="/" aria-label="Voltar ao mapa">
        <Arte nome="ui/voltar" className="size-7" />
      </BotaoRedondoLink>
      <div className="flex min-w-0 flex-1 justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {etapa === "jogando" || etapa === "acertou" ? (
            <motion.div key="bolinhas" {...TROCA}>
              <Bolinhas total={fila.length} feitas={indice} atualConcluida={etapa === "acertou"} />
            </motion.div>
          ) : (
            <motion.span
              key="titulo"
              {...TROCA}
              className="flex min-w-0 items-center gap-2 text-base font-extrabold text-t-destaque uppercase sm:text-xl"
            >
              <Arte nome={info.icone} className="size-7 shrink-0" />
              <span className="truncate">
                {territorio.nome} · {fase.titulo}
              </span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      <BotaoSom />
    </div>
  );

  const tela = etapa === "fim" ? "fim" : etapa === "inicio" || !animal ? "inicio" : "jogo";

  // Para quem não sabe ler: a Juju explica o jogo assim que a tela de início aparece
  useEffect(() => {
    if (tela !== "inicio") return;
    const t = setTimeout(() => speak(info.instrucao), 500);
    return () => clearTimeout(t);
  }, [tela, info.instrucao]);
  const acertou = etapa === "acertou";
  const estrelas = calcularEstrelas(errosFase);
  const [pt, pf] = (proxChave ?? "").split("/");

  return (
    <div className="flex flex-1 flex-col gap-4">
      {/* Cenário do bioma atrás de tudo (início, jogo e fim) */}
      <CenarioFundo tipo={territorio.tipo} />
      <div className="relative z-10">{topo}</div>
      <AnimatePresence mode="wait">
        {/* ── Início ─────────────────────────────────────────────────────── */}
        {tela === "inicio" && (
          <motion.div key="inicio" {...TELA} className="relative z-10 flex flex-1 flex-col items-center justify-center gap-5 sm:gap-8">
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={MOLA_ENTRADA}
              className="flex items-center gap-2 rounded-full bg-branco px-4 py-1.5 shadow-suave sm:gap-3 sm:px-6 sm:py-2"
            >
              <Arte nome={info.icone} className="size-9 sm:size-10" />
              <span className="text-2xl font-extrabold text-roxo sm:text-3xl">{info.nome}</span>
            </motion.span>
            <Mascote fala={info.instrucao} tamanho="lg" />
            <motion.div
              className="flex flex-wrap justify-center gap-2 sm:gap-3"
              initial="fora"
              animate="dentro"
              variants={{ dentro: { transition: { staggerChildren: 0.06, delayChildren: 0.2 } } }}
            >
              {animaisDaFase(territorio, fase)
                .slice(0, 5)
                .map((a) => (
                  <motion.button
                    key={a.id}
                    type="button"
                    variants={CASCATA}
                    whileHover={{ y: -3 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => speak(a.nome)}
                    aria-label={a.nome}
                    className="grid size-16 place-items-center rounded-md bg-branco/70 sm:size-20"
                  >
                    <Arte src={arteDoAnimal(a)} className="size-12 sm:size-14" />
                  </motion.button>
                ))}
            </motion.div>
            {/* Única coisa chamando atenção: o botão de começar respira de leve */}
            <motion.div
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            >
              <Botao cor="amarelo" tamanho="lg" onClick={comecar} icone={<span aria-hidden className="grid size-9 place-items-center rounded-full bg-branco/35 text-xl leading-none">▶</span>}>
                Começar
              </Botao>
            </motion.div>
          </motion.div>
        )}

        {/* ── Fim ────────────────────────────────────────────────────────── */}
        {tela === "fim" && (
          <motion.div key="fim" {...TELA} className="relative z-10 flex flex-1 items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={MOLA_ENTRADA}
              className="w-full max-w-lg"
            >
              <Painel className="relative flex w-full flex-col items-center gap-5 p-8 text-center">
                <motion.span
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ ...MOLA_ENTRADA, delay: 0.15 }}
                  className="relative grid place-items-center"
                >
                  <Arte nome="ui/festa" className="size-20" />
                  <Comemoracao raio={110} />
                </motion.span>
                <h2 className="text-4xl font-extrabold text-roxo">Fase concluída!</h2>
                <Estrelas valor={estrelas} tamanho="lg" atraso={0.4} />
                <motion.p
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MOLA_ENTRADA, delay: 1.1 }}
                  className="flex items-center gap-2 text-2xl font-bold"
                >
                  <Arte nome="ui/patinhas" className="size-8" />
                  <span>
                    +<NumeroAnimado valor={pontosFase} de={0} /> patinhas
                  </span>
                </motion.p>
                {novas.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...MOLA_ENTRADA, delay: 1.4 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <p className="text-lg font-bold text-tinta-suave">Figurinhas novas no álbum:</p>
                    <motion.div
                      className="flex flex-wrap justify-center gap-2"
                      initial="fora"
                      animate="dentro"
                      variants={{ dentro: { transition: { staggerChildren: 0.1, delayChildren: 1.5 } } }}
                    >
                      {novas.map((id) => {
                        const a = ANIMAIS.find((x) => x.id === id)!;
                        return (
                          <motion.button
                            key={id}
                            type="button"
                            variants={CASCATA}
                            whileHover={{ y: -3 }}
                            whileTap={{ scale: 0.92 }}
                            onClick={() => speak(a.nome)}
                            aria-label={a.nome}
                          >
                            <Arte src={arteDoAnimal(a)} alt="" className="size-14" />
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </motion.div>
                )}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...MOLA_ENTRADA, delay: 1.3 }}
                  className="flex flex-wrap justify-center gap-3 pt-2"
                >
                  <BotaoLink
                    href={proxChave ? `/jogar/${pt}/${pf}` : "/"}
                    cor="verde"
                    tamanho="lg"
                    fala={proxChave ? "Próxima fase!" : "Voltar para o mapa"}
                    icone={<Arte nome={proxChave ? "ui/bandeira" : "ui/mapa"} className="size-9" />}
                  >
                    {proxChave ? "Próxima fase" : "Ver o mapa"}
                  </BotaoLink>
                  <Botao
                    cor="branco"
                    tamanho="lg"
                    onClick={comecar}
                    icone={<span aria-hidden className="text-3xl leading-none">↻</span>}
                  >
                    Jogar de novo
                  </Botao>
                </motion.div>
              </Painel>
            </motion.div>
          </motion.div>
        )}

        {/* ── Jogando / acertou ──────────────────────────────────────────── */}
        {tela === "jogo" && animal && (
          <motion.div
            key="jogo"
            {...TELA}
            className="relative z-10 flex flex-1 flex-col items-center justify-center gap-6 pb-8"
          >
            <AnimatePresence>
              {acertou && (
                <motion.span
                  initial={{ opacity: 0, y: 10, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  transition={{ ...MOLA_ENTRADA, delay: 0.3 }}
                  className="absolute top-0 right-0 flex items-center gap-1 rounded-full bg-amarelo px-4 py-1 text-2xl font-extrabold text-roxo shadow-[0_4px_0_var(--color-amarelo-escuro)]"
                >
                  +{ganho}
                  <Arte nome="ui/patinhas" className="size-7" />
                </motion.span>
              )}
            </AnimatePresence>

            {/* Troca de bicho: o anterior sai para a esquerda, o novo entra pela direita */}
            <AnimatePresence mode="wait">
              <motion.div
                key={animal.id}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.2 } }}
                transition={MOLA_ENTRADA}
                className="flex w-full flex-col items-center gap-6"
              >
                {rodada({ animal, territorio, fase, acertou, errar, acertar })}
              </motion.div>
            </AnimatePresence>

            <AnimatePresence>
              {acertou && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ ...MOLA_ENTRADA, delay: 0.5 }}
                  className="flex w-full max-w-xl flex-col items-center gap-4"
                >
                  {figurinhaNova && <SeloFigurinhaNova />}
                  <BotaoCuriosidade texto={animal.curiosidade} />
                  <Botao
                    cor="verde"
                    tamanho="lg"
                    onClick={proximo}
                    fala={indice + 1 < fila.length ? "Próximo bicho!" : undefined}
                    icone={
                      indice + 1 < fila.length ? (
                        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-branco/35 text-xl leading-none">→</span>
                      ) : (
                        <Arte nome="ui/trofeu" className="size-9" />
                      )
                    }
                  >
                    {indice + 1 < fila.length ? "Próximo bicho" : "Terminar"}
                  </Botao>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Troca de tela: fade + leve deslize. */
const TELA = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18 } },
  transition: MOLA_ENTRADA,
} as const;

/** Troca pequena no topo (título ↔ bolinhas). */
const TROCA = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.12 } },
  transition: MOLA_ENTRADA,
} as const;

/** Itens de lista que entram em cascata (use com staggerChildren no pai). */
const CASCATA = {
  fora: { opacity: 0, y: 12, scale: 0.9 },
  dentro: { opacity: 1, y: 0, scale: 1, transition: MOLA_ENTRADA },
};

/** "Figurinha nova!": entra com mola e um brilho gira devagar atrás do ícone. */
function SeloFigurinhaNova() {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={MOLA_ENTRADA}
      className="relative flex items-center gap-2 rounded-full bg-coral px-4 py-1 text-lg font-extrabold text-branco shadow-[0_4px_0_var(--color-coral-escuro)]"
    >
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
        className="grid place-items-center"
      >
        <Arte nome="ui/brilho" className="size-6" />
      </motion.span>
      Figurinha nova no álbum!
    </motion.span>
  );
}

/** Curiosidade do bicho: toque relê; brilha enquanto está sendo lida. */
function BotaoCuriosidade({ texto }: { texto: string }) {
  const [falando, setFalando] = useState(false);
  return (
    <motion.button
      type="button"
      onClick={async () => {
        setFalando(true);
        await speak(texto, { rate: 0.95 });
        setFalando(false);
      }}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex w-full items-start gap-3 rounded-lg bg-branco p-5 text-left text-xl font-semibold shadow-suave ring-amarelo transition-[box-shadow] duration-300 ${
        falando ? "ring-4" : "ring-0"
      }`}
    >
      <Arte nome="ui/lampada" className="size-9 shrink-0" />
      <span className="flex-1">{texto}</span>
      <motion.span
        animate={falando ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={falando ? { duration: 1, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        className="grid shrink-0 place-items-center"
      >
        <Arte nome="ui/som-ligado" className="size-7" />
      </motion.span>
    </motion.button>
  );
}

/** O bicho grande no centro da rodada. No acerto, pula de alegria e solta brilhos. */
export function CirculoBicho({ animal, acertou }: { animal: Animal; acertou: boolean }) {
  return (
    <motion.button
      type="button"
      onClick={() => (acertou ? falarSobre(animal) : speak("Que bicho é esse?"))}
      initial={{ scale: 0.6, opacity: 0 }}
      animate={acertou ? { scale: [1, 1.15, 1], rotate: [0, -6, 6, 0], opacity: 1 } : { scale: 1, opacity: 1 }}
      transition={acertou ? { duration: 0.7, ease: "easeInOut" } : { type: "spring", stiffness: 200, damping: 14 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`relative grid size-36 place-items-center rounded-full bg-branco transition-shadow duration-300 sm:size-52 ${
        acertou ? "shadow-[0_8px_0_var(--color-verde-escuro)] ring-4 ring-verde" : "shadow-[0_8px_0_var(--t-chao)]"
      }`}
      aria-label={acertou ? animal.nome : "Que bicho é esse?"}
    >
      <Arte src={arteDoAnimal(animal)} className="size-24 sm:size-36" />
      {acertou && <Comemoracao raio={140} />}
    </motion.button>
  );
}
