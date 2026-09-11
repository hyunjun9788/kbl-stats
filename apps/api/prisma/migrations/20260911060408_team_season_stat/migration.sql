-- CreateTable
CREATE TABLE "TeamSeasonStat" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "games" INTEGER NOT NULL,
    "secondsPlayed" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "fgm" INTEGER NOT NULL,
    "fga" INTEGER NOT NULL,
    "fg3m" INTEGER NOT NULL,
    "fg3a" INTEGER NOT NULL,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER NOT NULL,
    "offReb" INTEGER NOT NULL,
    "defReb" INTEGER NOT NULL,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStat_teamId_seasonId_key" ON "TeamSeasonStat"("teamId", "seasonId");

-- AddForeignKey
ALTER TABLE "TeamSeasonStat" ADD CONSTRAINT "TeamSeasonStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStat" ADD CONSTRAINT "TeamSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
