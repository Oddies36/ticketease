-- CreateTable
CREATE TABLE "Computer" (
    "id" SERIAL NOT NULL,
    "computerName" TEXT NOT NULL,
    "serialNumber" TEXT NOT NULL,
    "assignedToId" INTEGER,
    "assignedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Computer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Computer_serialNumber_key" ON "Computer"("serialNumber");

-- AddForeignKey
ALTER TABLE "Computer" ADD CONSTRAINT "Computer_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
