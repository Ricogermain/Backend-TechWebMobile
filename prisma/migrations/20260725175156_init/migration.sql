-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENT', 'ADMIN', 'LIVREUR');

-- CreateEnum
CREATE TYPE "StatutCommande" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_LIVRAISON', 'LIVREE', 'ANNULEE');

-- CreateEnum
CREATE TYPE "StatutLivraison" AS ENUM ('PRISE_EN_CHARGE', 'EN_ROUTE', 'LIVREE');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "telephone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicules" (
    "id" SERIAL NOT NULL,
    "marque" TEXT NOT NULL,
    "modele" TEXT NOT NULL,
    "annee" INTEGER NOT NULL,
    "prix" DECIMAL(10,2) NOT NULL,
    "imageUrl" TEXT,
    "disponible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "commandes" (
    "id" SERIAL NOT NULL,
    "idClient" INTEGER NOT NULL,
    "idVehicule" INTEGER NOT NULL,
    "adresseLivraison" TEXT NOT NULL,
    "dateCommande" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutCommande" NOT NULL DEFAULT 'EN_ATTENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "commandes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livraisons" (
    "id" SERIAL NOT NULL,
    "idCommande" INTEGER NOT NULL,
    "idLivreur" INTEGER,
    "statut" "StatutLivraison" NOT NULL DEFAULT 'PRISE_EN_CHARGE',
    "datePriseEnCharge" TIMESTAMP(3),
    "dateLivraison" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "livraisons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "livraisons_idCommande_key" ON "livraisons"("idCommande");

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_idClient_fkey" FOREIGN KEY ("idClient") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commandes" ADD CONSTRAINT "commandes_idVehicule_fkey" FOREIGN KEY ("idVehicule") REFERENCES "vehicules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livraisons" ADD CONSTRAINT "livraisons_idCommande_fkey" FOREIGN KEY ("idCommande") REFERENCES "commandes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livraisons" ADD CONSTRAINT "livraisons_idLivreur_fkey" FOREIGN KEY ("idLivreur") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
