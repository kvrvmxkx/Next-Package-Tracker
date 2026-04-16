-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'AGENT_CHINE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "agenceId" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Agence" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "pays" TEXT NOT NULL,
    "ville" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Agence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupeColis" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "expediteurEstFournisseur" BOOLEAN NOT NULL DEFAULT false,
    "expediteurNom" TEXT NOT NULL,
    "expediteurPhone" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "GroupeColis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colis" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "poids" DOUBLE PRECISION NOT NULL,
    "destination" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'ENREGISTRE',
    "agenceOrigineId" INTEGER,
    "agenceDestinationId" INTEGER,
    "groupeId" TEXT,
    "expediteurEstFournisseur" BOOLEAN NOT NULL DEFAULT false,
    "expediteurNom" TEXT NOT NULL,
    "expediteurPhone" TEXT NOT NULL,
    "nombreColis" INTEGER NOT NULL DEFAULT 1,
    "destinataireNom" TEXT NOT NULL,
    "destinatairePhone" TEXT NOT NULL,
    "destinataireVille" TEXT,
    "destinataireAdresse" TEXT,
    "prixTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avancePaye" BOOLEAN NOT NULL DEFAULT false,
    "soldePaye" BOOLEAN NOT NULL DEFAULT false,
    "tarifId" INTEGER,
    "tokenPublic" TEXT NOT NULL,
    "notes" TEXT,
    "qrCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Colis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColisHistorique" (
    "id" TEXT NOT NULL,
    "statut" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colisId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "ColisHistorique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColisPhoto" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colisId" TEXT NOT NULL,

    CONSTRAINT "ColisPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colisId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarif" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Tarif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrancheTarif" (
    "id" SERIAL NOT NULL,
    "poidsMin" DOUBLE PRECISION NOT NULL,
    "poidsMax" DOUBLE PRECISION,
    "prixParKg" DOUBLE PRECISION NOT NULL,
    "tarifId" INTEGER NOT NULL,

    CONSTRAINT "TrancheTarif_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Retrait" (
    "id" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "motif" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "agentId" TEXT NOT NULL,

    CONSTRAINT "Retrait_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE UNIQUE INDEX "GroupeColis_code_key" ON "GroupeColis"("code");

-- CreateIndex
CREATE INDEX "GroupeColis_code_idx" ON "GroupeColis"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Colis_code_key" ON "Colis"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Colis_tokenPublic_key" ON "Colis"("tokenPublic");

-- CreateIndex
CREATE INDEX "Colis_code_idx" ON "Colis"("code");

-- CreateIndex
CREATE INDEX "Colis_tokenPublic_idx" ON "Colis"("tokenPublic");

-- CreateIndex
CREATE INDEX "Colis_statut_idx" ON "Colis"("statut");

-- CreateIndex
CREATE INDEX "Colis_destination_idx" ON "Colis"("destination");

-- CreateIndex
CREATE INDEX "ColisHistorique_colisId_idx" ON "ColisHistorique"("colisId");

-- CreateIndex
CREATE INDEX "ColisPhoto_colisId_idx" ON "ColisPhoto"("colisId");

-- CreateIndex
CREATE INDEX "Paiement_colisId_idx" ON "Paiement"("colisId");

-- CreateIndex
CREATE INDEX "TrancheTarif_tarifId_idx" ON "TrancheTarif"("tarifId");

-- CreateIndex
CREATE INDEX "Retrait_createdAt_idx" ON "Retrait"("createdAt");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_agenceId_fkey" FOREIGN KEY ("agenceId") REFERENCES "Agence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupeColis" ADD CONSTRAINT "GroupeColis_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_agenceOrigineId_fkey" FOREIGN KEY ("agenceOrigineId") REFERENCES "Agence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_agenceDestinationId_fkey" FOREIGN KEY ("agenceDestinationId") REFERENCES "Agence"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "GroupeColis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_tarifId_fkey" FOREIGN KEY ("tarifId") REFERENCES "Tarif"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Colis" ADD CONSTRAINT "Colis_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColisHistorique" ADD CONSTRAINT "ColisHistorique_colisId_fkey" FOREIGN KEY ("colisId") REFERENCES "Colis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColisHistorique" ADD CONSTRAINT "ColisHistorique_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColisPhoto" ADD CONSTRAINT "ColisPhoto_colisId_fkey" FOREIGN KEY ("colisId") REFERENCES "Colis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_colisId_fkey" FOREIGN KEY ("colisId") REFERENCES "Colis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrancheTarif" ADD CONSTRAINT "TrancheTarif_tarifId_fkey" FOREIGN KEY ("tarifId") REFERENCES "Tarif"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Retrait" ADD CONSTRAINT "Retrait_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
