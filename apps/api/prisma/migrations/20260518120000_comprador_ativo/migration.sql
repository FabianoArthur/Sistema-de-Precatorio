ALTER TABLE "compradores" ADD COLUMN "ativo" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX "compradores_ativo_idx" ON "compradores"("ativo");
