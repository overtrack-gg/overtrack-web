import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://api.overtrack.uint8.me/games';
    private games:Array<PlayerGameList> = null;

    constructor (private http: Http) {}

    getGamesList(): Observable<Response> {
        return this.http.get(this.gamesListUrl, { withCredentials: true});
    }

    toGamesList(res: Response) {
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<GamesListEntry>} = {};
        
        let body = res.json();

        let num = 1;

        for (let game of body.games) {
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

            if (game.duration){
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
                
                gamelist.push({
                    num: num++,
                    error: false,
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
            } else {
                gamelist.push({
                    num: num++,
                    error: true,
                    map: null,
                    result: 'ERROR',
                    srChange: null,
                    srString: null,
                    sr: null,
                    time: new Date(game.time * 1000),
                    startSR: null,
                    player: game.player_name,
                    blueScore: null,
                    redScore: null,
                    duration: null,
                    url: null,
                    key: game.key,
                    heroes: null
                });
            }
        }
        return list;
    }

    fetchGames(games: (value: Array<PlayerGameList>) => void, error: (error: any) => void){
        if (this.games != null){
            games(this.games);
        } else {
            this.getGamesList().subscribe(
                next => {
                    this.games = this.toGamesList(next);
                    games(this.games);
                },
                err => {
                    console.error(err);
                }
            );
        }
    }
}

export class PlayerGameList {
    player: string;
    list: Array<GamesListEntry>;
}

// TODO: Move out into own files
export class GamesListEntry {
    num: number;
    error: boolean;
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

