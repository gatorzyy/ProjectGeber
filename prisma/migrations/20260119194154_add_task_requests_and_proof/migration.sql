-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Task" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "pointValue" INTEGER NOT NULL DEFAULT 10,
    "dueDate" DATETIME,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringType" TEXT,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "isKidRequest" BOOLEAN NOT NULL DEFAULT false,
    "requestStatus" TEXT NOT NULL DEFAULT 'approved',
    "proofImageUrl" TEXT,
    "completionNote" TEXT,
    "parentComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "kidId" TEXT NOT NULL,
    CONSTRAINT "Task_kidId_fkey" FOREIGN KEY ("kidId") REFERENCES "Kid" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Task" ("completedAt", "createdAt", "description", "dueDate", "id", "isCompleted", "isRecurring", "kidId", "pointValue", "recurringType", "title", "updatedAt") SELECT "completedAt", "createdAt", "description", "dueDate", "id", "isCompleted", "isRecurring", "kidId", "pointValue", "recurringType", "title", "updatedAt" FROM "Task";
DROP TABLE "Task";
ALTER TABLE "new_Task" RENAME TO "Task";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
