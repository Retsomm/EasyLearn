-- CreateTable
CREATE TABLE "SavedKeyPoint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyPointId" TEXT NOT NULL,

    CONSTRAINT "SavedKeyPoint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SavedKeyPoint_userId_keyPointId_key" ON "SavedKeyPoint"("userId", "keyPointId");

-- AddForeignKey
ALTER TABLE "SavedKeyPoint" ADD CONSTRAINT "SavedKeyPoint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
