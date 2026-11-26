"use client";

import { AnimatePresence, motion, type PanInfo } from "motion/react";
import { useState } from "react";
import { arteDoAnimal, type Animal } from "@/content/animais";
import { animaisDoTerritorio, chaveFase, faseDesbloqueada, TERRITORIOS } from "@/content/jornada";
import { paisPorId, TEMAS } from "@/content/paises";
import { useProgress, type Progress, liberadas } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { FichaBicho } from "./FichaBicho";
import { Arte, BALANCO, BotaoRedondo, Esqueleto, fonteQueCabeEm, ImagemSuave, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

/** Território onde a criança está jogando agora (o álbum abre nele). */
function indiceAtual(p: Progress) {
  const i = TERRITORIOS.findIndex((t) => t.fases.some((_, k) => !(chaveFase(t.id, k) in p.fases) && faseDesbloqueada(liberadas(p), t.id, k)));
  return Math.max(0, i);
}

/**
 * ÁLBUM DE FIGURINHAS (uma página por território, sem rolagem)
 * Cada página ocupa a tela: cabeçalho do território, grade que se ajusta à altura disponível,
 * setas grandes (com voz) e bolinhas de página. Dá para deslizar o dedo para os lados.
 * Bicho lido aparece colorido e abre a ficha; o que falta fica em silhueta, balança e avisa com carinho.
 */
export function Album() {
  const progresso = useProgress();
  const { animaisColetados } = progresso;
  const [pagina, setPagina] = useState<number | null>(null);
  const [direcao, setDirecao] = useState(1);
  const [lendo, setLendo] = useState<string | null>(null);
  const [balancando, setBalancando] = useState<string | null>(null);
  const [aberto, setAberto] = useState<Animal | null>(null);

  const atual = pagina ?? indiceAtual(progresso);
  const t = TERRITORIOS[atual];
  const bichos = animaisDoTerritorio(t.id);
  const tem = bichos.filter((b) => animaisColetados.includes(b.id)).length;
  // Grade que cabe: até 12 bichos em 4 colunas × 3 linhas no celular
  const colunas = bichos.length <= 4 ? 2 : bichos.length <= 9 ? 3 : 4;
  const linhas = Math.ceil(bichos.length / colunas);

  function falarTerritorio(i: number) {
    const tt = TERRITORIOS[i];
    const bs = animaisDoTerritorio(tt.id);
    const n = bs.filter((b) => animaisColetados.includes(b.id)).length;
    speak(`${tt.nome}. Você tem ${n} de ${bs.length} figurinhas.`);
  }

  function irPara(i: number) {
    const novo = (i + TERRITORIOS.length) % TERRITORIOS.length;
    setDirecao(i > atual ? 1 : -1);
    setPagina(novo);
    falarTerritorio(novo);
  }

  function soltar(_: unknown, info: PanInfo) {
    if (info.offset.x < -60 || info.velocity.x < -400) irPara(atual + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) irPara(atual - 1);
  }

  async function tocar(b: Animal, ok: boolean) {
    if (!ok) {
      setBalancando(b.id);
      setTimeout(() => setBalancando((x) => (x === b.id ? null : x)), 450);
      speak("Essa figurinha ainda vai chegar. Continue jogando!");
      return;
    }
    // abre a ficha com a foto real (a ficha fala o nome e uma curiosidade)
    setLendo(b.id);
    setAberto(b);
    setTimeout(() => setLendo((x) => (x === b.id ? null : x)), 600);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-3">
      <FichaBicho animal={aberto} onFechar={() => setAberto(null)} />

      {/* Página do território: desliza com o dedo */}
      <div className="relative min-h-0 flex-1">
        <AnimatePresence mode="popLayout" initial={false} custom={direcao}>
          <motion.section
            key={t.id}
            custom={direcao}
            variants={{
              entra: (d: number) => ({ opacity: 0, x: d * 60 }),
              fica: { opacity: 1, x: 0 },
              sai: (d: number) => ({ opacity: 0, x: d * -60, transition: { duration: 0.18 } }),
            }}
            initial="entra"
            animate="fica"
            exit="sai"
            transition={MOLA_ENTRADA}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={soltar}
            style={
              {
                "--t-fundo": TEMAS[t.tipo].fundo,
                "--t-chao": TEMAS[t.tipo].chao,
                "--t-destaque": TEMAS[t.tipo].destaque,
              } as React.CSSProperties
            }
            className="absolute inset-0 flex touch-pan-y flex-col rounded-xl bg-t-fundo p-3 sm:p-5"
          >
            <motion.button
              type="button"
              onClick={() => falarTerritorio(atual)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              transition={MOLA_TOQUE}
              className="mb-2 flex w-full shrink-0 items-center justify-between gap-3 rounded-lg px-1 text-left sm:mb-3"
            >
              {/* Ícone primeiro: o primeiro bicho do bioma */}
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-branco/70">
                <Arte src={arteDoAnimal(bichos[0])} className="size-9" />
              </span>
              <h2 className="flex min-w-0 flex-1 flex-col text-xl leading-tight font-extrabold text-t-destaque uppercase sm:text-2xl">
                <span className="truncate text-xs font-bold tracking-wide opacity-80 sm:text-sm">{paisPorId(t.pais).nome}</span>
                <span className="truncate">{t.nome}</span>
              </h2>
              <span className="flex shrink-0 items-center gap-1 text-lg font-bold text-t-destaque">
                <Arte nome="ui/album" className="size-6" />
                {tem}/{bichos.length}
              </span>
            </motion.button>

            {/* Grade que ocupa exatamente a altura que sobra (linhas 1fr) */}
            <motion.div
              className="grid min-h-0 flex-1 gap-2 sm:gap-3"
              style={{
                gridTemplateColumns: `repeat(${colunas}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${linhas}, minmax(0, 1fr))`,
              }}
              initial="fora"
              animate="dentro"
              variants={{ dentro: { transition: { staggerChildren: 0.04, delayChildren: 0.1 } } }}
            >
              {bichos.map((b) => {
                const ok = animaisColetados.includes(b.id);
                const falando = lendo === b.id;
                return (
                  <motion.div
                    key={b.id}
                    className="min-h-0"
                    variants={{
                      fora: { opacity: 0, y: 14, scale: 0.9 },
                      dentro: { opacity: 1, y: 0, scale: 1, transition: MOLA_ENTRADA },
                    }}
                  >
                    <motion.button
                      type="button"
                      onClick={() => tocar(b, ok)}
                      whileHover={{ y: -3, rotate: ok ? -1.5 : 0 }}
                      whileTap={{ scale: 0.94 }}
                      animate={balancando === b.id ? BALANCO : falando ? { scale: 1.05 } : { x: 0, scale: 1 }}
                      transition={balancando === b.id ? { duration: 0.4 } : MOLA_TOQUE}
                      className={`flex size-full min-h-12 flex-col items-center justify-center gap-0.5 rounded-md p-1.5 ring-amarelo transition-[box-shadow] duration-300 ${
                        ok
                          ? "bg-branco shadow-[0_4px_0_var(--t-chao)] hover:shadow-[0_6px_0_var(--t-chao)]"
                          : "border-[3px] border-dashed border-branco/80 bg-branco/30"
                      } ${falando ? "ring-4" : "ring-0"}`}
                      aria-label={ok ? b.nome : "Figurinha ainda não conquistada"}
                    >
                      {/* espaço reservado (não pula o layout) e fade ao carregar */}
                      <span className="relative block min-h-0 w-[80%] flex-1">
                        <ImagemSuave
                          src={arteDoAnimal(b)}
                          className={ok ? "" : "brightness-0 opacity-15"}
                          placeholder={<Esqueleto className="aspect-square h-[70%] rounded-full" />}
                        />
                      </span>
                      <span
                        style={{ fontSize: fonteQueCabeEm(70, ok ? b.nome.length : 1, 0, 1) }}
                        className="max-w-full shrink-0 font-leitura font-bold whitespace-nowrap text-roxo uppercase"
                      >
                        {ok ? b.nome : "?"}
                      </span>
                    </motion.button>
                  </motion.div>
                );
              })}
            </motion.div>
          </motion.section>
        </AnimatePresence>
      </div>

      {/* Setas grandes + bolinhas de página */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <BotaoRedondo aria-label="Território anterior" onClick={() => irPara(atual - 1)}>
          <Arte nome="ui/voltar" className="size-7" />
        </BotaoRedondo>
        <div className="flex min-w-0 items-center justify-center gap-1" aria-label={`Página ${atual + 1} de ${TERRITORIOS.length}`}>
          {TERRITORIOS.map((tt, i) => (
            <motion.span
              key={tt.id}
              layout
              transition={MOLA_ENTRADA}
              className={`h-2 shrink-0 rounded-full transition-colors duration-300 ${i === atual ? "w-5 bg-roxo" : "w-2 bg-roxo/25"}`}
            />
          ))}
        </div>
        <BotaoRedondo aria-label="Próximo território" onClick={() => irPara(atual + 1)}>
          <Arte nome="ui/voltar" className="size-7 rotate-180" />
        </BotaoRedondo>
      </div>
    </div>
  );
}
