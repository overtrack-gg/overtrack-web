import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class GameService {
    private gameUrl = 'https://s3-us-west-2.amazonaws.com/overtrack-parsed-games/';


    constructor (private http: Http) {}

    getGame(id: string): Observable<Response> {
        return this.http.get(this.gameUrl + id + '/game.json');
    }

    loadTeam(team: Array<any>, killfeed: Array<KillFeedEntry>): Array<Player>{
        let retTeam: Array<Player> = [];
        for (let player of team){
            let heroes: Array<GameHero> = [];
            for (let hero of player.heroes) {
                heroes.push({
                    name: hero.hero,
                    timePlayed: hero.end - hero.start
                });
            }
            retTeam.push({
                name: player.name,
                kills: Math.floor(Math.random() * 20) + 1  ,
                deaths: Math.floor(Math.random() * 20) + 1  ,
                heroesPlayed: heroes
            });
        } 
        return retTeam;
    }

    toGame(res: Response): Game {
        let body = res.json();

        let killfeed: Array<KillFeedEntry> = [];
        for (let kill of body.killfeed) {
            killfeed.push({
                time: kill[0],
                isLeftRed: !kill[1],
                leftHero: kill[2],
                leftPlayer: kill[3],
                rightHero: kill[4],
                rightPlayer: kill[5]
            });
        }

        let blueTeam = this.loadTeam(body.teams.blue, killfeed);
        let redTeam = this.loadTeam(body.teams.red, killfeed);

        return {
            map: body.map,
            deaths: body.deaths,
            startTime: body.game_started,
            player: body.player,
            key: body.key,
            owner: body.owner,
            blueTeam: blueTeam,
            redTeam: redTeam,
            killfeed: killfeed,
            endTime: body.game_ended,
            duration: body.game_duration
        };
    }
}

export class Game {
    map: string;
    deaths: number;
    startTime: number;
    player: string;
    key: string;
    owner: string;
    blueTeam: Array<Player>;
    redTeam: Array<Player>;
    killfeed: Array<KillFeedEntry>;
    endTime: number;
    duration: number;
}

export class KillFeedEntry {
    time: number;
    isLeftRed: boolean;
    leftHero: string;
    leftPlayer: string;
    rightHero: string;
    rightPlayer: string;
}

export class Player {
    name: string;
    kills: number;
    deaths: number;
    heroesPlayed: Array<GameHero>;
}

export class GameHero {
    name: string;
    timePlayed: number;
}
