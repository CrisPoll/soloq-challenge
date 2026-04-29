const RIOT_PLATFORM = "https://la2.api.riotgames.com";
const RIOT_REGION = "https://americas.api.riotgames.com";

export interface RiotAccount {
  puuid: string;
  gameName: string;
  tagLine: string;
}

export interface RiotSummoner {
  id?: string;
  puuid: string;
  profileIconId: number;
  summonerLevel: number;
}

export interface RiotLeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
}

export interface RiotMatch {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    queueId: number;
    gameDuration: number;
    gameEndTimestamp: number;
    participants: RiotParticipant[];
  };
}

export interface RiotParticipant {
  puuid: string;
  championName: string;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  win: boolean;
  champLevel: number;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  teamId: number;
  role: string;
  lane: string;
}

class RiotAPI {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  private async fetch<T>(url: string): Promise<T> {
    const res = await fetch(url, {
      headers: { "X-Riot-Token": this.key },
    });
    if (!res.ok) {
      if (res.status === 429) {
        const retryAfter = res.headers.get("Retry-After");
        const delay = retryAfter ? parseInt(retryAfter) * 1000 : 2000;
        await new Promise((r) => setTimeout(r, delay));
        return this.fetch<T>(url);
      }
      if (res.status === 403) {
        throw new Error(
          "RIOT API 403: API Key invalida o expirada. Regenerala en https://developer.riotgames.com/ (las dev keys duran 24h)"
        );
      }
      throw new Error(`RIOT API ${res.status}: ${await res.text()}`);
    }
    return res.json();
  }

  async getAccount(gameName: string, tagLine: string): Promise<RiotAccount> {
    return this.fetch<RiotAccount>(
      `${RIOT_REGION}/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`
    );
  }

  async getSummoner(puuid: string): Promise<RiotSummoner> {
    return this.fetch<RiotSummoner>(
      `${RIOT_PLATFORM}/lol/summoner/v4/summoners/by-puuid/${puuid}`
    );
  }

  async getSummonerByName(name: string): Promise<RiotSummoner> {
    return this.fetch<RiotSummoner>(
      `${RIOT_PLATFORM}/lol/summoner/v4/summoners/by-name/${encodeURIComponent(name)}`
    );
  }

  async getLeagueEntries(puuid: string): Promise<RiotLeagueEntry[]> {
    return this.fetch<RiotLeagueEntry[]>(
      `${RIOT_PLATFORM}/lol/league/v4/entries/by-puuid/${puuid}`
    );
  }

  async getMatchIds(puuid: string, count: number = 10): Promise<string[]> {
    return this.fetch<string[]>(
      `${RIOT_REGION}/lol/match/v5/matches/by-puuid/${puuid}/ids?start=0&count=${count}`
    );
  }

  async getMatch(matchId: string): Promise<RiotMatch> {
    return this.fetch<RiotMatch>(
      `${RIOT_REGION}/lol/match/v5/matches/${matchId}`
    );
  }
}

export function createRiotAPI(key: string): RiotAPI {
  return new RiotAPI(key);
}
