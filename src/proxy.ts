import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, verificar } from "@/lib/sessao";

/** Sem sessão válida, toda página leva para a tela de entrada (escolha de perfil). */
export async function proxy(request: NextRequest) {
  const perfil = await verificar(request.cookies.get(COOKIE_SESSAO)?.value).catch(() => null);
  // o painel e a aprovação de vozes são só da conta Pais (crianças voltam para o mapa)
  if (perfil && (request.nextUrl.pathname.startsWith("/painel") || request.nextUrl.pathname.startsWith("/vozes")) && perfil !== "pais") {
    return NextResponse.redirect(new URL("/", request.url));
  }
  if (perfil) return NextResponse.next();
  const url = new URL("/entrar", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  // tudo, menos a própria entrada, a API de entrar e os arquivos estáticos
  matcher: ["/((?!entrar|api/entrar|_next|arte|fotos|modelos|manifest.webmanifest|favicon|.*\\.(?:svg|png|jpg|jpeg|glb|webp|ico|txt)$).*)"],
};
