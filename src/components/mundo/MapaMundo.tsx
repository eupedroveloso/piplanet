"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import { chaveFase, faseDesbloqueada, paisDesbloqueado, TERRITORIOS, territorioDesbloqueado } from "@/content/jornada";
import { PAISES, type PaisId } from "@/content/paises";
import { useProgress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { settingsStore, useSettings } from "@/lib/settings";
import { Arte, BotaoRedondo, MOLA_ENTRADA, TelaCarregando } from "@/components/ui";
import { useProgress as useCarga } from "@react-three/drei";
import { criarIlha, type Ilha } from "./ilha";
import { Rotulos } from "./Rotulos";

/** O 3D só roda no navegador (a tela de carregamento cobre enquanto baixa). */
const Cena = dynamic(() => import("./Cena"), { ssr: false });
const Planeta = dynamic(() => import("./Planeta").then((m) => m.Planeta), { ssr: false });

/**
 * MAPA EM TRÊS NÍVEIS (tela cheia, 3D)
 *   Planeta → país (ilha com a silhueta real) → bioma de perto (trilha e fases).
 */
export function MapaMundo() {
  const router = useRouter();
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
  // A ilha é gerada DEPOIS que a tela de carregamento aparece (não trava a tela no tablet)
  const [ilhaGerada, setIlhaGerada] = useState<Ilha | null>(null);
  const ilha = pais && ilhaGerada?.pais === pais ? ilhaGerada : null;
  useEffect(() => {
    if (!pais) return;
    const t = setTimeout(() => setIlhaGerada(criarIlha(pais)), 60);
    return () => clearTimeout(t);
  }, [pais]);

  // Tela de carregamento: some só quando o 3D baixou, a ilha existe e o primeiro quadro foi desenhado
  const chaveCena = nivel === "planeta" ? "planeta" : `pais-${pais}`;
  const [prontoEm, setProntoEm] = useState<string | null>(null);
  const carregando = prontoEm !== chaveCena;
  const carga = useCarga();
  useEffect(() => {
    if (!carregando) return;
    const inicio = performance.now();
    let raf = 0;
    const checar = () => {
      const canvas = document.querySelector("canvas");
      const pronto =
        !!canvas && !carga.active && (nivel === "planeta" || !!ilha) && performance.now() - inicio > 700;
      if (pronto || performance.now() - inicio > 9000) {
        // espera mais dois quadros para o primeiro desenho aparecer
        raf = requestAnimationFrame(() => (raf = requestAnimationFrame(() => setProntoEm(chaveCena))));
        return;
      }
      raf = requestAnimationFrame(checar);
    };
    raf = requestAnimationFrame(checar);
    return () => cancelAnimationFrame(raf);
  }, [carregando, chaveCena, carga.active, nivel, ilha]);
  const progressoCarga = nivel === "pais" && !ilha ? 0.35 : carga.active ? 0.35 + (carga.progress / 100) * 0.55 : 0.95;

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
        {nivel === "planeta" ? (
          <motion.div key="planeta" className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <Planeta liberados={paisesLivres} atual={atual.pais} progresso={progresso} alvo={voandoPara} onEscolher={entrarNoPais} />
          </motion.div>
        ) : !ilha ? null : (
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
              className="pointer-events-none absolute top-[calc(max(env(safe-area-inset-top),1rem)+6rem)] left-1/2 lg:top-[calc(max(env(safe-area-inset-top),1rem)+0.5rem)] flex h-10 -translate-x-1/2 items-center rounded-full px-5 text-base font-extrabold tracking-[0.12em] text-roxo uppercase vidro"
            >
              {nomePais}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTINUAR DAQUI: atalho grande para a próxima fase (não depende de leitura) */}
      {!carregando && (
        <ContinuarDaqui
          onIr={() => {
            const i = atual.fases.findIndex((_, k) => !(chaveFase(atual.id, k) in progresso.fases));
            speak("Vamos continuar!");
            setTimeout(() => router.push(`/jogar/${atual.id}/${Math.max(0, i)}`), 250);
          }}
        />
      )}

      {/* Carregando: cobre tudo até a cena estar pronta de verdade */}
      <AnimatePresence>
        {carregando && <TelaCarregando key="carregando" progresso={progressoCarga} fundo={nivel === "planeta" ? "escuro" : "claro"} />}
      </AnimatePresence>

      {/* Controles */}
      {/* No tablet ficam na mesma linha do rodapé; no celular, logo acima dele */}
      <div className="absolute right-[max(env(safe-area-inset-right),1rem)] bottom-[calc(max(env(safe-area-inset-bottom),0.75rem)+4.25rem)] z-10 flex flex-col gap-2 sm:bottom-[max(env(safe-area-inset-bottom),0.75rem)]">
        {nivel === "pais" && (
          <>
            <BotaoRedondo aria-label="Ver o planeta" onClick={voltarAoPlaneta}>
              <Arte nome="ui/mapa" className="size-7" />
            </BotaoRedondo>
            <BotaoRedondo aria-label={foco ? "Ver o país todo" : "Chegar mais perto"} onClick={() => setFoco(foco ? null : biomaAtualDoPais)}>
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={foco ? "ilha" : "perto"}
                  initial={{ scale: 0.4, rotate: -30, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0, transition: { duration: 0.1 } }}
                  transition={MOLA_ENTRADA}
                  className="grid place-items-center"
                >
                  <Arte nome={foco ? "ui/ilha" : "ui/lupa"} className="size-7" />
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
          <Arte nome="animais/coruja" className="size-7" />
        </BotaoRedondo>
      </div>
    </div>
  );
}

/** Botão grande e pulsante com a Juju e o ▶: leva direto para a próxima fase. */
function ContinuarDaqui({ onIr }: { onIr: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label="Continuar daqui"
      onClick={onIr}
      initial={{ opacity: 0, y: 30, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: [1, 1.06, 1] }}
      transition={{ opacity: MOLA_ENTRADA, y: MOLA_ENTRADA, scale: { duration: 1.6, repeat: Infinity, ease: "easeInOut" } }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.9 }}
      className="absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amarelo py-2 pr-6 pl-2 shadow-[0_6px_0_var(--color-amarelo-escuro)] ring-4 ring-branco/70"
    >
      <span className="grid size-12 place-items-center rounded-full bg-branco">
        <Arte nome="animais/coruja" className="size-10" />
      </span>
      <Arte nome="ui/play" className="size-10" />
    </motion.button>
  );
}
