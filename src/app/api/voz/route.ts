import { createHash } from "node:crypto";
import { chaveDaVoz, gerarVoz } from "@/lib/voz";

/**
 * VOZ DA JUJU
 * GET /api/voz?t=<texto> → MP3. Cada frase é gerada UMA vez (sempre pelo OpenRouter)
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

  const chave = chaveDaVoz(texto);
  const temBanco = !!(process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL);
  const db = temBanco ? (await import("@/lib/db")).db : null;

  const guardado = await db?.vozCache.findUnique({ where: { chave } }).catch(() => null);
  if (guardado) return mp3(guardado.audio);

  const v = await gerarVoz(texto);
  if (!v) {
    // Ainda sem a voz atual (ex.: sem crédito): para FRASES, usa o áudio já gerado na voz anterior (ElevenLabs Will).
    // Sílabas e letras soltas NÃO usam a voz anterior (ela é em inglês e lia "to" como "two").
    if (db && /\s/.test(texto)) {
      const antiga = await db.vozCache
        .findUnique({ where: { chave: createHash("sha256").update(`elevenlabs/eleven-flash-v2.5|will|tts1|${texto}`).digest("hex") }, select: { audio: true } })
        .catch(() => null);
      if (antiga) {
        return new Response(antiga.audio as BodyInit, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });
      }
    }
    return new Response("voz indisponível", { status: 503 });
  }
  const qc = { transcricao: v.transcricao, modelo: v.modelo, duracaoMs: v.duracaoMs, status: v.suspeita ? "suspeita" : v.ouvido ? "conferida" : "pendente" };
  await db?.vozCache.upsert({ where: { chave }, create: { chave, texto, audio: v.audio, ...qc }, update: {} }).catch(() => null);
  return mp3(v.audio);
}
