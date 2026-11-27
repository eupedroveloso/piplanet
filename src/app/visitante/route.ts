import { NextResponse } from "next/server";
import { COOKIE_PERFIL, COOKIE_SESSAO } from "@/content/perfis";
import { assinar } from "@/lib/sessao";

/**
 * Entrada do VISITANTE: só por este link (não aparece na tela de entrada).
 * Entra direto como visitante e vai para o mapa. O progresso dele fica só no aparelho.
 */
export async function GET() {
  // redirecionamento relativo: vale para qualquer endereço (localhost, rede, produção)
  const res = new NextResponse(null, { status: 307, headers: { Location: "/" } });
  const seguro = process.env.NODE_ENV === "production";
  const dias30 = 60 * 60 * 24 * 30;
  res.cookies.set(COOKIE_SESSAO, await assinar("visitante"), { httpOnly: true, sameSite: "lax", secure: seguro, path: "/", maxAge: dias30 });
  res.cookies.set(COOKIE_PERFIL, "visitante", { httpOnly: false, sameSite: "lax", secure: seguro, path: "/", maxAge: dias30 });
  return res;
}
