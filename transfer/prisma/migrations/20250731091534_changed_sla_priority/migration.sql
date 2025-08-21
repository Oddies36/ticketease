/*
  Warnings:

  - You are about to drop the column `priority` on the `SLA` table. All the data in the column will be lost.
  - Added the required column `priorityId` to the `SLA` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "SLA" DROP COLUMN "priority",
ADD COLUMN     "priorityId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "SLA" ADD CONSTRAINT "SLA_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "Priority"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
