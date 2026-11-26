"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { speak } from "@/lib/speech";
import { Arte } from "./Arte";
import { Explorador } from "./Explorador";

/**
 * TELA DE CARREGAMENTO: o Pietro explorador caminhando numa trilha que se completa com o progresso.
 * Pegadas de bichos aparecem atrás dele, a bandeira espera no fim, bichos do acervo espiam devagar
 * pelas bordas e folhas/estrelas flutuam com calma. Sem texto obrigatório e sem piscar.
 * `progresso` de 0 a 1 (real). Sem valor, ele avança devagar até ~90% (previsível, sem vaivém).
 * Leve: só CSS/Motion (nada de 3D). Com "reduzir movimento", tudo fica parado nas posições.
 */

// Trilha em forma de onda suave, num quadro de 100 × 40 (o mesmo usado para posicionar tudo)
const X = (t: number) => 6 + t * 88;
const Y = (t: number) => 25 - 7 * Math.sin(t * Math.PI * 2);
const CAMINHO = Array.from({ length: 41 }, (_, i) => {
  const t = i / 40;
  return `${i ? "L" : "M"}${X(t).toFixed(2)},${Y(t).toFixed(2)}`;
}).join(" ");
const PEGADAS = [0.14, 0.28, 0.42, 0.56, 0.7, 0.84];

/** Bichos que espiam pelas bordas (um de cada vez em cada lado, em ritmo lento e fixo). */
const ESPIOES = [
  { nome: "animais/macaco", lado: "esquerda", topo: "18%", atraso: 0.6 },
  { nome: "animais/coelho", lado: "direita", topo: "62%", atraso: 2.2 },
  { nome: "animais/tartaruga", lado: "baixo", esquerda: "70%", atraso: 3.8 },
] as const;

const DICAS = ["Estou preparando a aventura!", "Já vou chegar na bandeira!", "Os bichos estão esperando por você!"];

