"use client";

import { usePerfil } from "@/lib/perfil";
import { liberadas } from "@/lib/progress";

import { motion, useReducedMotion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import { arteDoAnimal, type Animal, type TerritorioId } from "@/content/animais";
import { animaisDaFase, animaisDoTerritorio, chaveFase, faseDesbloqueada, JOGOS, nivelQueComeca, TERRITORIOS } from "@/content/jornada";
import { infoNivel } from "@/content/niveis";
import type { Progress } from "@/lib/progress";
import { speak } from "@/lib/speech";
import { ArteMascote, BALANCO, CLASSE_ETIQUETA, MOLA_ENTRADA } from "@/components/ui";
import { ExploradorAndando, ExploradorParado } from "./ExploradorNoMapa";
import type { Ilha } from "./ilha";

/**
 * ETIQUETAS SOBRE O 3D
 * Placas, fases da trilha e a Juju no balão são HTML normal (nítido e com micro-interação),
 * posicionados a cada quadro projetando o ponto 3D na tela.
 */

/** Move os elementos [data-ancora] do `host` para a posição projetada de cada âncora 3D. */
export function useProjecao(
  host: RefObject<HTMLDivElement | null>,
  camRef: RefObject<THREE.Camera | null>,
  ancoras: Map<string, THREE.Vector3>,
  dinamicas?: (chave: string, alvo: THREE.Vector3) => boolean,
  /** Esconde âncoras que ficam atrás de algo (ex.: o outro lado do globo). */
  visivel?: (alvo: THREE.Vector3, cam: THREE.Camera) => boolean,
) {
  useEffect(() => {
    let raf = 0;
    const v = new THREE.Vector3();
    const tmp = new THREE.Vector3();
    const laco = () => {
      const cam = camRef.current;
      const h = host.current;
      if (cam && h) {
        const w = h.clientWidth;
        const hh = h.clientHeight;
        for (const el of h.querySelectorAll<HTMLElement>("[data-ancora]")) {
          const chave = el.dataset.ancora!;
          let alvo = ancoras.get(chave);
          if (dinamicas?.(chave, tmp)) alvo = tmp;
          if (!alvo) continue;
          v.copy(alvo).project(cam);
          let px = ((v.x + 1) / 2) * w;
          // Etiquetas largas (placas) não saem pela borda no celular: ficam inteiras, com 8 px de folga
          if (el.dataset.prender !== undefined) {
            const meia = el.offsetWidth / 2 + 8;
            px = Math.min(Math.max(px, meia), w - meia);
          }
          el.style.transform = `translate3d(${px}px, ${((1 - v.y) / 2) * hh}px, 0) translate(-50%, -50%)`;
          const ve = v.z < 1 && (!visivel || visivel(alvo, cam));
          el.style.visibility = ve ? "visible" : "hidden";
          el.style.opacity = ve ? "1" : "0";
        }
      }
      raf = requestAnimationFrame(laco);
    };
    laco();
    return () => cancelAnimationFrame(raf);
  }, [host, camRef, ancoras, dinamicas, visivel]);
}

export function Rotulos({
  ilha,
  camRef,
  balaoRef,
  foco,
  hover,
  progresso,
  liberados,
  onFocar,
  caminhada,
}: {
  ilha: Ilha;
  camRef: RefObject<THREE.Camera | null>;
  balaoRef: RefObject<THREE.Group | null>;
  foco: TerritorioId | null;
  hover: TerritorioId | null;
  progresso: Progress;
  liberados: Record<TerritorioId, boolean>;
  onFocar: (t: TerritorioId) => void;
  /** Caminho sendo trilhado (Cinzel): a mãozinha viaja na ponta e o nó novo acende no fim. */
  caminhada?: { andando: boolean; esperando?: boolean; acender: string | null; cabeca: RefObject<THREE.Vector3 | null> };
}) {
  const reduzir = useReducedMotion();
  const host = useRef<HTMLDivElement>(null);
  const jogaveis = ilha.biomas.filter((b) => b.jogavel);
  const ancoras = useMemo(
    () =>
      new Map<string, THREE.Vector3>([
        ...ilha.biomas.filter((b) => b.jogavel).map((b) => [`placa-${b.id}`, ilha.centro(b.id).add(new THREE.Vector3(0, 2.6, 0))] as const),
        ...ilha.fases.map((f) => [`${f.territorio}-${f.fase}`, f.pos.clone().add(new THREE.Vector3(0, 0.25, 0))] as const),
      ]),
    [ilha],
  );
  const cabeca = caminhada?.cabeca;
  const dinamicas = useMemo(
    () => (chave: string, alvo: THREE.Vector3) => {
      if (chave === "caminho") {
        if (!cabeca?.current) return false;
        alvo.copy(cabeca.current);
        alvo.y += 0.25;
        return true;
      }
      if (chave !== "juju" || !balaoRef.current) return false;
      balaoRef.current.getWorldPosition(alvo);
      alvo.y -= 1.5;
      return true;
    },
    [balaoRef, cabeca],
  );
  useProjecao(host, camRef, ancoras, dinamicas);

  const atual = faseAtual(progresso);
  const andando = !!caminhada?.andando;
  const esperando = !!caminhada?.esperando;

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Juju no cestinho do balão */}
      <div data-ancora="juju" className="absolute top-0 left-0">
        <ArteMascote sufixo="-rosto" className="size-10 select-none" />
      </div>

      {!foco &&
        jogaveis.map((b) => (
          <div key={`placa-${b.id}`} data-ancora={`placa-${b.id}`} data-prender className="pointer-events-auto absolute top-0 left-0">
            <Placa id={b.id} liberada={!!liberados[b.id]} progresso={progresso} destaque={hover === b.id} onTocar={() => onFocar(b.id)} />
          </div>
        ))}

      {/* O explorador anda na ponta do caminho que se desenha (com movimento reduzido: só aparece no nó novo) */}
      {/* Antes de começar, ele espera parado no nó antigo */}
      {foco && (esperando || (andando && !reduzir)) && (
        <div data-ancora="caminho" className="absolute top-0 left-0">
          <ExploradorAndando parado={esperando} />
        </div>
      )}

      {foco &&
        ilha.fases
          .filter((f) => f.territorio === foco)
          .map(({ fase: f }) => (
            <div key={`${foco}-${f}`} data-ancora={`${foco}-${f}`} className="pointer-events-auto absolute top-0 left-0">
              {/* Primeira fase de um nível novo: marco "Nível N" ao lado do nó (botão próprio, com voz) */}
              {(() => {
                const n = nivelQueComeca(chaveFase(foco, f));
                return n ? <MarcoNivel n={n} livre={faseDesbloqueada(progresso.fases, foco, f)} /> : null;
              })()}
              <NoFase
                territorio={foco}
                fase={f}
                progresso={progresso}
                atual={!andando && !esperando && atual?.t === foco && atual.i === f}
                chegou={caminhada?.acender === `${foco}-${f}`}
                marco={!!nivelQueComeca(chaveFase(foco, f))}
              />
            </div>
          ))}
    </div>
  );
}

