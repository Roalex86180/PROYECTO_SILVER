-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "budget" DECIMAL(12,2),
ADD COLUMN     "client_contact" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "end_date" DATE,
ADD COLUMN     "progress" INTEGER DEFAULT 0,
ADD COLUMN     "start_date" DATE;
