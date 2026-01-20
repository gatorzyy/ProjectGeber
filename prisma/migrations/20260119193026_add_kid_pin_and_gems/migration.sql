-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdminSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "passwordHash" TEXT NOT NULL,
    "starPointsRatio" INTEGER NOT NULL DEFAULT 1,
    "gemPointsRatio" INTEGER NOT NULL DEFAULT 10
);
INSERT INTO "new_AdminSettings" ("id", "passwordHash", "starPointsRatio") SELECT "id", "passwordHash", "starPointsRatio" FROM "AdminSettings";
DROP TABLE "AdminSettings";
ALTER TABLE "new_AdminSettings" RENAME TO "AdminSettings";
CREATE TABLE "new_Kid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "avatarColor" TEXT NOT NULL DEFAULT '#8B5CF6',
    "pin" TEXT,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "totalGems" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Kid" ("avatarColor", "createdAt", "id", "name", "totalPoints", "updatedAt") SELECT "avatarColor", "createdAt", "id", "name", "totalPoints", "updatedAt" FROM "Kid";
DROP TABLE "Kid";
ALTER TABLE "new_Kid" RENAME TO "Kid";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
