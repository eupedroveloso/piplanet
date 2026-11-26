"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/**
 * Avisa quando a cena 3D está COMPLETA para a tela de carregamento sumir sem pedaços surgindo depois:
 * montado junto com o último conteúdo que suspende (pacote de modelos), compila todos os shaders
 * (compileAsync: sem engasgo no primeiro quadro) e espera dois quadros desenhados.
 */
export function AvisarPronto({ onPronto }: { onPronto?: () => void }) {
  const gl = useThree((s) => s.gl);
  const cena = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const etapa = useRef<"compilando" | "desenhando" | "feito">("compilando");
  const quadros = useRef(0);
  const aviso = useRef(onPronto);
  useEffect(() => {
    aviso.current = onPronto;
  }, [onPronto]);

  useEffect(() => {
    let vivo = true;
    etapa.current = "compilando";
    quadros.current = 0;
    // trava de 4 s: se a compilação assíncrona não responder (driver/aparelho), segue assim mesmo
    const limite = new Promise((r) => setTimeout(r, 4000));
    Promise.race([gl.compileAsync(cena, camera).catch(() => undefined), limite]).then(() => {
      if (vivo) etapa.current = "desenhando";
    });
    return () => {
      vivo = false;
    };
  }, [gl, cena, camera]);

  useFrame(() => {
    if (etapa.current !== "desenhando") return;
    quadros.current += 1;
    if (quadros.current >= 2) {
      etapa.current = "feito";
      aviso.current?.();
    }
  });
  return null;
}
