/*
  Warnings:

  - You are about to drop the column `document` on the `workers` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[ssn]` on the table `workers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `ssn` to the `workers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `work_authorization` to the `workers` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "contracts" DROP CONSTRAINT "contracts_worker_id_fkey";

-- DropIndex
DROP INDEX "workers_document_key";

-- AlterTable
ALTER TABLE "contracts" ADD COLUMN     "company_id" TEXT,
ALTER COLUMN "worker_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "workers" DROP COLUMN "document",
ADD COLUMN     "address" TEXT,
ADD COLUMN     "company_id" TEXT,
ADD COLUMN     "ein" TEXT,
ADD COLUMN     "emergency_contact" TEXT,
ADD COLUMN     "emergency_phone" TEXT,
ADD COLUMN     "ssn" TEXT NOT NULL,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "work_authorization" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "companies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ein" TEXT NOT NULL,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "state" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_ein_key" ON "companies"("ein");

-- CreateIndex
CREATE UNIQUE INDEX "workers_ssn_key" ON "workers"("ssn");

-- AddForeignKey
ALTER TABLE "workers" ADD CONSTRAINT "workers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
