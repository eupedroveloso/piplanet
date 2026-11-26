import { COOKIE_SESSAO, perfilPorId, type PerfilId } from "@/content/perfis";

/**
 * Sessão simples: cookie "perfil.assinatura" com HMAC-SHA256 (Web Crypto, roda no proxy e no servidor).
 * O segredo vem de SEGREDO_SESSAO no .env.
 */
const enc = new TextEncoder();

async function chave() {
  const segredo = process.env.SEGREDO_SESSAO;
  if (!segredo) throw new Error("SEGREDO_SESSAO não configurado (.env)");
  return crypto.subtle.importKey("raw", enc.encode(segredo), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const paraHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function assinar(perfil: PerfilId) {
  const assinatura = await crypto.subtle.sign("HMAC", await chave(), enc.encode(perfil));
  return `${perfil}.${paraHex(assinatura)}`;
}

/** Devolve o perfil se o cookie for válido; senão, null. */
export async function verificar(valor: string | undefined): Promise<PerfilId | null> {
  if (!valor) return null;
  const [perfil, hex] = valor.split(".");
  if (!perfilPorId(perfil) || !hex || hex.length !== 64) return null;
  const bytes = new Uint8Array(hex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const ok = await crypto.subtle.verify("HMAC", await chave(), bytes, enc.encode(perfil));
  return ok ? (perfil as PerfilId) : null;
}

export { COOKIE_SESSAO };
