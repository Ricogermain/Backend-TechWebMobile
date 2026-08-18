/*
  Warnings:

  - You are about to drop the column `conversationId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the column `senderId` on the `messages` table. All the data in the column will be lost.
  - You are about to drop the `conversations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `idCommande` to the `messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `idExpediteur` to the `messages` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant1_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_participant2_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropIndex
DROP INDEX "messages_conversationId_createdAt_idx";

-- AlterTable
ALTER TABLE "messages" DROP COLUMN "conversationId",
DROP COLUMN "senderId",
ADD COLUMN     "idCommande" INTEGER NOT NULL,
ADD COLUMN     "idExpediteur" INTEGER NOT NULL;

-- DropTable
DROP TABLE "conversations";

-- CreateIndex
CREATE INDEX "messages_idCommande_createdAt_idx" ON "messages"("idCommande", "createdAt");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_idCommande_fkey" FOREIGN KEY ("idCommande") REFERENCES "commandes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_idExpediteur_fkey" FOREIGN KEY ("idExpediteur") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
