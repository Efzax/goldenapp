/*
  Warnings:

  - Made the column `chainId` on table `Store` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Store" DROP CONSTRAINT "Store_chainId_fkey";

-- AlterTable
ALTER TABLE "Store" ALTER COLUMN "chainId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Store" ADD CONSTRAINT "Store_chainId_fkey" FOREIGN KEY ("chainId") REFERENCES "Chain"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
