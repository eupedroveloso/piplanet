"use client";

import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { usePreCarregar } from "@/lib/precarregar";

/**
 * PEÇAS DE CARREGAMENTO (nunca mostrar conteúdo pela metade)
 * - `ImagemSuave`: reserva o espaço (o pai define o tamanho), mostra um placeholder calmo e entra com fade.
 * - `Esqueleto`: bloco cinza-lavanda com pulso lento (sem piscar) no lugar de cartões que ainda não chegaram.
 * - `Espera`: indicador pequeno para botões de ação assíncrona (o botão fica desabilitado enquanto espera).
 * - `useImagensProntas`: espera um conjunto de imagens carregar antes de mostrar a tela.
 * Com "reduzir movimento": sem pulso nem giro (só aparece).
 */

/** Pulso lento e previsível (2,4 s), sem piscar. */
export function Esqueleto({ className = "" }: { className?: string }) {
  const reduzir = useReducedMotion();
  return (
    <motion.div
      aria-hidden
      animate={reduzir ? { opacity: 0.7 } : { opacity: [0.55, 0.9, 0.55] }}
      transition={reduzir ? { duration: 0 } : { duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      className={`rounded-2xl bg-linha/70 ${className}`}
    />
  );
}

/** Indicador de espera para botões (anel fino girando). Use dentro do botão, no lugar do ícone. */
export function Espera({ className = "size-5" }: { className?: string }) {
  const reduzir = useReducedMotion();
  return (
    <motion.span
      role="status"
      aria-label="Aguarde"
      animate={reduzir ? undefined : { rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
      className={`inline-block shrink-0 rounded-full border-[3px] border-current border-t-transparent opacity-80 ${className}`}
    />
  );
}

/**
 * Imagem com espaço reservado: ocupa 100% do pai (que define o tamanho/proporção), mostra o placeholder
 * até carregar e então entra com fade. Se a imagem falhar, fica o placeholder (nada quebrado na tela).
 */
export function ImagemSuave({
  src,
  alt = "",
  className = "",
  ajuste = "object-contain",
  placeholder,
}: {
  src: string;
  alt?: string;
  className?: string;
  ajuste?: "object-contain" | "object-cover";
  placeholder?: ReactNode;
}) {
  const [pronta, setPronta] = useState(false);
  const [ultimo, setUltimo] = useState(src);
  // trocou a imagem: volta ao placeholder até a nova carregar
  if (ultimo !== src) {
    setUltimo(src);
    setPronta(false);
  }
  return (
    <span className={`relative block size-full ${className}`}>
      {!pronta && <span className="absolute inset-0 grid place-items-center">{placeholder ?? <Esqueleto className="size-full" />}</span>}
      <motion.img
        key={src}
        src={src}
        alt={alt}
        draggable={false}
        decoding="async"
        onLoad={() => setPronta(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: pronta ? 1 : 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`absolute inset-0 size-full ${ajuste}`}
      />
    </span>
  );
}

/**
 * true quando todas as imagens da lista já carregaram (ou falharam, ou passaram 4 s).
 * Usa o mecanismo único de pré-carregamento do app (src/lib/precarregar.ts): mesmo cache por sessão.
 */
export function useImagensProntas(srcs: string[]) {
  return usePreCarregar(srcs);
}
