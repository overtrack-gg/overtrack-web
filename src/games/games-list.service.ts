import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://1hb0qu4vxl.execute-api.us-west-2.amazonaws.com/dev/games';

    constructor (private http: Http) {}

    getGamesList(): Observable<Response> {
        return this.http.get(this.gamesListUrl, { withCredentials: true});
    }

    toGamesList(res: Response) {
        let list: Array<GamesListEntry> = [];
        let body = res.json();

        // TODO: Remove once has real sr is available
        let sr = Math.round(Math.random() * 3100 + 1000);
        let num = 1;

        for (let game of body.games) {
            let heroes: Array<GamesListHero> = [];
            for (let hero of game.heroes_played) {
                heroes.push({
                    name: hero[0],
                    percentagePlayed: hero[1]
                });
            }

            // TODO: Remove once real wlt info available
            let srChange = Math.round(Math.random() * 100 - 50);
            sr += srChange;

            list.push({
                num: num++,
                map: game.map,
                srChange: srChange,
                sr: sr,
                blueScore: Math.round(Math.random() * 3),
                redScore: Math.round(Math.random() * 3),
                duration: game.duration,
                url: game.url,
                key: game.key,
                heroes: heroes
            });
        }
        return list;
    }
}

// TODO: Move out into own files
export class GamesListEntry {
    num: number;
    map: string;
    srChange: number;
    sr: number;
    blueScore: number;
    redScore: number;
    duration: number;
    heroes: Array<GamesListHero>;
    url: string;
    key: string;
}

export class GamesListHero {
    name: string;
    percentagePlayed: number;
}
