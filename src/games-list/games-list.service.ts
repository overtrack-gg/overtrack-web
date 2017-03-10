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

        console.log(body);
        for (let game of body.games) {
            let heroes: Array<GamesListHero> = [];
            for (let hero of game.heroes_played) {
                heroes.push({
                    name: hero[0],
                    percentagePlayed: hero[1]
                });
            }

            let srChange = '?';
            if (game.start_sr && game.end_sr){
                srChange = String(game.end_sr - game.start_sr);
            } 

            let srString = '?';
            if (game.end_sr != null){
                srString = String(game.end_sr);
            }

            let blueScore: number = null;
            let redScore: number = null;
            if (game.score){
                blueScore = game.score[0];
                redScore = game.score[1];
            }

            list.push({
                num: num++,
                map: game.map,
                result: game.result == 'UNKNOWN' ? 'UNKN' : game.result,
                srChange: srChange,
                srString: srString,
                sr: game.end_sr,
                blueScore: blueScore,
                redScore: redScore,
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
