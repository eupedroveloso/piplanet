/** Mostra quantas falas da voz atual estão no banco, por status, e as suspeitas. Uso: set -a; . ./.env; set +a; npx tsx scripts/status-vozes.mts */
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL! }) });
const grupos = await db.vozCache.groupBy({ by: ["modelo", "status"], _count: { _all: true }, where: { modelo: { contains: "eleven" } } });
console.log(grupos.map((g) => `${g.modelo} ${g.status}: ${g._count._all}`).join("\n"));
const susp = await db.vozCache.findMany({ where: { modelo: { contains: "eleven" }, status: { in: ["suspeita", "pendente"] } }, select: { texto: true, transcricao: true, status: true }, take: 40 });
console.log(susp.map((s) => `${s.status}: "${s.texto}" → ouvido "${s.transcricao}"`).join("\n"));
await db.$disconnect();
