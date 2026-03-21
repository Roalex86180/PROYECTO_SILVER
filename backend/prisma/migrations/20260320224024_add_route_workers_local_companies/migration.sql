-- CreateTable
CREATE TABLE "route_workers" (
    "route_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,

    CONSTRAINT "route_workers_pkey" PRIMARY KEY ("route_id","worker_id")
);

-- CreateTable
CREATE TABLE "local_companies" (
    "local_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "local_companies_pkey" PRIMARY KEY ("local_id","company_id")
);

-- AddForeignKey
ALTER TABLE "route_workers" ADD CONSTRAINT "route_workers_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_workers" ADD CONSTRAINT "route_workers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_companies" ADD CONSTRAINT "local_companies_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_companies" ADD CONSTRAINT "local_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
