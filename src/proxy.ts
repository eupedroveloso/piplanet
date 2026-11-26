import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_SESSAO, verificar } from "@/lib/sessao";

/** Sem sessão válida, toda página leva para a tela de entrada (escolha de perfil). */
export async function proxy(request: NextRequest) {
  const perfil = await verificar(request.cookies.get(COOKIE_SESSAO)?.value).catch(() => null);
  if (perfil) return NextResponse.next();
  const url = new URL("/entrar", request.url);
  return NextResponse.redirect(url);
}

export const config = {
  // tudo, menos a própria entrada, a API de entrar e os arquivos estáticos
  matcher: ["/((?!entrar|api/entrar|_next|arte|fotos|modelos|manifest.webmanifest|favicon|.*\\.(?:svg|png|jpg|jpeg|glb|webp|ico|txt)$).*)"],
};
