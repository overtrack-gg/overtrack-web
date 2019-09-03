import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class HeroStatisticsService {
    private statsUrl = 'https://api2.overtrack.gg/overwatch/hero_statistics';
    //private statsUrl = 'http://localhost:5001/overwatch/hero_statistics';

    constructor (private http: Http) {}

    getStats(): Observable<HeroStatistics> {
        return this.http.get(this.statsUrl, {withCredentials: true}).pipe(map(
            res => <HeroStatistics>res.json()
        ));
    }

}

export class HeroStatistic {
    account: string;
    endgame_only: boolean;
    hero: string;
    hero_name: string;
    is_role: boolean;
    mode: string;

    statistics: {
        time_played: number

        games: number
        wins: number

        eliminations: number
        objective_kills: number
        objective_time: number
        hero_damage_done: number
        healing_done: number
        deaths: number
        final_blows: number

        hero_specific_stats: object
    }
}

export class HeroStatistics {
    accounts: Array<string>
    heroes: Map<string, Array<string>>
    modes: Array<string>
    season: string

    hero_statistics: Array<HeroStatistic>
}
