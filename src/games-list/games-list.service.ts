import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://api.overtrack.uint8.me/dev/games';

    constructor (private http: Http) {}

    getGamesList(): Observable<Response> {
        return this.http.get(this.gamesListUrl, { withCredentials: true});
    }

    toKnownRankings(list: Array<GamesListEntry>, user: User) {
        let rankings: GamesListRankings = {
            current: null,
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE,
            avg: 0
        }
        let total: number = 0;
        for (let game of list) {
            const player: string = game.key.split('/')[0].replace('-', '#');
            if (user.battletag === player && game.sr !== null) {
                if (rankings.current === null) {
                    rankings.current = game.sr;
                }
                if (rankings.min > game.sr) {
                    rankings.min = game.sr;
                }
                if (rankings.max < game.sr) {
                    rankings.max = game.sr;
                }
                rankings.avg += game.sr;
                ++total;
            }
        }
        if (total > 0) {
            rankings.avg = rankings.avg / total;
        }
        return rankings;
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
                player: game.player_name,
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
    player: string;
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

export class GamesListRankings {
    current: number;
    min: number;
    max: number;
    avg: number;
}
