-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "personalId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Invite_code_key" ON "Invite"("code");

-- CreateIndex
CREATE INDEX "Invite_personalId_idx" ON "Invite"("personalId");

-- CreateIndex
CREATE INDEX "User_personalId_idx" ON "User"("personalId");

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_personalId_fkey" FOREIGN KEY ("personalId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_usedByStudentId_fkey" FOREIGN KEY ("usedByStudentId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
