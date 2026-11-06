-- CreateEnum
CREATE TYPE "WindowStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ElectionState" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "registrationStatus" "WindowStatus" NOT NULL DEFAULT 'CLOSED',
    "electionStatus" "WindowStatus" NOT NULL DEFAULT 'CLOSED',
    "resultsReleasedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ElectionState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "studyLoadPath" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ballot" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "yearLevel" TEXT NOT NULL,
    "disclosureAcceptedAt" TIMESTAMP(3) NOT NULL,
    "castAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ballot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BallotAnswer" (
    "id" TEXT NOT NULL,
    "ballotId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "candidateId" TEXT,

    CONSTRAINT "BallotAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "email" TEXT NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("email")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "adminEmail" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT,
    "detail" JSONB,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "Person"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_personId_key" ON "Registration"("personId");

-- CreateIndex
CREATE INDEX "Registration_status_yearLevel_idx" ON "Registration"("status", "yearLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Ballot_personId_key" ON "Ballot"("personId");

-- CreateIndex
CREATE INDEX "BallotAnswer_questionId_candidateId_idx" ON "BallotAnswer"("questionId", "candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "BallotAnswer_ballotId_questionId_candidateId_key" ON "BallotAnswer"("ballotId", "questionId", "candidateId");

-- CreateIndex
CREATE INDEX "AuditLog_at_idx" ON "AuditLog"("at");

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ballot" ADD CONSTRAINT "Ballot_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BallotAnswer" ADD CONSTRAINT "BallotAnswer_ballotId_fkey" FOREIGN KEY ("ballotId") REFERENCES "Ballot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
