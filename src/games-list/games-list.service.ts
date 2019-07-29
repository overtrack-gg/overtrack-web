import { Injectable } from '@angular/core';
import { HttpClient, HttpParams  } from '@angular/common/http';
import * as moment from 'moment';

import { Game } from '../game/game.service';

@Injectable()
export class GamesListService {
    private gamesListUrl = 'https://api2.overtrack.gg/overwatch/games';
    private games: Array<PlayerGameList> = null;
    private seasons: Array<string> = null;
    private sharedGames: Map<string, Array<PlayerGameList>> = new Map<string, Array<PlayerGameList>>();

    constructor (private http: HttpClient) {}

    // getSharedGamesList(share_key: string): Observable<Object> {
    //     return this.http.get(this.gamesListUrl + '/' + share_key);
    // }

    wltClass(result: string) {
        if (!result || result === 'UNKN') {
            return 'text-unknown';
        } else if (result === 'DRAW') {
            return 'text-warning';
        } else if (result === 'WIN') {
            return 'text-success';
        } else if (result === 'LOSS') {
            return 'text-danger';
        } else if (result == 'ERROR') {
            return 'text-error';
        }
        throw new Error('Unexpected game result: ' + result);
    }

    formatTime(date: Date) {
        return moment(date).format('LT');
    }
    
    formatDate(date: Date) {
        return moment(date).format('dddd, LL');
    }

    formatDay(date: Date) {
        return moment(date).format('ddd');
    }

    rank(sr: number) {
        if (sr === null || sr == undefined) {
            return 'unknown';
        } else if (sr < 1500) {
            return 'bronze';
        } else if (sr < 2000) {
            return 'silver';
        } else if (sr < 2500) {
            return 'gold';
        } else if (sr < 3000) {
            return 'platinum';
        } else if (sr < 3500) {
            return 'diamond';
        } else if (sr < 4000) {
            return 'master';
        } else {
            return 'grandmaster';
        }
    }

    formatSR(game){
        return game.end_sr || '    ';
    }

    srChange(game){
        let srChange = game.rank == "placement" ? '-' : '?';
        if (game.start_sr && game.end_sr){
            srChange = String(game.end_sr - game.start_sr);
        }
        return srChange;
    }

    toGamesList(body) {
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<Game>} = {};
        
        let num = 1;

        for (let game of body.games) {
            let gamelist: Array<Game> = [];
            let hasSR = true;

            let playerName = game.player_name;
            if (game.custom_game || playerName.indexOf('(Custom Games)') != -1){
                playerName = 'Custom Games';
                hasSR = false;
            } else if (game.game_type == 'ctf'){
                continue;
            } else if (game.game_type == 'quickplay'){
                hasSR = false;
                playerName = 'Quick Play';
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

            let result = game.result == 'UNKNOWN' ? 'UNKN' : game.result;
            let startTime = new Date(game.time * 1000);
            let listView = {
                wltClass: this.wltClass(result),

                formatTime: this.formatTime(startTime),
                formatDay: this.formatDay(startTime),
                formatDate: this.formatDate(startTime),

                rank: this.rank(game.end_sr),
                formatSR: this.formatSR(game),
                srChange: this.srChange(game)
            }

            if (game.duration){
                let heroes: Array<GamesListHero> = [];
                for (let hero of game.heroes_played) {
                    if (hero[1] > 0.15 && heroes.length < 3){
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
                    result: result,
                    role: game.role,
                    hasSR: hasSR,
                    // srChange: srChange,
                    // srString: srString,
                    endSR: game.end_sr,
                    startTime: startTime,
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
                    season: game.season,
                    viewable: game.viewable,
                    gameType: game.game_type,

                    userID: game.user_id,
                    mapType: null,
                    owner: game.player_name,
                    stages: null,
                    killfeedMissing: true,
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
                    endGameStatistics: null,
                    heroPlayed: null,
                    playlists: null,

                    deleted: false,

                    listView: listView
                });
            } else {
                gamelist.push({
                    num: num++,
                    error: true,
                    map: null,
                    result: 'ERROR',
                    role: game.role,
                    endSR: null,
                    startTime: startTime,
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
                    season: game.season,
                    viewable: true,
                    hasSR: false,
                    gameType: null,
                    endGameStatistics: null,
                    heroPlayed: null,

                    userID: game.user_id,
                    mapType: null,
                    owner: game.player_name,
                    stages: null,
                    killfeedMissing: true,
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
                    playlists: null,

                    deleted: false,

                    listView: listView
                });
            }
        }
        return list;
    }

    fetchSharedGames(share_key: string, games: (value: Array<PlayerGameList>, seasons: Array<string>) => void, error: (error: any) => void, seasons?: Array<string>){
        let params = null;
        if (seasons && seasons.length){
            params = {'season': seasons};
        }
        this.http.get(
            this.gamesListUrl + '/' + share_key,
            { 
                params: params,
                responseType: 'json'
            }
        ).subscribe(
            body => {
                let fetchedGames = this.toGamesList(body);
                this.seasons = body['seasons'].reverse();
                this.sharedGames.set(share_key, fetchedGames);
                games(fetchedGames, this.seasons);
            },
            err => {
                error(err);
            }
        );
    }

    fetchGames(games: (games: Array<PlayerGameList>, seasons: Array<string>) => void, error: (error: any) => void, seasons?: Array<string>){
        let params = null;
        if (seasons && seasons.length){
            params = {'season': seasons};
        }
        this.http.get(
            this.gamesListUrl,
            { 
                params: params,
                responseType: 'json',
                withCredentials: true
            }
        ).subscribe(
            body => {
                this.games = this.toGamesList(body);
                this.seasons = body['seasons'].reverse();
                games(this.games, this.seasons);
            },
            err => {
                console.error(err);
            }
        );
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

