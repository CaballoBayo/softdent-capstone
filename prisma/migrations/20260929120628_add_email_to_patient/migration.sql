/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Patient` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "notes" TEXT,
ALTER COLUMN "status" SET DEFAULT 'AGENDADO';

-- AlterTable
ALTER TABLE "Patient" ADD COLUMN     "email" TEXT;

-- AlterTable
ALTER TABLE "Payroll" ADD COLUMN     "closedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Patient_email_key" ON "Patient"("email");
