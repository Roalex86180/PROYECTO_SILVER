-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "payment_method" TEXT,
    "notes" TEXT,
    "receipt_url" TEXT,
    "project_id" TEXT,
    "company_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
