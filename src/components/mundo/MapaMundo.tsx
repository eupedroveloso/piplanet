"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { chaveFase, faseDesbloqueada, paisDesbloqueado, TERRITORIOS, territorioDesbloqueado } from "@/content/jornada";
import { PAISES, type PaisId } from "@/content/paises";
import { useProgress } from "@/lib/progress";
import { settingsStore, useSettings } from "@/lib/settings";
import { Arte, BotaoRedondo, MOLA_ENTRADA } from "@/components/ui";
import { criarIlha } from "./ilha";
import { Rotulos } from "./Rotulos";

/** O 3D só roda no navegador. */
const carregando = () => (
  <div className="grid h-full place-items-center">
    <Arte nome="animais/coruja" className="size-20 animate-flutuar" />
  </div>
);
const Cena = dynamic(() => import("./Cena"), { ssr: false, loading: carregando });
const Planeta = dynamic(() => import("./Planeta").then((m) => m.Planeta), { ssr: false, loading: carregando });

/**
 * MAPA EM TRÊS NÍVEIS (tela cheia, 3D)
 *   Planeta → país (ilha com a silhueta real) → bioma de perto (trilha e fases).
 */
export function MapaMundo() {
  const progresso = useProgress();
  const { ultimoPais } = useSettings();
  const [paisAberto, setPaisAberto] = useState<PaisId | null>(null);
  const [voandoPara, setVoandoPara] = useState<PaisId | null>(null);
  const [foco, setFoco] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const camRef = useRef<THREE.Camera | null>(null);
  const balaoRef = useRef<THREE.Group | null>(null);

  const liberados = useMemo(
    () => Object.fromEntries(TERRITORIOS.map((t) => [t.id, territorioDesbloqueado(progresso.fases, t.id)])) as Record<string, boolean>,
    [progresso.fases],
  );
  const paisesLivres = useMemo(
    () => Object.fromEntries(PAISES.map((p) => [p.id, paisDesbloqueado(progresso.fases, p.id)])) as Record<PaisId, boolean>,
    [progresso.fases],
  );
  const atual = useMemo(() => {
    for (const t of TERRITORIOS)
      for (let i = 0; i < t.fases.length; i++)
        if (!(chaveFase(t.id, i) in progresso.fases) && faseDesbloqueada(progresso.fases, t.id, i)) return t;
    return TERRITORIOS[TERRITORIOS.length - 1];
  }, [progresso.fases]);

  // Volta direto para o último país visitado (ex.: ao sair de um jogo)
  const pais = paisAberto ?? (ultimoPais as PaisId | null);
  const nivel: "planeta" | "pais" = pais ? "pais" : "planeta";
  const ilha = useMemo(() => (pais ? criarIlha(pais) : null), [pais]);

  function entrarNoPais(p: PaisId) {
    setVoandoPara(p);
    setTimeout(() => {
      settingsStore.write((s) => ({ ...s, ultimoPais: p }));
      setPaisAberto(p);
      setVoandoPara(null);
      setFoco(null);
      const alvo = atual.pais === p ? atual.id : TERRITORIOS.find((t) => t.pais === p)?.id ?? null;
      setTimeout(() => setFoco(alvo), 1200);
    }, 900);
  }

  function voltarAoPlaneta() {
    settingsStore.write((s) => ({ ...s, ultimoPais: null }));
    setPaisAberto(null);
    setFoco(null);
  }

  // Ao abrir direto num país (voltando de um jogo), aproxima no bioma atual
  useEffect(() => {
    if (!ultimoPais) return;
    const t = setTimeout(() => setFoco((f) => f ?? (atual.pais === ultimoPais ? atual.id : null)), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const biomaAtualDoPais = ilha ? (atual.pais === ilha.pais ? atual.id : ilha.biomas.find((b) => b.jogavel)!.id) : null;
  const nomePais = pais ? PAISES.find((p) => p.id === pais)!.nome : "";

  return (
    <div
      className="absolute inset-0 transition-[background] duration-700"
      style={{
        background:
          nivel === "planeta"
            ? "radial-gradient(ellipse at 50% 40%, #1f2160 0%, #0e0f33 55%, #05061a 100%)"
            : "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)",
      }}
    >
      <AnimatePresence mode="wait">
        {nivel === "planeta" || !ilha ? (
          <motion.div key="planeta" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Planeta liberados={paisesLivres} atual={atual.pais} progresso={progresso} alvo={voandoPara} onEscolher={entrarNoPais} />
          </motion.div>
        ) : (
          <motion.div key={`pais-${ilha.pais}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <Cena
              ilha={ilha}
              progresso={progresso}
              liberados={liberados}
              foco={foco}
              onFocar={setFoco}
              hover={hover}
              onHover={setHover}
              camRef={camRef}
              balaoRef={balaoRef}
            />
            <Rotulos ilha={ilha} camRef={camRef} balaoRef={balaoRef} foco={foco} hover={hover} progresso={progresso} liberados={liberados} onFocar={setFoco} />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: 0.3 }}
              className="pointer-events-none absolute top-28 left-1/2 -translate-x-1/2 rounded-full bg-branco/90 px-5 py-1.5 text-xl font-extrabold tracking-wide text-roxo uppercase shadow-suave"
            >
              {nomePais}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controles */}
      <div className="absolute right-4 bottom-28 z-10 flex flex-col gap-3">
        {nivel === "pais" && (
          <>
            <BotaoRedondo aria-label="Ver o planeta" onClick={voltarAoPlaneta}>
              <Arte nome="ui/mapa" className="size-8" />
            </BotaoRedondo>
            <BotaoRedondo aria-label={foco ? "Ver o país todo" : "Aproximar"} onClick={() => setFoco(foco ? null : biomaAtualDoPais)}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={foco ? "ilha" : "perto"}
                  initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.1 } }}
                  transition={MOLA_ENTRADA}
                  className="grid place-items-center"
                >
                  {foco ? <Arte nome="ui/ilha" className="size-8" /> : <span className="text-3xl font-extrabold text-roxo">+</span>}
                </motion.span>
              </AnimatePresence>
            </BotaoRedondo>
          </>
        )}
        <BotaoRedondo
          aria-label="Onde estou"
          onClick={() => {
            if (nivel === "planeta" || pais !== atual.pais) entrarNoPais(atual.pais);
            else setFoco(atual.id);
          }}
        >
          <Arte nome="animais/coruja" className="size-8" />
        </BotaoRedondo>
      </div>
    </div>
  );
}
