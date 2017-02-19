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

        let num = 1;

        for (let game of body.games) {
            let heroes: Array<GamesListHero> = [];
            for (let hero of game.heroes_played) {
                heroes.push({
                    name: hero[0],
                    percentagePlayed: hero[1]
                });
            }

            let srString = "?";
            let srChange = "?";
            if (game.result != 'UNKNOWN'){
                srChange = String(game.end_sr - game.start_sr);
            } 
            if (game.end_sr != null){
                srString = String(game.end_sr);
            }

            list.push({
                num: num++,
                map: game.map,
                result: game.result == 'UNKNOWN' ? 'UNKN' : game.result,
                srChange: srChange,
                srString: srString,
                sr: game.end_sr,
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
    result: string;
    srChange: string;
    srString: string;
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
