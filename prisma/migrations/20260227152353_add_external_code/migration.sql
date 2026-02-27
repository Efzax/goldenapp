/*
  Warnings:

  - A unique constraint covering the columns `[externalCode]` on the table `Store` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "externalCode" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Store_externalCode_key" ON "Store"("externalCode");
