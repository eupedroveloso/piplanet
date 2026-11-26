"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { chaveFase, faseDesbloqueada, paisDesbloqueado, TERRITORIOS, territorioDesbloqueado } from "@/content/jornada";
import { PAISES, type PaisId } from "@/content/paises";
import { useProgress, liberadas } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { settingsStore, useSettings } from "@/lib/settings";
import { Arte, ArteMascote, BotaoRedondo, MOLA_ENTRADA, TelaCarregando } from "@/components/ui";
import { useProgress as useCarga } from "@react-three/drei";
import type { Ilha } from "./ilha";
import { modoLeve } from "./modoLeve";
import { gerarIlhaEmEtapas, precarregarPais } from "./precarregar";
import { Rotulos } from "./Rotulos";
import { useCaminhada } from "./caminhada";

/** O 3D só roda no navegador (a tela de carregamento cobre enquanto baixa). */
import { ProtecaoCena } from "./ProtecaoCena";
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
    () => Object.fromEntries(TERRITORIOS.map((t) => [t.id, territorioDesbloqueado(liberadas(progresso), t.id)])) as Record<string, boolean>,
    [progresso.fases, progresso.tudoLiberado],
  );
  const paisesLivres = useMemo(
    () => Object.fromEntries(PAISES.map((p) => [p.id, paisDesbloqueado(liberadas(progresso), p.id)])) as Record<PaisId, boolean>,
    [progresso.fases, progresso.tudoLiberado],
  );
  const atual = useMemo(() => {
    for (const t of TERRITORIOS)
      for (let i = 0; i < t.fases.length; i++)
        if (!(chaveFase(t.id, i) in progresso.fases) && faseDesbloqueada(liberadas(progresso), t.id, i)) return t;
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
    let vivo = true;
    // em etapas (relevo → decoração → terreno), cedendo o quadro: a tela de carregamento não congela
    gerarIlhaEmEtapas(pais, liberados).then((i) => vivo && setIlhaGerada(i));
    return () => {
      vivo = false;
    };
    // o terreno com outro "liberados" é refeito na Cena (cache por país)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pais]);

  // Tela de carregamento: some só quando a cena avisa que está COMPLETA (AvisarPronto: modelos baixados,
  // shaders compilados e dois quadros desenhados), sem pedaços surgindo depois.
  const chaveCena = nivel === "planeta" ? "planeta" : `pais-${pais}`;
  const [prontoEm, setProntoEm] = useState<string | null>(null);
  const carregando = prontoEm !== chaveCena;
  const carga = useCarga();
  const inicioCarga = useRef(0);
  useEffect(() => {
    if (!carregando) return;
    inicioCarga.current = performance.now();
    // trava: se o aviso não vier (erro na cena), não prende a criança na tela de carregamento
    const t = setTimeout(() => setProntoEm(chaveCena), 15000);
    return () => clearTimeout(t);
  }, [carregando, chaveCena]);
  const cenaPronta = (chave: string) => {
    if (chave !== chaveCena || !carregando) return;
    // medição (o Faro lê no console ou em window.__pgTempos): tempo até a cena aparecer completa
    const registro = { cena: chave, ms: Math.round(performance.now() - inicioCarga.current), leve: modoLeve() };
    const w = window as unknown as { __pgTempos?: object[] };
    (w.__pgTempos ??= []).push(registro);
    console.info("[3D] pronto", registro);
    setProntoEm(chave);
  };
  // Com cacheComponents a rota fica escondida (<Activity>) durante o jogo e o Canvas é desmontado (ProtecaoCena):
  // na volta a cena é refeita, então a tela de carregamento cobre de novo até ela avisar que está pronta.
  useLayoutEffect(() => () => setProntoEm(null), []);
  // Caminho sendo trilhado: ao voltar de uma fase concluída (ou abrir um país novo)
  const [pontaInicial] = useState(() => new THREE.Vector3());
  const cabeca = useRef<THREE.Vector3 | null>(pontaInicial);
  // começa quando a câmera foi para o bioma (ou, sem foco, 2,5 s depois de carregar: ilha inteira)
  const [esperouEm, setEsperouEm] = useState<string | null>(null);
  useEffect(() => {
    if (carregando) return;
    const t = setTimeout(() => setEsperouEm(chaveCena), 2500);
    return () => clearTimeout(t);
  }, [carregando, chaveCena]);
  const caminhada = useCaminhada(ilha, progresso, !carregando && nivel === "pais" && (foco !== null || esperouEm === chaveCena));
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

  // Pré-carrega em segundo plano (ocioso) o próximo país liberado; no planeta, o país atual
  useEffect(() => {
    if (carregando) return;
    if (nivel === "planeta") {
      precarregarPais(atual.pais, liberados);
      return;
    }
    const i = PAISES.findIndex((p) => p.id === pais);
    const depois = [...PAISES.slice(i + 1), ...PAISES.slice(0, i)];
    const prox = depois.find((p) => paisesLivres[p.id]) ?? PAISES[i + 1];
    if (prox) precarregarPais(prox.id, liberados);
  }, [carregando, nivel, pais, atual.pais, liberados, paisesLivres]);

  const biomaAtualDoPais = ilha ? (atual.pais === ilha.pais ? atual.id : ilha.biomas.find((b) => b.jogavel)!.id) : null;

  // Ao abrir direto num país (app aberto do zero ou voltando de um jogo), aproxima no bioma atual
  // assim que a cena fica pronta. Antes isso rodava só na montagem e, num carregamento do zero, o ultimoPais
  // (e o progresso) ainda não tinham sido lidos do aparelho: o mapa ficava no país inteiro.
  const [autoFocoEm, setAutoFocoEm] = useState<string | null>(null);
  useEffect(() => {
    if (carregando || nivel !== "pais" || !biomaAtualDoPais || autoFocoEm === chaveCena) return;
    const t = setTimeout(() => {
      setAutoFocoEm(chaveCena);
      setFoco((f) => f ?? biomaAtualDoPais);
    }, 600);
    return () => clearTimeout(t);
  }, [carregando, nivel, biomaAtualDoPais, autoFocoEm, chaveCena]);
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
            <ProtecaoCena>
              <Planeta
                liberados={paisesLivres}
                atual={atual.pais}
                progresso={progresso}
                alvo={voandoPara}
                onEscolher={entrarNoPais}
                onPronto={() => cenaPronta("planeta")}
              />
            </ProtecaoCena>
          </motion.div>
        ) : !ilha ? null : (
          <motion.div key={`pais-${ilha.pais}`} className="absolute inset-0" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <ProtecaoCena>
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
              caminho={caminhada.caminho}
              cabeca={cabeca}
              onPronto={() => cenaPronta(`pais-${ilha.pais}`)}
            />
            </ProtecaoCena>
            <Rotulos ilha={ilha} camRef={camRef} balaoRef={balaoRef} foco={foco} hover={hover} progresso={progresso} liberados={liberados}
              onFocar={setFoco}
              caminhada={{ andando: caminhada.andando, esperando: caminhada.esperando, acender: caminhada.acender, cabeca }}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...MOLA_ENTRADA, delay: 0.3 }}
              className="pointer-events-none absolute top-[calc(max(env(safe-area-inset-top),1rem)+4.75rem)] left-1/2 sm:top-[calc(max(env(safe-area-inset-top),1rem)+6rem)] lg:top-[calc(max(env(safe-area-inset-top),1rem)+0.5rem)] flex h-10 -translate-x-1/2 items-center rounded-full px-5 text-base font-extrabold tracking-[0.12em] text-roxo uppercase vidro"
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
          <ArteMascote sufixo="-rosto" className="size-7" />
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
        <ArteMascote sufixo="-rosto" className="size-10" />
      </span>
      <Arte nome="ui/play" className="size-10" />
    </motion.button>
  );
}
