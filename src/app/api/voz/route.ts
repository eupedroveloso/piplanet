import { createHash } from "node:crypto";
import { gerarVoz, VOZ_MODELO, VOZ_VERSAO, VOZ_VOZ } from "@/lib/voz";

/**
 * VOZ DA JUJU
 * GET /api/voz?t=<texto> → MP3. Cada frase é gerada UMA vez (OpenRouter, modelo de voz mais barato)
 * e guardada no banco (VozCache). Depois disso, tocar não custa nada, em nenhum aparelho.
 * Sem chave/crédito, responde 503 e o app usa a voz do navegador.
 */
export const maxDuration = 60;
const MAX = 300;

const normalizar = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase().slice(0, MAX);

function mp3(audio: Uint8Array) {
  return new Response(audio as BodyInit, {
    headers: {
      "Content-Type": "audio/mpeg",
      // a mesma frase sempre tem o mesmo áudio: o aparelho guarda e não pede de novo
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}

export async function GET(req: Request) {
  const texto = normalizar(new URL(req.url).searchParams.get("t") ?? "");
  if (!texto) return new Response("texto vazio", { status: 400 });

  const chave = createHash("sha256").update(`${VOZ_MODELO}|${VOZ_VOZ}|${VOZ_VERSAO}|${texto}`).digest("hex");
  const temBanco = !!(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL);
  const db = temBanco ? (await import("@/lib/db")).db : null;

  const guardado = await db?.vozCache.findUnique({ where: { chave } }).catch(() => null);
  if (guardado) return mp3(guardado.audio);

  const audio = await gerarVoz(texto);
  if (!audio) return new Response("voz indisponível", { status: 503 });
  await db?.vozCache.upsert({ where: { chave }, create: { chave, texto, audio }, update: {} }).catch(() => null);
  return mp3(audio);
}
