import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

import { User } from '../login/user-login.service';
import { Game } from '../game/game.service';

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
        return this.http.get(this.gamesListUrl + '/' + share_key);
    }

    toGamesList(res: Response) {
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<Game>} = {};
        
        let body = res.json();

        let num = 1;

        for (let game of body.games) {
            let gamelist: Array<Game> = [];

            let playerName = game.player_name;
            if (game.custom_game || playerName.indexOf('(Custom Games)') != -1){
                playerName = 'Custom Games';
            } else if (game.game_type == 'ctf'){
                playerName = playerName + ' (CTF)';
                continue;
            }
            
            if (map[playerName]) {
                gamelist = map[playerName];
            } else {
                map[playerName] = gamelist;
                list.push({
                    player: playerName,
                    user_id: game.user_id,
                    list: gamelist,
                    customGames: game.custom_game
                });
            }

            if (game.duration){
                let heroes: Array<GamesListHero> = [];
                for (let hero of game.heroes_played) {
                    if (hero[1] > 0.15){
                        heroes.push({
                            name: hero[0],
                            percentagePlayed: hero[1]
                        });
                    }
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
                    // srChange: srChange,
                    // srString: srString,
                    endSR: game.end_sr,
                    startTime: new Date(game.time * 1000),
                    startSR: game.start_sr,
                    player: game.player_name,
                    blueScore: blueScore,
                    redScore: redScore,
                    duration: game.duration,
                    url: game.url,
                    key: game.key,
                    heroes: heroes,
                    rank: game.rank,
                    customGame: game.custom_game,
                    season: this.getSeason(game.time),
                    viewable: game.viewable,
                    gameType: game.game_type,

                    userID: game.user_id,
                    mapType: null,
                    owner: game.player_name,
                    stages: null,
                    killfeed: null,
                    endTime: null,
                    tabStatistics: null,
                    heroStatistics: null,
                    startSREditable: true,
                    endSREditable: true,
                    teams: null,
                    placement: false,
                    rankEditable: false,
                    groupSize: null,
                    twitch: null,

                    deleted: false
                });
            } else {
                gamelist.push({
                    num: num++,
                    error: true,
                    map: null,
                    result: 'ERROR',
                    endSR: null,
                    startTime: new Date(game.time * 1000),
                    startSR: null,
                    player: game.player_name,
                    blueScore: null,
                    redScore: null,
                    duration: null,
                    url: null,
                    key: game.key,
                    heroes: null,
                    rank: null,
                    customGame: false,
                    season: this.getSeason(game.time),
                    viewable: true,
                    gameType: null,

                    userID: game.user_id,
                    mapType: null,
                    owner: game.player_name,
                    stages: null,
                    killfeed: null,
                    endTime: null,
                    tabStatistics: null,
                    heroStatistics: null,
                    startSREditable: true,
                    endSREditable: true,
                    teams: null,
                    placement: false,
                    rankEditable: false,
                    groupSize: null,
                    twitch: null,

                    deleted: false
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

    getSeason(time: number){
        if (time < 1488193200){ // 28 Feb 2017
            return 'Season 3-4 Off Season';
        } else if (time < 1496059200){ // 28 May 
            return 'Season 4';
        } else if (time < 1496275199){ // 1 June 2017
            return 'Season 4-5 Off Season';
        } else if (time < 1503964799){ // 29 August 2017
            return 'Season 5';
        } else if (time < 1504224000){
            return 'Season 5-6 Off Season';
        } else if (time < 1509237000) { // October 29, 2017 @ 12:30:00 am UTC
            return 'Season 6';
        } else if (time < 1509494400){
            return 'Season 6-7 Off Season';
        } else if (time < 1514458800 ) {
            return 'Season 7';
        } else if (time < 1514764800 ){
            return 'Season 7-8 Off Season';
        } else if (time < 1519556400){
            return 'Season 8';
        } else if (time < 1519862400){
            return 'Season 8-9 Off Season';
        } else if (time < 1524875400){
            return 'Season 9';
        } else if (time < 1525132800){
            return 'Season 9-10 Off Season';
        } else {
            return 'Season 10';
        }
    }

}

export class PlayerGameList {
    player: string;
    user_id: number;
    list: Array<Game>;
    customGames: boolean;
}

// // TODO: Move out into own files
// export class GamesListEntry {
//     num: number;
//     error: boolean;
//     map: string;
//     result: string;
//     srChange: string;
//     srString: string;
//     startSR: number;
//     time: Date;
//     sr: number;
//     player: string;
//     blueScore: number;
//     redScore: number;
//     duration: number;
//     heroes: Array<GamesListHero>;
//     url: string;
//     key: string;
//     rank: string;
//     customGame: boolean;
//     season: string;
//     viewable: boolean;
// }

export class GamesListHero {
    name: string;
    percentagePlayed: number;
}

