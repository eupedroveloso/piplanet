"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { arteDoAnimal, type Animal } from "@/content/animais";
import { FOTOS } from "@/content/fotos";
import { curiosidadesDe, falarSobre } from "@/lib/falar-bicho";
import { speak } from "@/lib/speech";
import { Arte, BotaoRedondo, Esqueleto, ImagemSuave, fonteQueCabe, fonteQueCabeEm, MOLA_ENTRADA, MOLA_TOQUE } from "@/components/ui";

/**
 * FICHA DO BICHO (abre ao tocar numa figurinha do álbum)
 * Foto real grande + ilustração + nome em sílabas. A Juju fala o nome e uma curiosidade;
 * a lâmpada fala a próxima curiosidade. Crédito da foto embaixo (licença livre).
 */
export function FichaBicho({ animal, onFechar }: { animal: Animal | null; onFechar: () => void }) {
  const [vez, setVez] = useState(0);
  const foto = animal ? FOTOS[animal.id] : undefined;

  useEffect(() => {
    if (animal) falarSobre(animal);
  }, [animal]);

  const total = animal ? curiosidadesDe(animal).length : 0;

  return (
    <AnimatePresence>
      {animal && (
        <motion.div
          key={animal.id}
          className="fixed inset-0 z-50 flex items-center justify-center bg-tinta/40 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onFechar}
        >
          <motion.div
            initial={{ scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            transition={MOLA_ENTRADA}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[calc(100dvh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-branco shadow-[0_12px_0_rgb(61_53_81/0.15)] sm:flex-row"
          >
            {/* Foto real */}
            <div className="relative aspect-[4/3] max-h-[40dvh] w-full shrink overflow-hidden bg-roxo-claro sm:aspect-auto sm:max-h-none sm:min-h-80 sm:w-1/2">
              {foto ? (
                <>
                  {/* espaço já reservado (aspect 4/3): esqueleto suave com a ilustração até a foto chegar, depois fade */}
                  <ImagemSuave
                    src={foto.arquivo}
                    ajuste="object-cover"
                    className="absolute inset-0 scale-110 opacity-60 blur-xl"
                    placeholder={<span className="size-full bg-roxo-claro" />}
                  />
                  <ImagemSuave
                    src={foto.arquivo}
                    alt={`Foto de ${animal.nome}`}
                    className="absolute inset-0"
                    placeholder={
                      <span className="grid size-full place-items-center">
                        <Esqueleto className="absolute inset-0 rounded-none" />
                        <Arte src={arteDoAnimal(animal)} className="relative size-28 opacity-60" />
                      </span>
                    }
                  />
                </>
              ) : (
                <div className="grid size-full place-items-center">
                  <Arte src={arteDoAnimal(animal)} className="size-40" />
                </div>
              )}
              <span className="absolute bottom-2 left-2 rounded-full bg-branco/90 p-1.5 shadow-suave">
                <Arte src={arteDoAnimal(animal)} className="size-12" />
              </span>
            </div>

            {/* Nome, voz e curiosidades */}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center sm:gap-4 sm:p-6">
              {/* Cabe numa linha: no celular pela largura da tela; no tablet pela metade do cartão */}
              <motion.button
                type="button"
                onClick={() => speak(animal.nome)}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.94 }}
                transition={MOLA_TOQUE}
                style={{
                  fontSize: `min(${fonteQueCabe(animal.silabas.join("").length, animal.silabas.length - 1, 96, 3)}, ${fonteQueCabeEm(
                    280,
                    animal.silabas.join("").length,
                    animal.silabas.length - 1,
                    3,
                  )})`,
                }}
                className="max-w-full font-leitura leading-tight font-bold whitespace-nowrap text-roxo uppercase"
              >
                {animal.silabas.join("·")}
              </motion.button>
              <div className="flex gap-3">
                <BotaoRedondo aria-label="Ouvir o nome" onClick={() => speak(animal.nome)} className="size-16">
                  <Arte nome="ui/som-ligado" className="size-9" />
                </BotaoRedondo>
                <BotaoRedondo
                  aria-label="Ouvir outra curiosidade"
                  onClick={() => {
                    setVez((v) => v + 1);
                    falarSobre(animal, { comNome: false });
                  }}
                  className="size-16 ring-4 ring-amarelo"
                >
                  <motion.span key={vez} initial={{ rotate: -20, scale: 0.6 }} animate={{ rotate: 0, scale: 1 }} transition={MOLA_ENTRADA}>
                    <Arte nome="ui/lampada" className="size-9" />
                  </motion.span>
                </BotaoRedondo>
              </div>
              {/* bolinhas: quantas curiosidades existem */}
              <div className="flex gap-1.5" aria-hidden>
                {Array.from({ length: total }, (_, i) => (
                  <span key={i} className={`size-2.5 rounded-full ${i === vez % total ? "bg-amarelo" : "bg-linha"}`} />
                ))}
              </div>
              {foto && (
                // crédito em texto, sem link: uma criança não pode sair do app por aqui (fonte em public/fotos/CREDITOS.md)
                <p className="mt-2 text-[10px] leading-tight text-tinta-suave">
                  Foto: {foto.autor} · {foto.licenca} · Wikimedia Commons
                </p>
              )}
            </div>

            <BotaoRedondo aria-label="Fechar" onClick={onFechar} className="absolute top-3 right-3">
              <span className="text-2xl font-extrabold text-roxo">×</span>
            </BotaoRedondo>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
