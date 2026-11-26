import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE_SESSAO, perfilPorId } from "@/content/perfis";
import { verificar } from "@/lib/sessao";
import { mesclar } from "@/lib/mesclar";
import type { Progress } from "@/lib/progress";

/**
 * Progresso de cada perfil no banco: a versão OFICIAL, independente do aparelho.
 * - PUT normal: o servidor junta o que veio do aparelho com o que já tinha (nada se perde) e devolve o resultado.
 * - PUT com "motivo" (correção no painel): substitui tudo e marca corrigidoEm; aparelhos que ainda não viram
 *   a correção recebem a versão corrigida em vez de juntar (senão a correção seria desfeita).
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
  const corpo = (await req.json().catch(() => ({}))) as { perfil?: string; dados?: unknown; motivo?: string; anterior?: unknown; base?: number };
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
  const agora = Date.now();
  const recebido = corpo.dados as Progress;
  const noBanco = atual?.dados as Progress | undefined;
  let corrigido = false;
  let dados: Progress;
  if (corpo.motivo) {
    dados = { ...recebido, corrigidoEm: agora, atualizadoEm: agora };
  } else if (noBanco && (noBanco.corrigidoEm ?? 0) > (corpo.base ?? 0)) {
    // este aparelho ainda não viu a correção do painel: ele recebe a versão corrigida
    dados = noBanco;
    corrigido = true;
  } else {
    dados = noBanco ? mesclar(noBanco, recebido) : recebido;
  }
  await db.progressoPerfil.upsert({
    where: { perfil: alvo },
    create: { perfil: alvo, dados: dados as object, copias: [] },
    update: { dados: dados as object, copias: copias as unknown as object[] },
  });
  return NextResponse.json({ ok: true, dados, corrigido, agora });
}
