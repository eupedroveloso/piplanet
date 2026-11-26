-- CreateTable
CREATE TABLE "ProgressoPerfil" (
    "perfil" TEXT NOT NULL,
    "dados" JSONB NOT NULL,
    "copias" JSONB NOT NULL DEFAULT '[]',
    "atualizadoEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgressoPerfil_pkey" PRIMARY KEY ("perfil")
);
