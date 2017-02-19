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

    loadTeam(team: Array<any>, heroesPlayed: {[key: string]: Array<GameHero>}): Array<string>{
        let teamNames: Array<string> = [];
        for (let player of team){
            let heroes: Array<GameHero> = [];
            for (let hero of player.heroes) {
                heroes.push({
                    name: hero.hero,
                    timePlayed: hero.end - hero.start
                });
            }
            heroesPlayed[player.name] = heroes;
            teamNames.push(player.name);
        } 
        return teamNames;
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

        let heroesPlayed: {[key: string]: Array<GameHero>} = {};
        let blueTeam = this.loadTeam(body.teams.blue, heroesPlayed);
        let redTeam = this.loadTeam(body.teams.red, heroesPlayed);

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
            heroesPlayed: heroesPlayed,
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
    blueTeam: Array<string>;
    redTeam: Array<string>;
    killfeed: Array<KillFeedEntry>;
    endTime: number;
    heroesPlayed: {[key: string]: Array<GameHero>};
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

export class GameHero {
    name: string;
    timePlayed: number;
}
