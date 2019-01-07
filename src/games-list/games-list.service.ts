import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs';

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
        let hour = date.getHours();
        const pm = hour > 11;
        hour = hour % 12;
        hour = hour === 0 ? 12 : hour;
        let min: number|string = date.getMinutes();
        if (min < 10){
            min = '0' + min;
        }
        return hour + ':' + min + (pm ? 'pm' : 'am');
    }
    
    formatDate(date: Date) {
        return date.toLocaleDateString(undefined, {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric'

        });
    }

    formatDay(date: Date) {
        var days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
        return days[date.getDay()]
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

    toGamesList(res: Response) {
        let list: Array<PlayerGameList> = [];
        let map: { [id: string]: Array<Game>} = {};
        
        let body = res.json();

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
                    result: result,
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
                    season: this.getSeason(game.time),
                    viewable: true,
                    hasSR: false,
                    gameType: null,
                    endGameStatistics: null,
                    heroPlayed: null,

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
                    playlists: null,

                    deleted: false,

                    listView: listView
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
        } else if (time < 1530144600){
            return 'Season 10';
        } else if (time < 1530403170){
            return 'Season 10-11 Off Season';
        } else if (time < 1535501400){
            return 'Season 11';
        } else if (time < 1535759970){
            return 'Season 11-12 Off Season';
        } else if (time < 1540768200) {
            return 'Season 12';
        } else if (time < 1541026770) {
            return 'Season 12-13 Off Season';
        } else if (time < 1546293600){
            return 'Season 13';
        } else if (time < 1546300800){
            return 'Season 13-14 Off Season';
        } else {
            return 'Season 14';
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

