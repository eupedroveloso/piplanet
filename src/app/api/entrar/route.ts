import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { COOKIE_PERFIL, COOKIE_SESSAO, perfilPorId } from "@/content/perfis";
import { assinar } from "@/lib/sessao";

const UM_ANO = 60 * 60 * 24 * 365;

function senhaCerta(digitada: string, certa: string | undefined) {
  if (!certa) return false;
  const a = Buffer.from(digitada);
  const b = Buffer.from(certa);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Entrar num perfil. Pietro não precisa de senha; Pedro e Gabi sim (SENHA_PEDRO / SENHA_GABI no .env). */
export async function POST(req: Request) {
  const { perfil, senha } = (await req.json().catch(() => ({}))) as { perfil?: string; senha?: string };
  const p = perfilPorId(perfil);
  if (!p) return NextResponse.json({ ok: false, erro: "perfil" }, { status: 400 });
  if (p.temSenha) {
    // Senha padrão 0001 (proteção simples); SENHA_PEDRO / SENHA_GABI no ambiente têm prioridade.
    const certa = process.env[`SENHA_${p.id.toUpperCase()}`] || "0001";
    if (!senhaCerta(String(senha ?? ""), certa)) return NextResponse.json({ ok: false, erro: "senha" }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true, perfil: p.id });
  const seguro = process.env.NODE_ENV === "production";
  res.cookies.set(COOKIE_SESSAO, await assinar(p.id), { httpOnly: true, sameSite: "lax", secure: seguro, path: "/", maxAge: UM_ANO });
  // cópia legível pelo navegador, só para separar o progresso de cada perfil
  res.cookies.set(COOKIE_PERFIL, p.id, { httpOnly: false, sameSite: "lax", secure: seguro, path: "/", maxAge: UM_ANO });
  return res;
}

/** Sair / trocar de perfil. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_SESSAO);
  res.cookies.delete(COOKIE_PERFIL);
  return res;
}
