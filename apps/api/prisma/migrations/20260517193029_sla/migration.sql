-- CreateEnum
CREATE TYPE "EstagioPrecatorio" AS ENUM ('NOVOS_RECEBIMENTOS', 'TRIAGEM', 'ENVIADO_COTACAO', 'AGUARDANDO_BANCOS', 'NEGOCIACAO_CEDENTE', 'DOCUMENTACAO', 'DILIGENCIA', 'ESCRITURA_ASSINATURA', 'CONCLUIDO', 'PERDIDOS_ARQUIVADOS', 'FOLLOW_UP');

-- CreateEnum
CREATE TYPE "NaturezaPrecatorio" AS ENUM ('FEDERAL', 'ESTADUAL', 'MUNICIPAL');

-- CreateEnum
CREATE TYPE "TipoPrecatorio" AS ENUM ('HONORARIOS', 'ALIMENTAR', 'COMUM', 'DESAPROPRIACAO', 'ANISTIA_POLITICA');

-- CreateEnum
CREATE TYPE "ScorePrecatorio" AS ENUM ('MEDIO', 'AA', 'AAA', 'URGENTE');

-- CreateEnum
CREATE TYPE "StatusCotacao" AS ENUM ('PENDENTE', 'RECEBIDA', 'RECUSADA');

-- CreateEnum
CREATE TYPE "OcrStatus" AS ENUM ('NAO_PROCESSADO', 'PROCESSANDO', 'EXTRAIDO', 'FALHOU');

-- CreateEnum
CREATE TYPE "OrigemNegociacao" AS ENUM ('NOSSA', 'CEDENTE');

