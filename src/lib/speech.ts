"use client";

import { settingsStore } from "./settings";
import vozConfig from "@/content/voz-config.json";

/**
 * MODO DA VOZ (src/content/voz-config.json → "modo"):
 * - "sistema": voz do próprio navegador (Web Speech), usada enquanto as vozes de IA são corrigidas e aprovadas;
 * - "ia": voz natural gerada pelo OpenRouter (/api/voz), conferida e aprovada na página /vozes.
 */
const MODO_SISTEMA = vozConfig.modo !== "ia";

/**
 * VOZ DA JUJU
 * 1º: voz natural gerada pelo OpenRouter (/api/voz — cada frase é gerada uma vez e reaproveitada).
 * Modo "ia": se a voz natural falhar, silêncio. Modo "sistema" (atual, temporário): voz do navegador.
 * `speak` devolve uma Promise que termina quando a fala acaba (os jogos esperam por ela).
 */

let encerrarAtual: (() => void) | null = null;

function escolherVozDoSistema(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const ptBR = voices.filter((v) => v.lang.replace("_", "-").toLowerCase() === "pt-br");
  return (
    ptBR.find((v) => /luciana|google|francisca|thalita|felipe/i.test(v.name)) ??
    ptBR[0] ??
    voices.find((v) => v.lang.toLowerCase().startsWith("pt")) ??
    null
  );
}

/** Voz do sistema (Web Speech, pt-BR). Termina quando a fala acaba, com tempo limite para não travar a fila. */
function falarSistema(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text.toLowerCase());
    u.lang = "pt-BR";
    u.rate = rate;
    const voice = escolherVozDoSistema();
    if (voice) u.voice = voice;
    let feito = false;
    const terminar = () => {
      if (feito) return;
      feito = true;
      clearTimeout(limite);
      encerrarAtual = null;
      resolve();
    };
    // alguns aparelhos nunca disparam onend: o tempo limite evita que a fila trave
    const limite = setTimeout(terminar, 1500 + text.length * 110);
    u.onend = terminar;
    u.onerror = terminar;
    encerrarAtual = () => {
      window.speechSynthesis.cancel();
      terminar();
    };
    window.speechSynthesis.speak(u);
  });
}

type Resultado = "ok" | "bloqueado" | "falhou";

/**
 * Um tocador só para o app inteiro: no iPad/iPhone, depois que ele toca uma vez a partir de um toque
 * da criança, pode tocar as próximas falas sem bloqueio (criar um <audio> novo a cada fala é bloqueado).
 */
let tocador: HTMLAudioElement | null = null;
function oTocador() {
  if (!tocador) {
    tocador = new Audio();
    tocador.preload = "auto";
    (
      tocador as HTMLAudioElement & { webkitPreservesPitch?: boolean }
    ).webkitPreservesPitch = true;
    tocador.preservesPitch = true;
  }
  return tocador;
}

/** Áudio WAV de silêncio (0,05 s) gerado na hora, para liberar o tocador dentro de um toque. */
function silencio() {
  const n = 400;
  const b = new Uint8Array(44 + n);
  const v = new DataView(b.buffer);
  const txt = (o: number, t: string) =>
    [...t].forEach((c, k) => v.setUint8(o + k, c.charCodeAt(0)));
  txt(0, "RIFF");
  v.setUint32(4, 36 + n, true);
  txt(8, "WAVE");
  txt(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true);
  v.setUint32(28, 8000, true);
  v.setUint16(32, 1, true);
  v.setUint16(34, 8, true);
  txt(36, "data");
  v.setUint32(40, n, true);
  b.fill(128, 44);
  let bin = "";
  b.forEach((x) => (bin += String.fromCharCode(x)));
  return "data:audio/wav;base64," + btoa(bin);
}

/** Fala que o navegador bloqueou (sem toque ainda): toca no primeiro toque na tela. */
let pendente: { text: string; rate: number } | null = null;
let liberado = false;
if (typeof window !== "undefined") {
  const liberar = () => {
    if (liberado) return;
    liberado = true;
    const p = pendente;
    pendente = null;
    if (p) speak(p.text, { rate: p.rate });
    else {
      // "acorda" o tocador dentro do toque (som vazio), para as próximas falas não serem bloqueadas
      const t = oTocador();
      t.src = silencio();
      t.play()
        .then(() => t.pause())
        .catch(() => {});
    }
  };
  window.addEventListener("pointerdown", liberar, {
    capture: true,
    passive: true,
  });
  window.addEventListener("keydown", liberar, { capture: true, passive: true });
}

