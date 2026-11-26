-- Controle de qualidade dos áudios da voz
ALTER TABLE "VozCache" ADD COLUMN "transcricao" TEXT;
ALTER TABLE "VozCache" ADD COLUMN "modelo" TEXT;
ALTER TABLE "VozCache" ADD COLUMN "duracaoMs" INTEGER;
ALTER TABLE "VozCache" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'pendente';