-- CreateEnum
CREATE TYPE "AcaoAudit" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'MUDANCA_ESTAGIO');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cedentes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "documento" TEXT,
    "contato" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cedentes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "parceiros" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "chavePix" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "parceiros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compradores" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "celular" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "aceitaFederal" BOOLEAN NOT NULL DEFAULT false,
    "ufsAceitas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "municipiosAceitos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "scoresAceitos" "ScorePrecatorio"[] DEFAULT ARRAY[]::"ScorePrecatorio"[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compradores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "precatorios" (
    "id" UUID NOT NULL,
    "numeroPrecatorio" TEXT,
    "numeroProcesso" TEXT,
    "cedenteId" UUID NOT NULL,
    "escritorioAdvogado" TEXT,
    "devedorTipo" "NaturezaPrecatorio" NOT NULL,
    "devedorUf" TEXT,
    "devedorMunicipio" TEXT,
    "tipo" "TipoPrecatorio" NOT NULL,
    "valorOriginal" DECIMAL(15,2) NOT NULL,
    "valorAtualizado" DECIMAL(15,2),
    "desagio" DECIMAL(15,2),
    "valorLiquido" DECIMAL(15,2),
    "score" "ScorePrecatorio" NOT NULL,
    "tribunal" TEXT,
    "vara" TEXT,
    "dataExpedicao" TIMESTAMP(3),
    "dataRequisicao" TIMESTAMP(3),
    "prazoEstimado" TIMESTAMP(3),
    "parceiroId" UUID,
    "comissaoTotal" DECIMAL(15,2),
    "comissaoParceiro" DECIMAL(15,2),
    "estagioAtual" "EstagioPrecatorio" NOT NULL DEFAULT 'NOVOS_RECEBIMENTOS',
    "estagioDesde" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "precatorios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anexos" (
    "id" UUID NOT NULL,
    "precatorioId" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "ocrStatus" "OcrStatus" NOT NULL DEFAULT 'NAO_PROCESSADO',
    "dadosExtraidos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "anexos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cotacoes" (
    "id" UUID NOT NULL,
    "precatorioId" UUID NOT NULL,
    "compradorId" UUID NOT NULL,
    "status" "StatusCotacao" NOT NULL DEFAULT 'PENDENTE',
    "valorBruto" DECIMAL(15,2),
    "comissao" DECIMAL(15,2),
    "observacao" TEXT,
    "dataEnvio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataResposta" TIMESTAMP(3),

    CONSTRAINT "cotacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "negociacoes" (
    "id" UUID NOT NULL,
    "precatorioId" UUID NOT NULL,
    "origem" "OrigemNegociacao" NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "observacao" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID NOT NULL,

    CONSTRAINT "negociacoes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historico_estagio" (
    "id" UUID NOT NULL,
    "precatorioId" UUID NOT NULL,
    "estagioAnterior" "EstagioPrecatorio",
    "estagioNovo" "EstagioPrecatorio" NOT NULL,
    "observacao" TEXT,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "historico_estagio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" UUID NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" TEXT NOT NULL,
    "acao" "AcaoAudit" NOT NULL,
    "antes" JSONB,
    "depois" JSONB,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacoes" (
    "id" UUID NOT NULL,
    "tipo" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "link" TEXT,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "compradores_cnpj_key" ON "compradores"("cnpj");

-- CreateIndex
CREATE INDEX "precatorios_estagioAtual_idx" ON "precatorios"("estagioAtual");

-- CreateIndex
CREATE INDEX "precatorios_cedenteId_idx" ON "precatorios"("cedenteId");

-- CreateIndex
CREATE INDEX "precatorios_devedorTipo_devedorUf_idx" ON "precatorios"("devedorTipo", "devedorUf");

-- CreateIndex
CREATE INDEX "precatorios_score_idx" ON "precatorios"("score");

-- CreateIndex
CREATE INDEX "anexos_precatorioId_idx" ON "anexos"("precatorioId");

-- CreateIndex
CREATE INDEX "cotacoes_precatorioId_idx" ON "cotacoes"("precatorioId");

-- CreateIndex
CREATE INDEX "cotacoes_status_idx" ON "cotacoes"("status");

-- CreateIndex
CREATE UNIQUE INDEX "cotacoes_precatorioId_compradorId_key" ON "cotacoes"("precatorioId", "compradorId");

-- CreateIndex
CREATE INDEX "negociacoes_precatorioId_createdAt_idx" ON "negociacoes"("precatorioId", "createdAt");

-- CreateIndex
CREATE INDEX "historico_estagio_precatorioId_createdAt_idx" ON "historico_estagio"("precatorioId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_entidade_entidadeId_idx" ON "audit_log"("entidade", "entidadeId");

-- CreateIndex
CREATE INDEX "audit_log_userId_createdAt_idx" ON "audit_log"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "notificacoes_userId_lida_createdAt_idx" ON "notificacoes"("userId", "lida", "createdAt");

-- AddForeignKey
ALTER TABLE "precatorios" ADD CONSTRAINT "precatorios_cedenteId_fkey" FOREIGN KEY ("cedenteId") REFERENCES "cedentes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "precatorios" ADD CONSTRAINT "precatorios_parceiroId_fkey" FOREIGN KEY ("parceiroId") REFERENCES "parceiros"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_precatorioId_fkey" FOREIGN KEY ("precatorioId") REFERENCES "precatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anexos" ADD CONSTRAINT "anexos_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_precatorioId_fkey" FOREIGN KEY ("precatorioId") REFERENCES "precatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cotacoes" ADD CONSTRAINT "cotacoes_compradorId_fkey" FOREIGN KEY ("compradorId") REFERENCES "compradores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociacoes" ADD CONSTRAINT "negociacoes_precatorioId_fkey" FOREIGN KEY ("precatorioId") REFERENCES "precatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "negociacoes" ADD CONSTRAINT "negociacoes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estagio" ADD CONSTRAINT "historico_estagio_precatorioId_fkey" FOREIGN KEY ("precatorioId") REFERENCES "precatorios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historico_estagio" ADD CONSTRAINT "historico_estagio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacoes" ADD CONSTRAINT "notificacoes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