function faseAtual(p: Progress) {
  for (const t of TERRITORIOS)
    for (let i = 0; i < t.fases.length; i++)
      if (!(chaveFase(t.id, i) in p.fases) && faseDesbloqueada(liberadas(p), t.id, i)) return { t: t.id, i };
  return null;
}

function Placa({
  id,
  liberada,
  progresso,
  destaque,
  onTocar,
}: {
  id: TerritorioId;
  liberada: boolean;
  progresso: Progress;
  destaque: boolean;
  onTocar: () => void;
}) {
  const t = TERRITORIOS.find((x) => x.id === id)!;
  const feitas = t.fases.filter((_, i) => chaveFase(id, i) in progresso.fases).length;
  const completo = feitas === t.fases.length;
  const capa = animaisDoTerritorio(id)[0];
  return (
    <motion.button
      type="button"
      onClick={() => {
        speak(liberada ? t.nome : `${t.nome}. Ainda trancado. Termine as fases de antes para abrir.`);
        onTocar();
      }}
      initial={{ opacity: 0, y: 12, scale: 0.8 }}
      animate={{ opacity: 1, y: destaque ? -6 : 0, scale: destaque ? 1.08 : 1 }}
      whileHover={{ y: -4, scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      transition={MOLA_ENTRADA}
      className={`${CLASSE_ETIQUETA} bg-branco ${destaque ? "outline-2 outline-amarelo" : ""}`}
    >
      {/* Ícone primeiro: um bicho do bioma (ou o cadeado), para quem ainda não lê */}
      <span className="relative grid size-8 place-items-center rounded-full bg-roxo-claro">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={capa ? arteDoAnimal(capa) : "/arte/ui/cadeado.svg"} alt="" className={`size-6 ${liberada ? "" : "opacity-40 grayscale"}`} />
        {!liberada && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/arte/ui/cadeado.svg" alt="" className="absolute -right-1 -bottom-1 size-4" />
        )}
      </span>
      <span className={`text-sm font-extrabold tracking-[0.08em] uppercase ${liberada ? "text-roxo" : "text-tinta"}`}>{t.nome}</span>
      {liberada && (
        <span className="flex h-6 items-center gap-1 rounded-full bg-amarelo-claro px-2 text-xs font-bold text-tinta">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={completo ? "/arte/ui/medalha.svg" : "/arte/ui/estrela.svg"} alt="" className="size-4" />
          {feitas}/{t.fases.length}
        </span>
      )}
    </motion.button>
  );
}

/** Um bicho diferente de capa para cada fase do bioma (sem repetir enquanto houver bichos). */
const capasCache = new Map<string, (Animal | undefined)[]>();
function capasDoTerritorio(id: TerritorioId) {
  const pronto = capasCache.get(id);
  if (pronto) return pronto;
  const t = TERRITORIOS.find((x) => x.id === id)!;
  const usados = new Set<string>();
  const capas = t.fases.map((f) => {
    const pool = animaisDaFase(t, f);
    const escolhido = pool.find((a) => !usados.has(a.id)) ?? pool[usados.size % Math.max(1, pool.length)];
    if (escolhido) usados.add(escolhido.id);
    return escolhido;
  });
  capasCache.set(id, capas);
  return capas;
}

/**
 * MARCO DE NÍVEL no mapa: selo com o ícone do nível e o número grande, ao lado da primeira fase do nível.
 * Trancado fica apagado. Tocar fala o que é o nível (para quem não sabe ler).
 */
function MarcoNivel({ n, livre }: { n: number; livre: boolean }) {
  const { genero } = usePerfil();
  const info = infoNivel(n, genero);
  return (
    <motion.button
      type="button"
      aria-label={`Nível ${n}: ${info.nome}`}
      onClick={() => speak(livre ? info.fala : `${info.fala} Ainda trancado.`)}
      initial={{ opacity: 0, x: 8, scale: 0.7 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      whileHover={{ y: -2, scale: 1.06 }}
      whileTap={{ scale: 0.9 }}
      transition={MOLA_ENTRADA}
      className={`absolute top-1/2 right-full mr-2 flex h-10 -translate-y-1/2 items-center gap-1 rounded-full py-1 pr-2.5 pl-1 whitespace-nowrap shadow-flutuante before:absolute before:-inset-1 before:content-[''] ${
        livre ? "bg-roxo text-branco" : "bg-branco text-tinta-suave grayscale"
      }`}
    >
      <span className={`grid size-8 place-items-center rounded-full ${livre ? "bg-branco" : "bg-roxo-claro"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/arte/${info.icone}.svg`} alt="" className={`size-6 ${livre ? "" : "opacity-50"}`} draggable={false} />
      </span>
      <span className="flex flex-col items-center leading-none">
        <span className="text-[9px] font-extrabold tracking-[0.12em] uppercase opacity-80">Nível</span>
        <span className="text-xl font-extrabold">{n}</span>
      </span>
    </motion.button>
  );
}

function NoFase({
  territorio,
  fase,
  progresso,
  atual,
  chegou = false,
  marco = false,
}: {
  territorio: TerritorioId;
  fase: number;
  progresso: Progress;
  atual: boolean;
  /** O caminho acabou de chegar aqui: pulso extra de "acendeu" e o explorador dá um pulinho. */
  chegou?: boolean;
  /** Primeira fase de um nível novo: a chegada tem um brilho extra. */
  marco?: boolean;
}) {
  const reduzir = useReducedMotion();
  const acendeu = chegou && !reduzir;
  const router = useRouter();
  const [balanca, setBalanca] = useState(false);
  const t = TERRITORIOS.find((x) => x.id === territorio)!;
  const f = t.fases[fase];
  const chave = chaveFase(territorio, fase);
  const resultado = progresso.fases[chave];
  const livre = faseDesbloqueada(liberadas(progresso), territorio, fase);
  const capa = capasDoTerritorio(territorio)[fase];

  return (
    <motion.button
      type="button"
      aria-label={`${f.titulo}, ${JOGOS[f.jogo].nome}${livre ? "" : " (trancada)"}`}
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={balanca ? { ...BALANCO, opacity: 1, scale: 1 } : { opacity: 1, scale: 1, y: atual ? [0, -6, 0] : 0 }}
      transition={
        balanca
          ? { duration: 0.4 }
          : atual
            ? { y: { duration: 1.4, repeat: Infinity, ease: "easeInOut" }, default: { ...MOLA_ENTRADA, delay: fase * 0.04 } }
            : { ...MOLA_ENTRADA, delay: fase * 0.04 }
      }
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.88 }}
      onClick={() => {
        if (!livre) {
          setBalanca(true);
          setTimeout(() => setBalanca(false), 420);
          speak("Essa fase ainda está trancada.");
          return;
        }
        speak(JOGOS[f.jogo].nome);
        setTimeout(() => router.push(`/jogar/${territorio}/${fase}`), 160);
      }}
      className="relative flex flex-col items-center"
      style={{ transformOrigin: "bottom center" }}
    >
      {/* o explorador espera ao lado da próxima fase (não depende de leitura) */}
      {atual && <ExploradorParado chegou={chegou} />}
      {atual && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 size-14 -translate-x-1/2 rounded-full ring-4 ring-amarelo"
          animate={{ scale: [1, 1.45], opacity: [0.9, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      {acendeu && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-1/2 size-14 -translate-x-1/2 rounded-full bg-amarelo/40 ring-4 ring-amarelo"
          initial={{ scale: 1, opacity: 0.9 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      )}
      {/* nível novo: brilho extra (anel maior + estrelinhas saindo do nó) */}
      {acendeu && marco && (
        <>
          <motion.span
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-1/2 size-14 -translate-x-1/2 rounded-full ring-[6px] ring-amarelo-claro"
            initial={{ scale: 1, opacity: 1 }}
            animate={{ scale: 2.6, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          />
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const a = (k / 6) * Math.PI * 2 - Math.PI / 2;
            return (
              <motion.img
                key={k}
                src="/arte/ui/estrela.svg"
                alt=""
                aria-hidden
                className="pointer-events-none absolute bottom-5 left-1/2 -ml-2.5 size-5"
                initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }}
                animate={{ x: Math.cos(a) * 52, y: Math.sin(a) * 52, scale: 1, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.05 * k }}
              />
            );
          })}
        </>
      )}
      <span
        className={`relative grid size-14 place-items-center rounded-full border-[3px] shadow-flutuante ${!livre ? "opacity-60" : ""} ${
          resultado ? "border-coral bg-branco" : atual ? "border-amarelo bg-branco" : livre ? "border-roxo bg-branco" : "border-bloqueado bg-[#efedf5]"
        }`}
      >
        {livre && capa ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={arteDoAnimal(capa)} alt="" className="size-10" draggable={false} />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src="/arte/ui/cadeado.svg" alt="" className="size-7 opacity-70" draggable={false} />
        )}
        <span className="absolute -bottom-1 -left-1 grid size-6 place-items-center rounded-full bg-roxo text-xs font-extrabold text-branco">
          {fase + 1}
        </span>
        {livre && (
          <span className="absolute -top-1 -left-2 grid size-6 place-items-center rounded-full bg-branco shadow-suave">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/arte/${JOGOS[f.jogo].icone}.svg`} alt="" className="size-4" />
          </span>
        )}
        {resultado && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...MOLA_ENTRADA, delay: 0.2 + fase * 0.04 }}
            className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-coral text-xs font-extrabold text-branco"
          >
            ✓
          </motion.span>
        )}
      </span>
      {resultado && (
        <span className="mt-0.5 flex">
          {[1, 2, 3].map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src="/arte/ui/estrela.svg" alt="" className={`size-4 ${i > resultado.estrelas ? "opacity-20 grayscale" : ""}`} />
          ))}
        </span>
      )}
    </motion.button>
  );
}
