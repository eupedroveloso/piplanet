-- CreateTable
CREATE TABLE "Jogador" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Progresso" (
    "jogadorId" TEXT NOT NULL,
    "patinhas" INTEGER NOT NULL DEFAULT 0,
    "animaisColetados" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fases" JSONB NOT NULL DEFAULT '{}',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Progresso_pkey" PRIMARY KEY ("jogadorId")
);

-- AddForeignKey
ALTER TABLE "Progresso" ADD CONSTRAINT "Progresso_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "Jogador"("id") ON DELETE CASCADE ON UPDATE CASCADE;
