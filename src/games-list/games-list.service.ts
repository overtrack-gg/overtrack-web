import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://api.overtrack.uint8.me/games';

    constructor (private http: Http) {}

    getGamesList(): Observable<Response> {
        return this.http.get(this.gamesListUrl, { withCredentials: true});
    }

    toKnownRankings(playerList: Array<PlayerGameList>, user: User) {
        const rankings: GamesListRankings = {
            current: null,
            min: Number.MAX_VALUE,
            max: Number.MIN_VALUE,
            avg: 0
        };
        const playerName = user.battletag.split('#')[0].split('0').join('O').toUpperCase();
        let list = [];
        for (const playerGame of playerList) {
            if (playerGame.player === playerName) {
                list = playerGame.list;
            }
        }

        let total = 0;
        for (const game of list) {
            if (game.sr !== null) {
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
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<GamesListEntry>} = {};
        
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
            
            let gamelist = [];
            if (map[game.player_name]) {
                gamelist = map[game.player_name];
            } else {
                map[game.player_name] = gamelist;
                list.push({
                    player: game.player_name,
                    list: gamelist
                });
            }

            gamelist.push({
                num: num++,
                map: game.map,
                result: game.result == 'UNKNOWN' ? 'UNKN' : game.result,
                srChange: srChange,
                srString: srString,
                sr: game.end_sr,
                time: new Date(game.time * 1000),
                startSR: game.start_sr,
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

export class PlayerGameList {
    player: string;
    list: Array<GamesListEntry>;
}

// TODO: Move out into own files
export class GamesListEntry {
    num: number;
    map: string;
    result: string;
    srChange: string;
    srString: string;
    startSR: number;
    time: Date;
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
