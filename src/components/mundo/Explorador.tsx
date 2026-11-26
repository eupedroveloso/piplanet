"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { MOLA_ENTRADA } from "@/components/ui";

/**
 * O EXPLORADOR (Pietro garoto) no mapa.
 * - Andando: ciclo de caminhada de perfil (pietro-andando-1..4.svg a ~8 fps) com sobe e desce leve,
 *   virado para o lado em que anda. Enquanto os quadros não existem, usa pietro.svg com balanço.
 * - Parado: ao lado do nó atual (no lugar da mãozinha). Ao chegar dá um pulinho (pietro-feliz.svg, se existir).
 */

const QUADROS = [1, 2, 3, 4].map((i) => `/arte/mascote/pietro-andando-${i}.svg`);
const PARADO = "/arte/mascote/pietro.svg";
const FELIZ = "/arte/mascote/pietro-feliz.svg";

/** Verifica uma vez se a arte já existe (o Nanquim entrega depois; até lá, o reserva). */
const existe = new Map<string, Promise<boolean>>();
function checar(url: string) {
  let p = existe.get(url);
  if (!p) {
    p = new Promise((ok) => {
      const img = new Image();
      img.onload = () => ok(true);
      img.onerror = () => ok(false);
      img.src = url;
    });
    existe.set(url, p);
  }
  return p;
}
function useArte(url: string) {
  const [tem, setTem] = useState(false);
  useEffect(() => {
    let vivo = true;
    checar(url).then((v) => vivo && setTem(v));
    return () => {
      vivo = false;
    };
  }, [url]);
  return tem;
}

/** Andando sobre a trilha. Fica dentro do elemento-âncora (o pai é movido pelo useProjecao). */
export function ExploradorAndando() {
  const comQuadros = useArte(QUADROS[3]);
  const [q, setQ] = useState(0);
  const corpo = useRef<HTMLDivElement>(null);

  // ~8 fps
  useEffect(() => {
    if (!comQuadros) return;
    const id = setInterval(() => setQ((x) => (x + 1) % 4), 125);
    return () => clearInterval(id);
  }, [comQuadros]);

  // Vira para o lado em que anda: compara a posição na tela entre quadros (sem estado React)
  useEffect(() => {
    let raf = 0;
    let antes: number | null = null;
    let lado = 1;
    const laco = () => {
      const el = corpo.current;
      const pai = el?.closest<HTMLElement>("[data-ancora]");
      const m = pai?.style.transform.match(/translate3d\(([-\d.]+)px/);
      if (el && m) {
        const x = Number(m[1]);
        if (antes !== null && Math.abs(x - antes) > 0.6) lado = x > antes ? 1 : -1;
        antes = x;
        el.style.transform = `scaleX(${lado})`;
      }
      raf = requestAnimationFrame(laco);
    };
    laco();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={MOLA_ENTRADA}
      // pés na trilha: o centro da âncora fica embaixo do boneco
      className="-translate-y-[26px]"
    >
      <motion.div
        // os quadros já sobem 3 px na passagem; o balanço extra é só do reserva (pietro.svg)
        animate={comQuadros ? undefined : { y: [0, -4, 0], rotate: [-7, 7, -7] }}
        transition={{ y: { duration: 0.25, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 0.5, repeat: Infinity, ease: "easeInOut" } }}
        style={{ transformOrigin: "bottom center" }}
      >
        <div ref={corpo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={comQuadros ? QUADROS[q] : PARADO} alt="" className="size-14 max-w-none drop-shadow select-none" draggable={false} />
        </div>
      </motion.div>
      {/* quadros pré-carregados (troca sem piscar) */}
      {comQuadros && (
        <div className="hidden">
          {QUADROS.map((u) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={u} src={u} alt="" />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/**
 * Parado ao lado do nó atual. `chegou` = o caminho acabou de chegar: pulinho saindo do centro do nó
 * (onde o explorador andando parou) para o lado. Num nível novo, a pose feliz (pulando, braços para cima) por um instante.
 */
export function ExploradorParado({ chegou, nivelNovo = false }: { chegou: boolean; nivelNovo?: boolean }) {
  const reduzir = useReducedMotion();
  const temFeliz = useArte(FELIZ);
  const pulo = chegou && !reduzir;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute bottom-1 left-full -ml-3"
      initial={pulo ? { x: -46, y: -22, opacity: 1 } : { opacity: 0, scale: 0.7 }}
      animate={pulo ? { x: 0, y: [-22, -40, 0], opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={pulo ? { x: { duration: 0.45, ease: "easeOut" }, y: { duration: 0.45, ease: "easeOut", times: [0, 0.45, 1] } } : MOLA_ENTRADA}
      style={{ transformOrigin: "bottom center" }}
    >
      {/* respiração leve (parado, previsível) */}
      <motion.span
        className="block"
        animate={reduzir ? undefined : { scaleY: [1, 1.035, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "bottom center" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={chegou && nivelNovo && temFeliz ? FELIZ : PARADO} alt="" className="size-14 max-w-none drop-shadow select-none" draggable={false} />
      </motion.span>
    </motion.span>
  );
}