export function TelaCarregando({ progresso, fundo = "claro" }: { progresso?: number; fundo?: "claro" | "escuro" }) {
  const reduzir = useReducedMotion();
  const t = useMotionValue(0);
  const [passou, setPassou] = useState(0);
  const [dica, setDica] = useState(0);

  // progresso real: anda suave até o valor; sem valor: avança devagar até 90%
  useEffect(() => {
    const alvo = progresso === undefined ? 0.9 : Math.max(0, Math.min(1, progresso));
    const c = animate(t, alvo, reduzir ? { duration: 0 } : progresso === undefined ? { duration: 8, ease: "easeOut" } : { duration: 0.6, ease: "easeOut" });
    return () => c.stop();
  }, [progresso, reduzir, t]);

  useMotionValueEvent(t, "change", (v) => setPassou(PEGADAS.filter((p) => v >= p).length));

  // o Pietro para um pouco antes da bandeira (para ela continuar visível)
  const PARADA = 0.9;
  const esquerda = useTransform(t, (v) => `${X(v * PARADA)}%`);
  const topo = useTransform(t, (v) => `${(Y(v * PARADA) / 40) * 100}%`);
  const chegou = progresso !== undefined && progresso >= 1;
  const andado = useTransform(t, (v) => Math.max(0.001, v));
  const escuro = fundo === "escuro";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.45 } }}
      role="status"
      aria-label="Carregando"
      className="absolute inset-0 z-40 overflow-hidden"
      style={{
        background: escuro
          ? "radial-gradient(ellipse at 50% 40%, #1f2160 0%, #0e0f33 55%, #05061a 100%)"
          : "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)",
      }}
    >
      {/* folhas e estrelas flutuando devagar (sem piscar) */}
      {[
        { nome: escuro ? "ui/estrela" : "ui/folhas", x: "12%", y: "20%", d: 7 },
        { nome: "ui/estrela", x: "82%", y: "16%", d: 9 },
        { nome: escuro ? "ui/estrela" : "ui/folhas", x: "86%", y: "78%", d: 8 },
        { nome: "ui/estrela", x: "18%", y: "80%", d: 10 },
      ].map((e, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute opacity-60"
          style={{ left: e.x, top: e.y }}
          animate={reduzir ? undefined : { y: [0, -10, 0], rotate: [0, 12, 0] }}
          transition={{ duration: e.d, repeat: Infinity, ease: "easeInOut" }}
        >
          <Arte nome={e.nome} className="size-7" />
        </motion.span>
      ))}

      {/* bichos espiando pelas bordas */}
      {ESPIOES.map((b) => {
        // entra devagar, fica um pouco e sai; sempre no mesmo ritmo
        const ida = b.lado === "esquerda" ? "-70%" : b.lado === "direita" ? "70%" : "70%";
        const volta = b.lado === "baixo" ? "25%" : "0%";
        const eixo = b.lado === "baixo" ? "y" : "x";
        return (
          <motion.span
            key={b.nome}
            aria-hidden
            className={`absolute ${b.lado === "esquerda" ? "-left-3" : b.lado === "direita" ? "-right-3" : "-bottom-3"}`}
            style={b.lado === "baixo" ? { left: b.esquerda } : { top: b.topo }}
            initial={{ [eixo]: reduzir ? volta : ida }}
            animate={reduzir ? { [eixo]: volta } : { [eixo]: [ida, volta, volta, ida] }}
            transition={{ duration: 6, times: [0, 0.2, 0.75, 1], repeat: Infinity, repeatDelay: 3, delay: b.atraso, ease: "easeInOut" }}
          >
            <Arte nome={b.nome} className={`size-16 sm:size-20 ${b.lado === "direita" ? "-scale-x-100" : ""}`} />
          </motion.span>
        );
      })}

      {/* a trilha */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div className="relative aspect-[5/2] w-[min(26rem,88vw)]">
          <svg viewBox="0 0 100 40" className="absolute inset-0 size-full overflow-visible" aria-hidden>
            {/* o quadro tem a mesma proporção do viewBox (5:2): espessuras em unidades do SVG, sem distorção */}
            <path d={CAMINHO} fill="none" strokeWidth="2.6" strokeLinecap="round" className={escuro ? "stroke-branco/15" : "stroke-branco/70"} />
            <path d={CAMINHO} fill="none" strokeWidth="0.9" strokeDasharray="0.6 2.8" strokeLinecap="round" className={escuro ? "stroke-branco/40" : "stroke-roxo/25"} />
            <motion.path d={CAMINHO} fill="none" strokeWidth="2.6" strokeLinecap="round" className="stroke-verde" style={{ pathLength: andado }} />
          </svg>

          {/* pegadas de bichos que vão aparecendo atrás do Pietro */}
          {PEGADAS.map((p, i) => (
            <motion.span
              key={p}
              aria-hidden
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${X(p)}%`, top: `${((Y(p) + 7) / 40) * 100}%` }}
              initial={false}
              animate={{ opacity: i < passou ? 0.85 : 0, scale: i < passou ? 1 : 0.5, rotate: i % 2 ? 20 : -20 }}
              transition={{ duration: reduzir ? 0 : 0.5, ease: "easeOut" }}
            >
              <Arte nome="ui/patinhas" className="size-5" />
            </motion.span>
          ))}

          {/* bandeira no fim */}
          <span className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${X(1)}%`, top: `${(Y(1) / 40) * 100}%` }} aria-hidden>
            <Arte nome="ui/bandeira" className="size-10" />
          </span>

          {/* o explorador (tocar fala uma dica; é opcional) */}
          <motion.button
            type="button"
            aria-label="Pietro explorador"
            onClick={() => {
              speak(DICAS[dica]);
              setDica((d) => (d + 1) % DICAS.length);
            }}
            whileTap={{ scale: 0.9 }}
            className="absolute w-max -translate-x-1/2 -translate-y-[88%]"
            style={{ left: esquerda, top: topo }}
          >
            <Explorador andando={!reduzir && !chegou} feliz={chegou} className="size-20 drop-shadow-lg sm:size-24" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
