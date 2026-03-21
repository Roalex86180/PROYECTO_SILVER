-- CreateTable
CREATE TABLE "routes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "route_companies" (
    "route_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,

    CONSTRAINT "route_companies_pkey" PRIMARY KEY ("route_id","company_id")
);

-- CreateTable
CREATE TABLE "locals" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "budget" DECIMAL(12,2),
    "location" TEXT,
    "address" TEXT,
    "zip_code" TEXT,
    "route_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "local_workers" (
    "local_id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,

    CONSTRAINT "local_workers_pkey" PRIMARY KEY ("local_id","worker_id")
);

-- AddForeignKey
ALTER TABLE "routes" ADD CONSTRAINT "routes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_companies" ADD CONSTRAINT "route_companies_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "route_companies" ADD CONSTRAINT "route_companies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locals" ADD CONSTRAINT "locals_route_id_fkey" FOREIGN KEY ("route_id") REFERENCES "routes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_workers" ADD CONSTRAINT "local_workers_local_id_fkey" FOREIGN KEY ("local_id") REFERENCES "locals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "local_workers" ADD CONSTRAINT "local_workers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "workers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
