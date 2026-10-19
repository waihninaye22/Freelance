/*
  Warnings:

  - You are about to drop the column `maxAmount` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `minAmount` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `Proposal` table. All the data in the column will be lost.
  - Added the required column `amountMinor` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `amountMinor` to the `Proposal` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "clientId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "budgetType" TEXT NOT NULL,
    "minAmountMinor" INTEGER,
    "maxAmountMinor" INTEGER,
    "currency" TEXT NOT NULL,
    "experienceLevel" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("budgetType", "categoryId", "clientId", "createdAt", "currency", "description", "experienceLevel", "id", "status", "title", "updatedAt") SELECT "budgetType", "categoryId", "clientId", "createdAt", "currency", "description", "experienceLevel", "id", "status", "title", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE INDEX "Job_status_createdAt_idx" ON "Job"("status", "createdAt");
CREATE INDEX "Job_categoryId_status_idx" ON "Job"("categoryId", "status");
CREATE INDEX "Job_currency_budgetType_status_idx" ON "Job"("currency", "budgetType", "status");
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "scopeSummary" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "Proposal" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("clientId", "createdAt", "currency", "freelancerId", "id", "jobId", "proposalId", "scopeSummary", "status", "updatedAt") SELECT "clientId", "createdAt", "currency", "freelancerId", "id", "jobId", "proposalId", "scopeSummary", "status", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE UNIQUE INDEX "Project_jobId_key" ON "Project"("jobId");
CREATE UNIQUE INDEX "Project_proposalId_key" ON "Project"("proposalId");
CREATE INDEX "Project_clientId_status_updatedAt_idx" ON "Project"("clientId", "status", "updatedAt");
CREATE INDEX "Project_freelancerId_status_updatedAt_idx" ON "Project"("freelancerId", "status", "updatedAt");
CREATE TABLE "new_Proposal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "freelancerId" TEXT NOT NULL,
    "coverMessage" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "estimatedDurationDays" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Proposal_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Proposal_freelancerId_fkey" FOREIGN KEY ("freelancerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Proposal" ("coverMessage", "createdAt", "currency", "estimatedDurationDays", "freelancerId", "id", "jobId", "status", "updatedAt") SELECT "coverMessage", "createdAt", "currency", "estimatedDurationDays", "freelancerId", "id", "jobId", "status", "updatedAt" FROM "Proposal";
DROP TABLE "Proposal";
ALTER TABLE "new_Proposal" RENAME TO "Proposal";
CREATE INDEX "Proposal_jobId_status_createdAt_idx" ON "Proposal"("jobId", "status", "createdAt");
CREATE INDEX "Proposal_freelancerId_status_createdAt_idx" ON "Proposal"("freelancerId", "status", "createdAt");
CREATE UNIQUE INDEX "Proposal_jobId_freelancerId_key" ON "Proposal"("jobId", "freelancerId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
