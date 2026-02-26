-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialKPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "potenciales" INTEGER NOT NULL DEFAULT 0,
    "presupuestos" INTEGER NOT NULL DEFAULT 0,
    "monto" REAL NOT NULL DEFAULT 0,
    "cumplimiento" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "CommercialKPI_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "OperationKPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "tiempoEfectivo" REAL NOT NULL DEFAULT 0,
    "ordenesProgramadas" INTEGER NOT NULL DEFAULT 0,
    "ordenesEjecutadas" INTEGER NOT NULL DEFAULT 0,
    "cancelaciones" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "OperationKPI_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualityKPI" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "period" TEXT NOT NULL,
    "nps" REAL NOT NULL DEFAULT 0,
    "cancelacionesTecnicas" INTEGER NOT NULL DEFAULT 0,
    "deficiencias" INTEGER NOT NULL DEFAULT 0,
    "satisfaccion" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "companyId" TEXT NOT NULL,
    CONSTRAINT "QualityKPI_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "CommercialKPI_companyId_period_idx" ON "CommercialKPI"("companyId", "period");

-- CreateIndex
CREATE INDEX "CommercialKPI_companyId_createdAt_idx" ON "CommercialKPI"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "OperationKPI_companyId_period_idx" ON "OperationKPI"("companyId", "period");

-- CreateIndex
CREATE INDEX "OperationKPI_companyId_createdAt_idx" ON "OperationKPI"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "QualityKPI_companyId_period_idx" ON "QualityKPI"("companyId", "period");

-- CreateIndex
CREATE INDEX "QualityKPI_companyId_createdAt_idx" ON "QualityKPI"("companyId", "createdAt");
