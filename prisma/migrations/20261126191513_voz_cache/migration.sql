-- CreateTable
CREATE TABLE "VozCache" (
    "chave" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "audio" BYTEA NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VozCache_pkey" PRIMARY KEY ("chave")
);
