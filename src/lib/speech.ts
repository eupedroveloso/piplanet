"use client";

import { settingsStore } from "./settings";

/**
 * VOZ DA JUJU
 * 1º: voz natural da ElevenLabs (/api/voz — cada frase é gerada uma vez e reaproveitada).
 * Se não der (sem internet, sem crédito, não configurada): voz do próprio navegador (Web Speech).
 * `speak` devolve uma Promise que termina quando a fala acaba (os jogos esperam por ela).
 */

let atual: HTMLAudioElement | null = null;
let encerrarAtual: (() => void) | null = null;
/** Depois de uma falha da voz natural, usa a do navegador por um tempo (evita esperar a cada fala). */
let semVozNaturalAte = 0;

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

function falarNavegador(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = "pt-BR";
    u.rate = rate;
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

function falarNatural(text: string, rate: number): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio(`/api/voz?t=${encodeURIComponent(text.replace(/\s+/g, " ").trim().toLowerCase())}`);
    audio.preservesPitch = true;
    audio.playbackRate = Math.min(1.3, Math.max(0.6, rate));
    atual = audio;
    let feito = false;
    const fim = (ok: boolean) => {
      if (feito) return;
      feito = true;
      clearTimeout(limite);
      if (atual === audio) {
        atual = null;
        encerrarAtual = null;
      }
      resolve(ok);
    };
    encerrarAtual = () => {
      audio.pause();
      fim(true);
    };
    // a voz natural pode levar alguns segundos na PRIMEIRA vez de uma frase (ela é gerada e guardada):
    // espera por ela; só desiste (e usa a voz do navegador) se passar muito tempo
    const limite = setTimeout(() => {
      if (audio.currentTime === 0) {
        audio.pause();
        fim(false);
      }
    }, 15000);
    audio.onended = () => fim(true);
    audio.onerror = () => fim(false);
    audio.play().catch(() => fim(false));
  });
}

export async function speak(text: string, opts: { rate?: number } = {}): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;
  const { voz, velocidadeVoz } = settingsStore.read();
  if (!voz) return;
  stopSpeaking();
  const rate = opts.rate ?? velocidadeVoz;

  if (Date.now() > semVozNaturalAte) {
    const ok = await falarNatural(text, rate);
    if (ok) return;
    semVozNaturalAte = Date.now() + 30_000;
  }
  await falarNavegador(text, rate);
}

export function stopSpeaking() {
  if (typeof window === "undefined") return;
  encerrarAtual?.();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}
