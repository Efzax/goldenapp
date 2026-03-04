-- CreateTable
CREATE TABLE "ClassificationMeta" (
    "id" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassificationMeta_pkey" PRIMARY KEY ("id")
);
