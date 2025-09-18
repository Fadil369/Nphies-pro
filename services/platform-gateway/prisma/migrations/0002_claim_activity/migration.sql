-- CreateTable
CREATE TABLE "ClaimActivity" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "claimId" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ClaimActivity_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClaimActivity_claimId_idx" ON "ClaimActivity" ("claimId");
CREATE INDEX "ClaimActivity_tenantId_idx" ON "ClaimActivity" ("tenantId");
