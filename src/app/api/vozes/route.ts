import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/content/perfis";
import { verificar } from "@/lib/sessao";
import { chaveDaVoz, gerarVoz, ouvidoConfere, ouvir, VOZ_MODELO, VOZ_VOZ } from "@/lib/voz";
import LISTA from "@/content/falas-lista.json";

/**
 * CONTROLE DE QUALIDADE DOS ÁUDIOS (só a conta Pais)
 * GET  /api/vozes?status=suspeita|pendente|aprovada|ruim|todas&q=texto → lista (sem o áudio)
 * POST /api/vozes { chave | texto, acao: "aprovar" | "refazer" | "ruim" | "conferir" }
 *   conferir: OUVE o áudio guardado (modelo ouvinte); se não bater com o texto, refaz. Sem áudio, gera.
 *   refazer: gera de novo (modelo maior primeiro) e substitui o áudio guardado.
 */
export const maxDuration = 60;

async function soPais() {
  const jar = await cookies();
  return (await verificar(jar.get(COOKIE_SESSAO)?.value).catch(() => null)) === "pais";
}

async function banco() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_POOLED) return null;
  return (await import("@/lib/db")).db;
}

export async function GET(req: Request) {
  if (!(await soPais())) return NextResponse.json({ erro: "proibido" }, { status: 403 });
  const db = await banco();
  if (!db) return NextResponse.json({ erro: "sem banco" }, { status: 503 });
  const u = new URL(req.url);
  // ?lista=1 → todas as falas do jogo com a situação na voz atual (página /vozes)
  if (u.searchParams.get("lista")) {
    const chaves = LISTA.map((f) => chaveDaVoz(f.texto));
    const linhas = await db.vozCache.findMany({ where: { chave: { in: chaves } }, select: { chave: true, status: true } });
    const st = new Map(linhas.map((l) => [l.chave, l.status]));
    return NextResponse.json({
      voz: { modelo: VOZ_MODELO, voz: VOZ_VOZ },
      falas: LISTA.map((f, i) => ({ ...f, status: st.get(chaves[i]) ?? "nova" })),
    });
  }
  const status = u.searchParams.get("status") ?? "suspeita";
  const q = (u.searchParams.get("q") ?? "").toLowerCase().trim();
  const where = {
    ...(status !== "todas" ? { status } : {}),
    ...(q ? { texto: { contains: q } } : {}),
  };
  const [itens, contagem] = await Promise.all([
    db.vozCache.findMany({
      where,
      select: { chave: true, texto: true, transcricao: true, modelo: true, duracaoMs: true, status: true },
      orderBy: { texto: "asc" },
      take: 300,
    }),
    db.vozCache.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return NextResponse.json({ itens, contagem: Object.fromEntries(contagem.map((c) => [c.status, c._count._all])) });
}

export async function POST(req: Request) {
  if (!(await soPais())) return NextResponse.json({ erro: "proibido" }, { status: 403 });
  const db = await banco();
  if (!db) return NextResponse.json({ erro: "sem banco" }, { status: 503 });
  const corpo = (await req.json().catch(() => ({}))) as { chave?: string; texto?: string; acao?: string };
  const acao = corpo.acao;
  const textoNorm = corpo.texto?.replace(/\s+/g, " ").trim().toLowerCase();
  const chave = corpo.chave ?? (textoNorm ? chaveDaVoz(textoNorm) : undefined);
  const achado = chave ? await db.vozCache.findUnique({ where: { chave }, select: { texto: true } }) : null;
  const item = achado ?? (textoNorm && (acao === "refazer" || acao === "conferir") ? { texto: textoNorm } : null);
  if (!item || !chave) return NextResponse.json({ erro: "não achei" }, { status: 404 });
  if (acao === "aprovar" || acao === "ruim") {
    await db.vozCache.update({ where: { chave }, data: { status: acao === "aprovar" ? "aprovada" : "ruim" } });
    return NextResponse.json({ ok: true });
  }
  if (acao === "conferir" && achado) {
    const guardado = await db.vozCache.findUnique({ where: { chave }, select: { audio: true, status: true } });
    if (guardado?.status === "aprovada" || guardado?.status === "conferida") return NextResponse.json({ ok: true, status: guardado.status });
    const ouvido = guardado ? await ouvir(guardado.audio) : null;
    if (ouvido !== null && ouvidoConfere(item.texto, ouvido)) {
      await db.vozCache.update({ where: { chave }, data: { status: "conferida", transcricao: ouvido } });
      return NextResponse.json({ ok: true, status: "conferida" });
    }
    if (ouvido === null) return NextResponse.json({ ok: false, erro: "não consegui ouvir" }, { status: 503 });
    // não bateu: cai no refazer abaixo
  }
  if (acao === "refazer" || acao === "conferir") {
    // força o modelo maior primeiro: usa o texto como "curto" não funciona para frases, então tenta até 5 vezes
    const v = await gerarVoz(item.texto);
    if (!v) return NextResponse.json({ erro: "não consegui gerar" }, { status: 503 });
    const data = { audio: v.audio, transcricao: v.transcricao, modelo: v.modelo, duracaoMs: v.duracaoMs, status: v.suspeita ? "suspeita" : v.ouvido ? "conferida" : "pendente" };
    await db.vozCache.upsert({ where: { chave }, create: { chave, texto: item.texto, ...data }, update: data });
    return NextResponse.json({ ok: true, modelo: v.modelo, duracaoMs: v.duracaoMs });
  }
  return NextResponse.json({ erro: "ação inválida" }, { status: 400 });
}
