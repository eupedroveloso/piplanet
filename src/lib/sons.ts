"use client";

/**
 * Efeitos sonoros curtos, sintetizados na hora (Web Audio): sem arquivo para baixar e sem esperar a fila da voz.
 * Suaves de propósito (autismo): nada estridente, volume baixo.
 */
let ctx: AudioContext | null = null;

function contexto() {
  if (typeof window === "undefined") return null;
  ctx ??= new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function nota(c: AudioContext, freq: number, inicio: number, dur: number, volume: number) {
  const osc = c.createOscillator();
  const ganho = c.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, inicio);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.85, inicio + dur);
  ganho.gain.setValueAtTime(0.0001, inicio);
  ganho.gain.exponentialRampToValueAtTime(volume, inicio + 0.02);
  ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + dur);
  osc.connect(ganho).connect(c.destination);
  osc.start(inicio);
  osc.stop(inicio + dur + 0.02);
}

/** "Ô-ôu": duas notas graves descendo. Toca quando a criança toca na peça errada. */
export function somDeErro() {
  const c = contexto();
  if (!c) return;
  const t = c.currentTime;
  nota(c, 330, t, 0.16, 0.18);
  nota(c, 220, t + 0.15, 0.26, 0.18);
}
