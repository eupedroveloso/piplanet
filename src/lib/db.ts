import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * Cliente do banco (Prisma Postgres). Só pode ser usado no servidor.
 * Em runtime usa a conexão com pool, que é a indicada para a Vercel (serverless).
 */
function criarCliente() {
  const connectionString = process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL não configurada (.env)");
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

const globalParaPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalParaPrisma.prisma ?? criarCliente();

if (process.env.NODE_ENV !== "production") globalParaPrisma.prisma = db;
