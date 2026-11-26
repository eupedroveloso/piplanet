import "server-only";
import { createHash } from "node:crypto";

/**
 * VOZ DO JOGO — sempre pelo OpenRouter (chave OPENROUTER_API_KEY).
 * Leitura de texto de verdade (TTS) com a ElevenLabs: modelo eleven-flash-v2.5 (o mais barato) e voz "will"
 * (masculina, amigável e animada, escolhida pelo dono). Endpoint: /api/v1/audio/speech.
 * Cada áudio é CONFERIDO OUVINDO (modelo ouvinte barato): se não bater com o texto, gera de novo ou marca suspeito.
 * Nunca usar modelos de conversa (gpt-audio) para isso: eles inventam palavras e trocam sons.
 */
export const VOZ_MODELO = process.env.VOZ_TTS_MODELO || "elevenlabs/eleven-flash-v2.5";
export const VOZ_VOZ = process.env.VOZ_TTS_VOZ || "will";
/** Muda quando algo da geração muda: as falas antigas deixam de valer e são geradas de novo. */
export const VOZ_VERSAO = "tts1";

/** Modelo que OUVE o áudio gerado e transcreve (barato), para conferir se a fala saiu certa. */
const VOZ_OUVINTE = process.env.VOZ_OUVINTE || "google/gemini-2.5-flash-lite";
/** Ouvinte mais preciso, usado quando o barato devolve vazio ou lixo. */
const VOZ_OUVINTE_BOM = process.env.VOZ_OUVINTE_BOM || "google/gemini-2.5-flash";

export interface VozGerada {
  audio: Uint8Array<ArrayBuffer>;
  transcricao: string;
  modelo: string;
  duracaoMs: number;
  /** Não bateu ao ouvir (fica para revisão na tela /vozes). */
  suspeita: boolean;
  /** O áudio foi ouvido e conferido pelo modelo ouvinte. */
  ouvido: boolean;
}

/** Chave do áudio no cache (VozCache): muda se o modelo, a voz ou a versão mudarem. */
export function chaveDaVoz(texto: string) {
  return createHash("sha256").update(`${VOZ_MODELO}|${VOZ_VOZ}|${VOZ_VERSAO}|${texto}`).digest("hex");
}

async function falar(texto: string, chave: string): Promise<Uint8Array<ArrayBuffer> | null> {
  const r = await fetch("https://openrouter.ai/api/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: VOZ_MODELO, input: texto, voice: VOZ_VOZ, response_format: "mp3" }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const tipo = r.headers.get("content-type") ?? "";
  if (!tipo.includes("audio") && !tipo.includes("octet")) return null;
  return new Uint8Array(await r.arrayBuffer());
}

/** Resposta do ouvinte que não serve como transcrição (vazia, marcação de tempo, comentário). */
const lixo = (t: string) => !t.trim() || /-->|\d\d:\d\d:\d\d|^\[?(silêncio|silencio|música|musica)\]?$/i.test(t.trim());

/** Transcreve o MP3 (o que realmente foi falado). null se não conseguir ouvir. */
export async function ouvir(mp3: Uint8Array): Promise<string | null> {
  const t = await ouvirCom(VOZ_OUVINTE, mp3);
  if (t !== null && !lixo(t)) return t;
  const t2 = await ouvirCom(VOZ_OUVINTE_BOM, mp3);
  return t2 !== null && !lixo(t2) ? t2 : null;
}

async function ouvirCom(modelo: string, mp3: Uint8Array): Promise<string | null> {
  const chave = process.env.OPENROUTER_API_KEY;
  if (!chave) return null;
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: modelo,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Transcreva exatamente o que é falado neste áudio, em português do Brasil, palavra por palavra " +
                "(inclusive repetições, gaguejos e palavras erradas). Responda só com a transcrição. " +
                "Se não der para entender, responda [ININTELIGIVEL].",
            },
            { type: "input_audio", input_audio: { data: Buffer.from(mp3).toString("base64"), format: "mp3" } },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const j = await r.json().catch(() => null);
  const t = j?.choices?.[0]?.message?.content;
  return typeof t === "string" ? t.trim() : null;
}

const palavras = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

/** Distância de edição entre listas de palavras. */
function distancia(a: string[], b: string[]) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}

/**
 * O que foi OUVIDO bate com o texto?
 * - Sílaba/letra (1 palavra de até 5 letras): o ouvinte erra a grafia ("éle" → "L", "lê"), então só exige
 *   UM som, sem repetição nem lixo.
 * - Palavra solta: tem que ser igual. Frases: no máximo 1 palavra diferente a cada 8, sem palavras a mais.
 */
export function ouvidoConfere(texto: string, ouvido: string) {
  if (/ININTELIGIVEL/i.test(ouvido)) return false;
  const a = palavras(texto);
  const b = palavras(ouvido);
  if (!b.length) return false;
  if (a.length === 1) {
    if (b.length !== 1) return false;
    return a[0].length <= 5 || a[0] === b[0];
  }
  return distancia(a, b) <= Math.max(1, Math.floor(a.length / 8)) && b.length <= a.length + 1;
}

/** Duração aproximada do MP3 (48 kbps–128 kbps varia; usa o tamanho / taxa típica de 64 kbps). */
const duracaoAprox = (bytes: number) => Math.round((bytes * 8) / 64);

/** Gera a fala (ElevenLabs via OpenRouter) e confere ouvindo; até 2 tentativas. */
export async function gerarVoz(texto: string): Promise<VozGerada | null> {
  const chave = process.env.OPENROUTER_API_KEY;
  if (!chave) return null;
  let ultima: VozGerada | null = null;
  for (let i = 0; i < 2; i++) {
    const audio = await falar(texto, chave);
    if (!audio) continue;
    const ouvido = await ouvir(audio);
    const v: VozGerada = { audio, transcricao: ouvido ?? "", modelo: `${VOZ_MODELO}:${VOZ_VOZ}`, duracaoMs: duracaoAprox(audio.length), suspeita: false, ouvido: ouvido !== null };
    if (ouvido === null || ouvidoConfere(texto, ouvido)) return v;
    ultima = { ...v, suspeita: true };
  }
  return ultima;
}
