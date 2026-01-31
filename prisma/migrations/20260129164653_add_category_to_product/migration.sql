-- CreateEnum
CREATE TYPE "Category" AS ENUM ('TV', 'AV');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "category" "Category" NOT NULL DEFAULT 'TV';
