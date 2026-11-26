// Testa a conexão com o banco: npx tsx scripts/db-ping.mts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL_POOLED ?? process.env.DATABASE_URL! }),
});
console.log("Conectado. Jogadores no banco:", await db.jogador.count());
await db.$disconnect();
