"use client";

import { useEffect } from "react";
import { speak } from "@/lib/speech";
import { Arte, Botao } from "@/components/ui";

/** Se algo der errado numa tela: a Juju pede para tentar de novo (sem mensagem técnica para a criança). */
export default function Erro({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    const t = setTimeout(() => speak("Ops! Toque no botão para tentar de novo."), 400);
    return () => clearTimeout(t);
  }, [error]);

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-6 px-6" style={{ background: "linear-gradient(180deg, #a9c1ff 0%, #cdd8ff 45%, #f1e8ff 100%)" }}>
      <Arte nome="animais/coruja" className="size-28 animate-flutuar" />
      <Botao cor="amarelo" tamanho="lg" aria-label="Tentar de novo" onClick={() => reset()} icone={<Arte nome="ui/play" className="size-8" />}>
        ↻
      </Botao>
      <button type="button" onClick={() => window.location.assign("/")} className="text-sm font-bold text-tinta-suave">
        voltar ao início
      </button>
    </div>
  );
}
