import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESSAO, perfilPorId } from "@/content/perfis";
import { verificar } from "@/lib/sessao";

/**
 * Progresso de cada perfil no banco (sincroniza aparelhos e alimenta o painel dos adultos).
 * - Cada perfil lê e grava o próprio.
 * - Pedro e Gabi (adultos) também leem e corrigem o do Pietro.
 * Sem DATABASE_URL no ambiente, responde 503 e o app segue só com o que está no aparelho.
 */
const ADULTOS = new Set(["pedro", "gabi"]);
const MAX_COPIAS = 30;
const DIA = 24 * 60 * 60 * 1000;

interface Copia {
  data: number;
  motivo: string;
  dados: unknown;
}

async function quem() {
  const jar = await cookies();
  return verificar(jar.get(COOKIE_SESSAO)?.value).catch(() => null);
}

function pode(eu: string | null, alvo: string) {
  return !!eu && !!perfilPorId(alvo) && (eu === alvo || ADULTOS.has(eu));
}

async function banco() {
  if (!process.env.DATABASE_URL && !process.env.DATABASE_URL_POOLED) return null;
  return (await import("@/lib/db")).db;
}

export async function GET(req: Request) {
  const alvo = new URL(req.url).searchParams.get("perfil") ?? "";
  if (!pode(await quem(), alvo)) return NextResponse.json({ erro: "proibido" }, { status: 403 });
  const db = await banco();
  if (!db) return NextResponse.json({ semBanco: true }, { status: 503 });
  const linha = await db.progressoPerfil.findUnique({ where: { perfil: alvo } });
  return NextResponse.json({ dados: linha?.dados ?? null, copias: linha?.copias ?? [] });
}

export async function PUT(req: Request) {
  const corpo = (await req.json().catch(() => ({}))) as { perfil?: string; dados?: unknown; motivo?: string; anterior?: unknown };
  const alvo = corpo.perfil ?? "";
  if (!pode(await quem(), alvo) || !corpo.dados || typeof corpo.dados !== "object") {
    return NextResponse.json({ erro: "proibido" }, { status: 403 });
  }
  const db = await banco();
  if (!db) return NextResponse.json({ semBanco: true }, { status: 503 });

  const atual = await db.progressoPerfil.findUnique({ where: { perfil: alvo } });
  let copias = (Array.isArray(atual?.copias) ? atual.copias : []) as unknown as Copia[];
  if (atual || corpo.anterior) {
    const ultima = copias[copias.length - 1]?.data ?? 0;
    // cópia antes de toda correção feita no painel, e uma automática por dia
    // "anterior": o estado que o painel estava mostrando (pode ser mais novo que o do banco)
    const antes = corpo.anterior && typeof corpo.anterior === "object" ? corpo.anterior : atual?.dados;
    if (corpo.motivo) copias = [...copias, { data: Date.now(), motivo: corpo.motivo, dados: antes }];
    else if (atual && Date.now() - ultima > DIA) copias = [...copias, { data: Date.now(), motivo: "Cópia automática do dia", dados: atual.dados }];
    copias = copias.slice(-MAX_COPIAS);
  }
  const dados = corpo.dados as object;
  await db.progressoPerfil.upsert({
    where: { perfil: alvo },
    create: { perfil: alvo, dados, copias: [] },
    update: { dados, copias: copias as unknown as object[] },
  });
  return NextResponse.json({ ok: true });
}
