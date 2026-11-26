"use client";

import { ligarModoLeve } from "./modoLeve";
import { Component, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { speak } from "@/lib/speech";
import { Arte, ArteMascote, Botao } from "@/components/ui";

/**
 * PROTEÇÃO DA CENA 3D
 * No celular/tablet, trocar de cena (ilha ↔ planeta) pode falhar por falta de memória de vídeo
 * (o navegador "perde" o WebGL) ou por um erro no 3D. Em vez de derrubar o app inteiro:
 * - perda do WebGL → espera um instante e reconstrói a cena;
 * - erro → tenta de novo sozinho uma vez; se falhar de novo, mostra um botão grande (com voz) para tentar.
 */
class Limite extends Component<{ children: ReactNode; onErro: (e: unknown) => void }, { erro: boolean }> {
  state = { erro: false };
  static getDerivedStateFromError() {
    return { erro: true };
  }
  componentDidCatch(e: unknown) {
    console.error("[cena 3D]", e);
    this.props.onErro(e);
  }
  render() {
    return this.state.erro ? null : this.props.children;
  }
}

export function ProtecaoCena({ children }: { children: ReactNode }) {
  const [chave, setChave] = useState(0);
  const [falhas, setFalhas] = useState(0);
  const caixa = useRef<HTMLDivElement>(null);
  // Com cacheComponents o Next não desmonta a rota ao ir para /jogar: esconde com <Activity> e o Canvas
  // continuaria vivo, segurando a memória de vídeo durante o jogo (no iPhone, somava e derrubava o 3D na volta).
  // Escondida → desmonta o Canvas (o R3F faz dispose + forceContextLoss); visível de novo → contexto limpo.
  const [visivel, setVisivel] = useState(true);
  useLayoutEffect(() => {
    // padrão do guia do Next (preserving-ui-state): o layout effect liga/desliga junto com o <Activity>
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisivel(true);
    return () => setVisivel(false);
  }, []);

  // WebGL perdido (não borbulha: escuta na captura) → reconstrói a cena
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    let t: ReturnType<typeof setTimeout>;
    const perdeu = (e: Event) => {
      // canvas já desmontado (o R3F força a perda ao liberar a GPU): não é queda
      if (!(e.target as Element | null)?.isConnected) return;
      e.preventDefault();
      // caiu por falta de memória de vídeo: daqui pra frente a cena vem no modo leve
      ligarModoLeve();
      clearTimeout(t);
      t = setTimeout(() => setChave((k) => k + 1), 600);
    };
    el.addEventListener("webglcontextlost", perdeu, true);
    return () => {
      el.removeEventListener("webglcontextlost", perdeu, true);
      clearTimeout(t);
    };
  }, []);

  function aoErrar() {
    ligarModoLeve();
    setFalhas((f) => {
      if (f === 0) setTimeout(() => setChave((k) => k + 1), 400);
      return f + 1;
    });
  }

  function tentar() {
    speak("Vamos tentar de novo!");
    setFalhas(0);
    setChave((k) => k + 1);
  }

  return (
    <div ref={caixa} className="absolute inset-0">
      {falhas >= 2 ? (
        <div className="grid h-full place-items-center">
          <div className="flex flex-col items-center gap-4">
            <ArteMascote className="size-24 animate-flutuar" />
            <Botao cor="amarelo" tamanho="lg" aria-label="Tentar de novo" onClick={tentar} icone={<Arte nome="ui/play" className="size-8" />}>
              ↻
            </Botao>
          </div>
        </div>
      ) : !visivel ? null : (
        <Limite key={chave} onErro={aoErrar}>
          {children}
        </Limite>
      )}
    </div>
  );
}
