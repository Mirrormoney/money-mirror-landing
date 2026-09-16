CREATE TABLE "TrafficDay" (
 "day" TEXT NOT NULL,
 "path" TEXT NOT NULL,
 "views" INTEGER NOT NULL DEFAULT 0,
 "visitors" INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY ("day", "path")
);
CREATE TABLE "TrafficVisitor" (
 "day" TEXT NOT NULL,
 "hash" TEXT NOT NULL,
 "expiresAt" TIMESTAMPTZ NOT NULL,
 PRIMARY KEY ("day", "hash")
);
CREATE INDEX "TrafficVisitor_expiresAt_idx" ON "TrafficVisitor" ("expiresAt");
