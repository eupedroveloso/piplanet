/**
 * Reclassifica o status das falas guardadas pela transcrição que já está no banco (sem custo):
 * conferida (bate), suspeita (não bate), pendente (sem transcrição útil → conferir de novo).
 * Uso: set -a; . ./.env; set +a; npx tsx scripts/reclassificar-vozes.mts
 */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL! }) });
const palavras = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter(Boolean);
function distancia(a: string[], b: string[]) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
const lixo = (t: string) => !t.trim() || /-->|\d\d:\d\d:\d\d/.test(t);
function confere(texto: string, ouvido: string) {
  const a = palavras(texto), b = palavras(ouvido);
  if (!b.length) return false;
  if (a.length === 1) return b.length === 1 && (a[0].length <= 5 || a[0] === b[0]);
  return distancia(a, b) <= Math.max(1, Math.floor(a.length / 8)) && b.length <= a.length + 1;
}
const itens = await db.vozCache.findMany({ where: { modelo: { contains: "eleven" }, status: { notIn: ["aprovada", "ruim"] } }, select: { chave: true, texto: true, transcricao: true } });
const cont: Record<string, number> = {};
for (const i of itens) {
  const st = !i.transcricao || lixo(i.transcricao) ? "pendente" : confere(i.texto, i.transcricao) ? "conferida" : "suspeita";
  cont[st] = (cont[st] ?? 0) + 1;
  await db.vozCache.update({ where: { chave: i.chave }, data: { status: st } });
}
console.log(cont);
await db.$disconnect();