function falarNatural(text: string, rate: number): Promise<Resultado> {
  return new Promise((resolve) => {
    const audio = oTocador();
    audio.pause();
    audio.src = `/api/voz?t=${encodeURIComponent(text.replace(/\s+/g, " ").trim().toLowerCase())}`;
    audio.playbackRate = Math.min(1.3, Math.max(0.6, rate));
    audio.defaultPlaybackRate = audio.playbackRate;
    let feito = false;
    const limpar = () => {
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
    };
    const fim = (r: Resultado) => {
      if (feito) return;
      feito = true;
      clearTimeout(limite);
      clearTimeout(teto);
      limpar();
      encerrarAtual = null;
      resolve(r);
    };
    encerrarAtual = () => {
      audio.pause();
      fim("ok");
    };
    // trava de segurança: nenhum áudio prende a fila por mais de 20 s (ex.: começou e a rede parou no meio)
    const teto = setTimeout(() => {
      if (feito) return;
      audio.pause();
      fim(audio.currentTime > 0 ? "ok" : "falhou");
    }, 20000);
    // a voz natural pode levar alguns segundos na PRIMEIRA vez de uma frase (ela é gerada e guardada)
    const limite = setTimeout(() => {
      if (audio.currentTime === 0) {
        audio.pause();
        fim("falhou");
      }
    }, 15000);
    audio.onplaying = () => {
      audio.playbackRate = Math.min(1.3, Math.max(0.6, rate));
    };
    audio.onended = () => fim("ok");
    audio.onerror = () => fim("falhou");
    audio
      .play()
      .catch((e: DOMException) =>
        fim(
          e?.name === "NotAllowedError"
            ? "bloqueado"
            : e?.name === "AbortError"
              ? "ok"
              : "falhou",
        ),
      );
  });
}

/**
 * FILA DE FALAS: cada fala espera a anterior terminar e toca INTEIRA, na ordem em que foi pedida.
 * Só uma interrupção manual (stopSpeaking: trocar de tela, passar para o próximo bicho) corta a fila.
 */
let geracao = 0;
let fila: Promise<void> = Promise.resolve();

export function speak(text: string, opts: { rate?: number } = {}): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return Promise.resolve();
  const minha = geracao;
  const vez = fila.then(() => (minha === geracao ? tocar(text, opts) : undefined));
  fila = vez.catch(() => {});
  return vez;
}

async function tocar(text: string, opts: { rate?: number }) {
  const { voz, velocidadeVoz } = settingsStore.read();
  if (!voz) return;
  // sons curtos (sílabas, letras) na velocidade natural: esticar um áudio curtíssimo distorce o som
  const curto = text.trim().length <= 12 && !/\s/.test(text.trim().replace(/-/g, ""));
  const rate = curto ? 1 : (opts.rate ?? velocidadeVoz);

  if (MODO_SISTEMA) {
    await falarSistema(text, opts.rate ?? velocidadeVoz);
    return;
  }
  const r = await falarNatural(text, rate);
  if (r === "bloqueado") {
    // o navegador ainda não deixou tocar som (falta um toque): guarda e toca no primeiro toque
    liberado = false;
    pendente = { text, rate };
  }
  // REGRA DO DONO: nunca a voz do sistema (robótica). Se a voz natural falhar, fica em silêncio.
}

function pararAudio() {
  if (typeof window === "undefined") return;
  encerrarAtual?.();
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

/** Interrupção manual: para a fala atual e descarta tudo que estava na fila. */
export function stopSpeaking() {
  if (typeof window === "undefined") return;
  geracao++;
  pendente = null;
  fila = Promise.resolve();
  pararAudio();
}

/** Fala várias frases em ordem (entram na fila juntas; um stopSpeaking() cancela as que faltam). */
export async function falarEmSequencia(frases: (string | { texto: string; rate?: number })[]) {
  await Promise.all(frases.map((f) => (typeof f === "string" ? speak(f) : speak(f.texto, { rate: f.rate }))));
}
