import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://api.overtrack.gg/games';
    private games:Array<PlayerGameList> = null;
    private sharedGames: Map<string, Array<PlayerGameList>> = new Map<string, Array<PlayerGameList>>();

    constructor (private http: Http) {}

    getGamesList(): Observable<Response> {
        return this.http.get(this.gamesListUrl, { withCredentials: true});
    }

    getSharedGamesList(share_key: string): Observable<Response> {
        return this.http.get(this.gamesListUrl + '/' + share_key, { withCredentials: true});
    }

    toGamesList(res: Response) {
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<GamesListEntry>} = {};
        
        let body = res.json();

        let num = 1;

        for (let game of body.games) {
            let gamelist = [];

            let playerName = game.player_name;
            if (game.custom_game || playerName.indexOf('(Custom Games)') != -1){
                playerName = 'Custom Games';
            }
            
            if (map[playerName]) {
                gamelist = map[playerName];
            } else {
                map[playerName] = gamelist;
                list.push({
                    player: playerName,
                    user_id: game.user_id,
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

                let srChange = game.rank == "placement" ? '-' : '?';
                if (game.start_sr && game.end_sr){
                    srChange = String(game.end_sr - game.start_sr);
                }

                let srString = '    ';
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
                    heroes: heroes,
                    rank: game.rank,
                    customGame: game.custom_game
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
                    heroes: null,
                    rank: null,
                    custom_game: false
                });
            }
        }
        return list;
    }

    fetchSharedGames(share_key: string, games: (value: Array<PlayerGameList>) => void, error: (error: any) => void){
        if (this.sharedGames.get(share_key) != null){
            games(this.sharedGames.get(share_key));
        } else {
            this.getSharedGamesList(share_key).subscribe(
                next => {
                    let fetchedGames = this.toGamesList(next);
                    this.sharedGames.set(share_key, fetchedGames);
                    games(fetchedGames);
                },
                err => {
                    error(err);
                }
            );
        }
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
    user_id: number;
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
    rank: string;
    customGame: boolean;
}

export class GamesListHero {
    name: string;
    percentagePlayed: number;
}

