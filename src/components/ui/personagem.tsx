"use client";

import { useEffect, useState } from "react";
import { usePerfil } from "@/lib/perfil";
import { Arte } from "./Arte";

export type Personagem = "pietro" | "perola";

/** Descobre (uma vez por sessão) se um arquivo de arte já existe. */
const cache = new Map<string, Promise<boolean>>();
export function existeArte(src: string) {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!cache.has(src)) {
    cache.set(
      src,
      new Promise((ok) => {
        const img = new Image();
        img.onload = () => ok(true);
        img.onerror = () => ok(false);
        img.src = src;
      }),
    );
  }
  return cache.get(src)!;
}

/**
 * Personagem explorador do perfil atual (Pietro ou Pérola). A conta Pais usa o Pietro.
 * Enquanto a arte de um personagem não existir, usa a do Pietro (troca sozinha quando a arte chegar).
 */
export function usePersonagem(forcar?: Personagem): Personagem {
  const perfil = usePerfil();
  const desejado: Personagem = forcar ?? perfil.personagem ?? "pietro";
  const [pronto, setPronto] = useState<Personagem>("pietro");
  useEffect(() => {
    if (desejado === "pietro") return;
    let vivo = true;
    existeArte(`/arte/mascote/${desejado}.svg`).then((ok) => vivo && ok && setPronto(desejado));
    return () => {
      vivo = false;
    };
  }, [desejado]);
  return desejado === "pietro" ? "pietro" : pronto;
}

/** Arte do mascote do perfil atual: `sufixo` "" (parado), "-rosto", "-lendo", "-feliz"... */
export function ArteMascote({ sufixo = "", personagem, className, alt = "" }: { sufixo?: string; personagem?: Personagem; className?: string; alt?: string }) {
  const p = usePersonagem(personagem);
  return <Arte nome={`mascote/${p}${sufixo}`} alt={alt} className={className} />;
}
