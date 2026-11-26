"use client";

import { settingsStore } from "./settings";

/**
 * Voz em português usando a Web Speech API do próprio navegador (grátis, sem servidor).
 * A qualidade varia por aparelho. No iPad/iPhone e no Chrome costuma ser boa.
 * Futuro: trocar por áudios gravados (ver docs/METODOLOGIA.md, seção "Áudio").
 */

function pickVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const ptBR = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === "pt-br");
  return (
    ptBR.find((v) => /luciana|google|francisca|thalita/i.test(v.name)) ??
    ptBR[0] ??
    voices.find((v) => v.lang.toLowerCase().startsWith("pt")) ??
    null
  );
}

export function speak(text: string, opts: { rate?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return resolve();
    const { voz, velocidadeVoz } = settingsStore.read();
    if (!voz) return resolve();

    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = "pt-BR";
    u.rate = opts.rate ?? velocidadeVoz;
    const voice = pickVoice();
    if (voice) u.voice = voice;
    // Alguns aparelhos nunca disparam onend: o tempo limite evita que o jogo trave.
    let feito = false;
    const terminar = () => {
      if (feito) return;
      feito = true;
      clearTimeout(limite);
      resolve();
    };
    const limite = setTimeout(terminar, 1500 + text.length * 110);
    u.onend = terminar;
    u.onerror = terminar;
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}
