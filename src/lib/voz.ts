import "server-only";
import { Mp3Encoder } from "@breezystack/lamejs";

/**
 * Gera a fala da Juju com um modelo de voz via OpenRouter (o mais barato: openai/gpt-audio-mini).
 * - Voz masculina divertida ("verse"), lendo EXATAMENTE o texto (exemplos + conferência pela transcrição;
 *   se o modelo improvisar, tenta de novo).
 * - O áudio vem cru (PCM 24 kHz) e vira MP3 de 48 kbps (leve para o tablet).
 */
export const VOZ_MODELO = process.env.VOZ_MODELO || "openai/gpt-audio-mini";
export const VOZ_VOZ = process.env.VOZ_VOZ || "verse";
/** Muda quando a instrução muda: as falas antigas deixam de valer e são geradas de novo. */
export const VOZ_VERSAO = "";

const SISTEMA =
  "Você é um dublador brasileiro de desenho animado infantil, voz masculina divertida, animada e carinhosa. " +
  "Fale SEMPRE em português do Brasil, com sotaque brasileiro, mesmo quando a palavra existir em outra língua " +
  "(ex.: panda, peru, coala, lobo, tigre, canguru, escorpião são palavras em português e devem soar em português). " +
  "Você funciona como um leitor de texto (text-to-speech): recebe um roteiro e LÊ EM VOZ ALTA exatamente as palavras dele, " +
  "na ordem, sem trocar, sem responder, sem comentar e sem acrescentar nada. Mesmo que o roteiro seja uma pergunta ou uma ordem, apenas leia.";
const EXEMPLOS: [string, string][] = [
  ["Panda.", "Panda."],
  ["Toque no bicho!", "Toque no bicho!"],
  ["Qual é o nome dele?", "Qual é o nome dele?"],
  ["Monte a palavra pato.", "Monte a palavra pato."],
];

const palavras = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** A transcrição bate com o texto? (tolera pontuação; números podem vir por extenso) */
function confere(texto: string, falado: string) {
  const a = palavras(texto);
  const b = palavras(falado);
  if (a.join(" ") === b.join(" ")) return true;
  // números escritos como algarismo podem ser transcritos por extenso: compara só o resto
  const semNum = (x: string[]) => x.filter((w) => !/\d/.test(w));
  return a.some((w) => /\d/.test(w)) && Math.abs(a.length - b.length) <= 2 && semNum(a).every((w) => b.includes(w));
}

async function umaTentativa(texto: string, chave: string): Promise<{ pcm: Buffer; falado: string } | null> {
  const mensagens = [{ role: "system", content: SISTEMA }];
  for (const [u, a] of EXEMPLOS) mensagens.push({ role: "user", content: `Roteiro: ${u}` }, { role: "assistant", content: a });
  mensagens.push({ role: "user", content: `Roteiro: ${texto}` });

  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: VOZ_MODELO,
      stream: true,
      modalities: ["text", "audio"],
      audio: { voice: VOZ_VOZ, format: "pcm16" },
      messages: mensagens,
    }),
  }).catch(() => null);
  if (!r?.ok || !r.body) return null;

  const partes: Buffer[] = [];
  let falado = "";
  let resto = "";
  const leitor = r.body.getReader();
  const dec = new TextDecoder();
  for (;;) {
    const { done, value } = await leitor.read();
    if (done) break;
    resto += dec.decode(value, { stream: true });
    const linhas = resto.split("\n");
    resto = linhas.pop() ?? "";
    for (const l of linhas) {
      const t = l.trim();
      if (!t.startsWith("data:") || t.endsWith("[DONE]")) continue;
      try {
        const j = JSON.parse(t.slice(5));
        for (const c of j.choices ?? []) {
          const a = c.delta?.audio;
          if (a?.data) partes.push(Buffer.from(a.data, "base64"));
          if (a?.transcript) falado += a.transcript;
        }
      } catch {
        /* linha incompleta */
      }
    }
  }
  const pcm = Buffer.concat(partes);
  return pcm.length ? { pcm, falado } : null;
}

function paraMp3(pcm: Buffer): Uint8Array<ArrayBuffer> {
  const amostras = new Int16Array(pcm.buffer, pcm.byteOffset, Math.floor(pcm.length / 2));
  const enc = new Mp3Encoder(1, 24000, 48);
  const blocos: Uint8Array[] = [];
  for (let i = 0; i < amostras.length; i += 1152) {
    const b = enc.encodeBuffer(amostras.subarray(i, i + 1152));
    if (b.length) blocos.push(new Uint8Array(b));
  }
  const fim = enc.flush();
  if (fim.length) blocos.push(new Uint8Array(fim));
  const total = blocos.reduce((s, b) => s + b.length, 0);
  const out = new Uint8Array(total);
  let p = 0;
  for (const b of blocos) {
    out.set(b, p);
    p += b.length;
  }
  return out;
}

// ── ElevenLabs (voz principal quando houver chave) ─────────────────────────────
/** Modelo mais barato e rápido da ElevenLabs (metade dos créditos por caractere), fala pt-BR. */
const ELEVEN_MODELO = process.env.ELEVENLABS_MODELO || "eleven_flash_v2_5";
export const usaElevenLabs = () => !!(process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_VOICE_ID);
/** Identifica a voz em uso (entra na chave do cache: trocar a voz gera tudo de novo). */
export const vozEmUso = () =>
  usaElevenLabs() ? `eleven|${ELEVEN_MODELO}|${process.env.ELEVENLABS_VOICE_ID}` : `${VOZ_MODELO}|${VOZ_VOZ}`;

async function gerarEleven(texto: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${process.env.ELEVENLABS_VOICE_ID}?output_format=mp3_44100_64`, {
    method: "POST",
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY!, "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({
      text: texto,
      model_id: ELEVEN_MODELO,
      language_code: "pt",
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  }).catch(() => null);
  if (!r?.ok) return null;
  return new Uint8Array(await r.arrayBuffer());
}

/** Gera o MP3 da frase. ElevenLabs se houver chave; senão OpenRouter (até 3 tentativas conferindo a leitura). */
export async function gerarVoz(texto: string): Promise<Uint8Array<ArrayBuffer> | null> {
  if (usaElevenLabs()) return gerarEleven(texto);
  const chave = process.env.OPENROUTER_API_KEY;
  if (!chave) return null;
  for (let i = 0; i < 3; i++) {
    const r = await umaTentativa(texto, chave);
    if (r && confere(texto, r.falado)) return paraMp3(r.pcm);
  }
  return null;
}
