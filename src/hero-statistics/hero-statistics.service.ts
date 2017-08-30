import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';

@Injectable()
export class HeroStatisticsService {
    private statsUrl = 'https://api.overtrack.gg/hero_stats';

    constructor (private http: Http) {}

    getStats(share_key? : string): Observable<Response> {
        if (share_key){
            return this.http.get(this.statsUrl + '/' + share_key, { withCredentials: true});
        } else {
            return this.http.get(this.statsUrl, { withCredentials: true});
        }
    }

    toAllTimeStats(res: Response): Array<HeroStatistics> {
        let allTimeStats: Map<string, HeroStatistics> = new Map<string, HeroStatistics>();
        let statsList: Array<HeroStatistics> = [];

        let body = res.json();
        for (let stat of body.stats){
            let key: string = stat.player_name + '-' + stat.hero_name;

            if (!stat.player_name){
                // ignore bad data
                continue;
            }

            if (!allTimeStats.has(key)){
                allTimeStats.set(key, {
                    playerName: stat.player_name,
                    heroName: stat.hero_name,
                    
                    timePlayed: 0,
                    gamesPlayed: 0,
                    gamesWon: 0,
                    
                    elims: 0,
                    damage: 0,
                    objectiveKills: 0,
                    healing: 0,
                    objectiveTime: 0,
                    deaths: 0,
                    heroStat1: 0,
                    heroStat2: 0,
                    heroStat3: 0,
                    heroStat4: 0,
                    heroStat5: 0,
                    heroStat6: 0,

                    playRate: 0
                })
                statsList.push(allTimeStats.get(key));
            }
            
            let heroStat = allTimeStats.get(key);

            heroStat.timePlayed += stat.time_played;
            heroStat.gamesPlayed += stat.games_played;
            heroStat.gamesWon += stat.games_won;

            heroStat.elims += stat.elims;
            heroStat.damage += stat.damage;
            heroStat.objectiveKills += stat.objective_kills;
            heroStat.healing += stat.healing;
            heroStat.objectiveTime += stat.objective_time;
            heroStat.deaths += stat.deaths;
            heroStat.heroStat1 += stat.hero_stat_1;
            heroStat.heroStat2 += stat.hero_stat_2;
            heroStat.heroStat3 += stat.hero_stat_3;
            heroStat.heroStat4 += stat.hero_stat_4;
            heroStat.heroStat5 += stat.hero_stat_5;
            heroStat.heroStat6 += stat.hero_stat_6;
        }
        return statsList;
    }

}
export class HeroStatistics {
    playerName: string;
    heroName: string;

    timePlayed: number;
    gamesPlayed: number;
    gamesWon: number;

    elims: number;
    damage: number;
    objectiveKills: number;
    healing: number;
    objectiveTime: number;
    deaths: number;
    heroStat1: number;
    heroStat2: number;
    heroStat3: number;
    heroStat4: number;
    heroStat5: number;
    heroStat6: number;

    playRate: number;
}