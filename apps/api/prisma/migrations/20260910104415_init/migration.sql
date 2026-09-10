-- CreateEnum
CREATE TYPE "GameType" AS ENUM ('REGULAR', 'PLAYOFF', 'CHAMPIONSHIP', 'PRESEASON', 'ALLSTAR', 'OTHER');

-- CreateEnum
CREATE TYPE "RankingMetric" AS ENUM ('PTS', 'REB', 'AST', 'STL', 'BLK', 'FG_PCT', 'FG3_PCT', 'FT_PCT', 'TS_PCT', 'EFG_PCT', 'USG_PCT', 'AST_PCT', 'TOV_PCT', 'PER', 'PIE');

-- CreateEnum
CREATE TYPE "RunStatus" AS ENUM ('RUNNING', 'SUCCESS', 'FAILED', 'PARTIAL');

-- CreateTable
CREATE TABLE "Season" (
    "id" SERIAL NOT NULL,
    "kblSeasonCode" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "gameMinutes" INTEGER NOT NULL DEFAULT 40,
    "minGames" INTEGER NOT NULL DEFAULT 38,
    "minMinutesPerGame" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Season_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "kblTeamCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "colorPrimary" TEXT,
    "colorSecondary" TEXT,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" SERIAL NOT NULL,
    "kblPlayerNo" TEXT NOT NULL,
    "koreanName" TEXT NOT NULL,
    "englishName" TEXT,
    "position" TEXT,
    "heightCm" DOUBLE PRECISION,
    "weightKg" DOUBLE PRECISION,
    "draftInfo" TEXT,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" SERIAL NOT NULL,
    "gmkey" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "gameDate" TIMESTAMP(3) NOT NULL,
    "tipOff" TEXT,
    "stadium" TEXT,
    "homeTeamId" INTEGER NOT NULL,
    "awayTeamId" INTEGER NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "isEnded" BOOLEAN NOT NULL DEFAULT false,
    "gameType" "GameType" NOT NULL DEFAULT 'REGULAR',
    "kblSeasonCategory" TEXT,
    "kblGameCode" TEXT,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerGameStat" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "isHome" BOOLEAN NOT NULL,
    "isStarter" BOOLEAN,
    "secondsPlayed" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "fgm" INTEGER NOT NULL,
    "fga" INTEGER NOT NULL,
    "fg2m" INTEGER,
    "fg2a" INTEGER,
    "fg3m" INTEGER NOT NULL,
    "fg3a" INTEGER NOT NULL,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER NOT NULL,
    "offReb" INTEGER,
    "defReb" INTEGER,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,
    "plusMinus" INTEGER,
    "srcPer" DOUBLE PRECISION,
    "srcPie" DOUBLE PRECISION,
    "srcTsPct" DOUBLE PRECISION,
    "srcEfgPct" DOUBLE PRECISION,
    "srcUsgPct" DOUBLE PRECISION,
    "srcAstPct" DOUBLE PRECISION,
    "srcTovPct" DOUBLE PRECISION,

    CONSTRAINT "PlayerGameStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamGameStat" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "isHome" BOOLEAN NOT NULL,
    "secondsPlayed" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "fgm" INTEGER NOT NULL,
    "fga" INTEGER NOT NULL,
    "fg3m" INTEGER NOT NULL,
    "fg3a" INTEGER NOT NULL,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER NOT NULL,
    "offReb" INTEGER,
    "defReb" INTEGER,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,

    CONSTRAINT "TeamGameStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerSeasonStat" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "games" INTEGER NOT NULL,
    "gamesStarted" INTEGER,
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
    "tsPct" DOUBLE PRECISION,
    "efgPct" DOUBLE PRECISION,
    "usgPct" DOUBLE PRECISION,
    "astPct" DOUBLE PRECISION,
    "tovPct" DOUBLE PRECISION,
    "per" DOUBLE PRECISION,
    "pie" DOUBLE PRECISION,
    "offRtg" DOUBLE PRECISION,
    "defRtg" DOUBLE PRECISION,
    "netRtg" DOUBLE PRECISION,
    "pace" DOUBLE PRECISION,
    "qualified" BOOLEAN NOT NULL DEFAULT false,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerSeasonStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerCareerStat" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "seasons" INTEGER NOT NULL,
    "games" INTEGER NOT NULL,
    "secondsPlayed" INTEGER NOT NULL,
    "points" INTEGER NOT NULL,
    "fgm" INTEGER NOT NULL,
    "fga" INTEGER NOT NULL,
    "fg3m" INTEGER NOT NULL,
    "fg3a" INTEGER NOT NULL,
    "ftm" INTEGER NOT NULL,
    "fta" INTEGER NOT NULL,
    "reb" INTEGER NOT NULL,
    "ast" INTEGER NOT NULL,
    "stl" INTEGER NOT NULL,
    "blk" INTEGER NOT NULL,
    "tov" INTEGER NOT NULL,
    "tsPct" DOUBLE PRECISION,
    "per" DOUBLE PRECISION,
    "pie" DOUBLE PRECISION,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlayerCareerStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeasonMetricRanking" (
    "id" SERIAL NOT NULL,
    "playerSeasonStatId" INTEGER NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "metric" "RankingMetric" NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "percentileRaw" DOUBLE PRECISION NOT NULL,
    "percentileBucket" INTEGER NOT NULL,
    "rank" INTEGER NOT NULL,
    "population" INTEGER NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SeasonMetricRanking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamSeasonStanding" (
    "id" SERIAL NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "winPct" DOUBLE PRECISION NOT NULL,
    "gamesBehind" DOUBLE PRECISION NOT NULL,
    "streak" TEXT,
    "last5" TEXT,
    "homeWins" INTEGER NOT NULL DEFAULT 0,
    "homeLosses" INTEGER NOT NULL DEFAULT 0,
    "awayWins" INTEGER NOT NULL DEFAULT 0,
    "awayLosses" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamSeasonStanding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRatingSnapshot" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "gameId" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "ratingPre" DOUBLE PRECISION NOT NULL,
    "ratingPost" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRatingSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GamePrediction" (
    "id" SERIAL NOT NULL,
    "gameId" INTEGER NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "homeWinProb" DOUBLE PRECISION NOT NULL,
    "awayWinProb" DOUBLE PRECISION NOT NULL,
    "homeRatingPre" DOUBLE PRECISION,
    "awayRatingPre" DOUBLE PRECISION,
    "features" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GamePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModelEvaluation" (
    "id" SERIAL NOT NULL,
    "modelVersion" TEXT NOT NULL,
    "seasonId" INTEGER NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "brierScore" DOUBLE PRECISION NOT NULL,
    "logLoss" DOUBLE PRECISION NOT NULL,
    "baselineHomeBrier" DOUBLE PRECISION NOT NULL,
    "baselineWinPctBrier" DOUBLE PRECISION NOT NULL,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModelEvaluation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RawApiResponse" (
    "id" BIGSERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "params" JSONB NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "payload" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ingestionRunId" INTEGER,

    CONSTRAINT "RawApiResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" SERIAL NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "RunStatus" NOT NULL DEFAULT 'RUNNING',
    "trigger" TEXT NOT NULL,
    "gamesIngested" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "error" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Season_kblSeasonCode_key" ON "Season"("kblSeasonCode");

-- CreateIndex
CREATE INDEX "Season_startYear_idx" ON "Season"("startYear");

-- CreateIndex
CREATE UNIQUE INDEX "Team_kblTeamCode_key" ON "Team"("kblTeamCode");

-- CreateIndex
CREATE UNIQUE INDEX "Player_kblPlayerNo_key" ON "Player"("kblPlayerNo");

-- CreateIndex
CREATE INDEX "Player_koreanName_idx" ON "Player"("koreanName");

-- CreateIndex
CREATE UNIQUE INDEX "Game_gmkey_key" ON "Game"("gmkey");

-- CreateIndex
CREATE INDEX "Game_seasonId_gameDate_idx" ON "Game"("seasonId", "gameDate");

-- CreateIndex
CREATE INDEX "Game_gameDate_idx" ON "Game"("gameDate");

-- CreateIndex
CREATE INDEX "Game_isEnded_idx" ON "Game"("isEnded");

-- CreateIndex
CREATE INDEX "PlayerGameStat_playerId_idx" ON "PlayerGameStat"("playerId");

-- CreateIndex
CREATE INDEX "PlayerGameStat_teamId_idx" ON "PlayerGameStat"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerGameStat_gameId_playerId_key" ON "PlayerGameStat"("gameId", "playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamGameStat_gameId_teamId_key" ON "TeamGameStat"("gameId", "teamId");

-- CreateIndex
CREATE INDEX "PlayerSeasonStat_seasonId_qualified_idx" ON "PlayerSeasonStat"("seasonId", "qualified");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerSeasonStat_playerId_seasonId_key" ON "PlayerSeasonStat"("playerId", "seasonId");

-- CreateIndex
CREATE UNIQUE INDEX "PlayerCareerStat_playerId_key" ON "PlayerCareerStat"("playerId");

-- CreateIndex
CREATE INDEX "SeasonMetricRanking_seasonId_metric_idx" ON "SeasonMetricRanking"("seasonId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "SeasonMetricRanking_playerSeasonStatId_metric_key" ON "SeasonMetricRanking"("playerSeasonStatId", "metric");

-- CreateIndex
CREATE UNIQUE INDEX "TeamSeasonStanding_seasonId_teamId_key" ON "TeamSeasonStanding"("seasonId", "teamId");

-- CreateIndex
CREATE INDEX "TeamRatingSnapshot_modelVersion_date_idx" ON "TeamRatingSnapshot"("modelVersion", "date");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRatingSnapshot_teamId_gameId_modelVersion_key" ON "TeamRatingSnapshot"("teamId", "gameId", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "GamePrediction_gameId_modelVersion_key" ON "GamePrediction"("gameId", "modelVersion");

-- CreateIndex
CREATE UNIQUE INDEX "ModelEvaluation_modelVersion_seasonId_key" ON "ModelEvaluation"("modelVersion", "seasonId");

-- CreateIndex
CREATE INDEX "RawApiResponse_endpoint_fetchedAt_idx" ON "RawApiResponse"("endpoint", "fetchedAt");

-- CreateIndex
CREATE INDEX "RawApiResponse_ingestionRunId_idx" ON "RawApiResponse"("ingestionRunId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerGameStat" ADD CONSTRAINT "PlayerGameStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameStat" ADD CONSTRAINT "TeamGameStat_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamGameStat" ADD CONSTRAINT "TeamGameStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerSeasonStat" ADD CONSTRAINT "PlayerSeasonStat_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCareerStat" ADD CONSTRAINT "PlayerCareerStat_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMetricRanking" ADD CONSTRAINT "SeasonMetricRanking_playerSeasonStatId_fkey" FOREIGN KEY ("playerSeasonStatId") REFERENCES "PlayerSeasonStat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SeasonMetricRanking" ADD CONSTRAINT "SeasonMetricRanking_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStanding" ADD CONSTRAINT "TeamSeasonStanding_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamSeasonStanding" ADD CONSTRAINT "TeamSeasonStanding_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRatingSnapshot" ADD CONSTRAINT "TeamRatingSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRatingSnapshot" ADD CONSTRAINT "TeamRatingSnapshot_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GamePrediction" ADD CONSTRAINT "GamePrediction_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModelEvaluation" ADD CONSTRAINT "ModelEvaluation_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RawApiResponse" ADD CONSTRAINT "RawApiResponse_ingestionRunId_fkey" FOREIGN KEY ("ingestionRunId") REFERENCES "IngestionRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
