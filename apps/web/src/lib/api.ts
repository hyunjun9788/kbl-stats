const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

export interface PlayerListItem {
  playerId: number;
  kblPlayerNo: string;
  koreanName: string;
  englishName: string | null;
  position: string | null;
  team: { id: number; kblTeamCode: string; name: string; shortName: string };
  games: number;
  gamesStarted: number;
  pts: number | null;
  reb: number | null;
  ast: number | null;
  tsPct: number | null;
  per: number | null;
}

/** Server Component에서만 호출한다 — 브라우저로는 API_BASE_URL을 노출하지 않는다. */
export async function getPlayers(seasonCode: number): Promise<PlayerListItem[]> {
  const res = await fetch(`${API_BASE_URL}/players?season=${seasonCode}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`GET /players?season=${seasonCode} -> HTTP ${res.status}`);
  }
  return res.json();
}
