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

    addPlayersToStage(players: Array<Player>, stage: any, killfeed: Array<KillFeedEntry>, team: Array<any>, teamColour: string){
        for (let player of team){
            let heroes: Array<GameHero> = [];
            let events: Array<GameEvent> = []
            let kills = 0;
            let deaths = 0;
            for (let kill of killfeed){
                if (kill.time > stage.end || kill.time < stage.start){
                    // outside of this stage
                    continue;
                }

                // TODO: killicons
                // TODO: death icons

                // heroes played
                let hero: string;
                if (kill.leftPlayer == player.name){
                    kills += 1;
                    hero = kill.leftHero;
                    events.push({
                        time: kill.time - stage.start,
                        type: 'kill'
                    })
                }
                if (kill.rightPlayer == player.name){
                    hero = kill.rightHero;

                     // only count as a death if there was a hero - name only means turret/metch/tp/etc.
                    if (hero){
                        deaths += 1;
                        events.push({
                            time: kill.time - stage.start,
                            type: 'death'
                        })
                    }
                }
                if (!hero){
                    continue;
                }
                if (heroes.length == 0){
                    // no known hero yet, so assume the first hero seen has been played from the start
                    heroes.push({
                        name: hero,
                        start: 0,
                        end: kill.time - stage.start
                    });
                } else if (heroes[heroes.length - 1].name == hero) {
                    // if the new hero is the same as the last then extend that one on
                    heroes[heroes.length - 1].end = kill.time - stage.start;
                } else {
                    // once we see a new hero add this to the list
                    heroes.push({
                        name: hero,
                        start: heroes[heroes.length - 1].end,
                        end: kill.time - stage.start
                    });
                }
            }

            // extend all heroes on to the end of the stage
            if (heroes.length){
                heroes[heroes.length - 1].end = stage.end - stage.start;
            } else {
                heroes.push({
                    name: 'unknown',
                    start: stage.start,
                    end: stage.end
                });
            }
            
            players.push({
                name: player.name,
                kills: kills,
                deaths: deaths,
                events: events,
                heroesPlayed: heroes,
                colour: teamColour
            });
        }
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

        let objective_stages = body.objective_stages;
        if (!objective_stages){
            objective_stages = [{
                stage: 'Combined',
                start: 0,
                end: body.game_duration * 1000
            }];
        }

        let stages: Array<Stage> = [];
        for (let stage of objective_stages){
            let players: Array<Player> = [];
            this.addPlayersToStage(players, stage, killfeed, body.teams.blue, 'blue')
            this.addPlayersToStage(players, stage, killfeed, body.teams.red, 'red')

            let objectiveInfo: ObjectiveInfo;
            if (body.map_type == 'KOTH'){
                let ownership: Array<KothOwnership> = [];
                ownership.push({
                    start: stage.start,
                    end: stage.end,
                    team: 'none'
                })
                for (let owner of stage.ownership){
                    ownership[ownership.length - 1].end = owner.start;
                    ownership.push({
                        start: owner.start,
                        end: stage.end,
                        team: owner.owner
                    })
                }

                // TODO: if the winner of this round (no way to get this data currently) was not the last seen owner add a small ownership to the winner at the end
                // This can occur if a team caps the point on 99% and the recorder does not capture this
                objectiveInfo = {
                    ownership: ownership
                }
            } else {
                objectiveInfo = {
                }
            }

            stages.push({
                name: stage.stage,
                start: stage.start,
                end: stage.end,
                players: players,
                objectiveInfo: objectiveInfo
            })
        }

        return {
            map: body.map,
            deaths: body.deaths,
            startTime: body.game_started,
            player: body.player,
            key: body.key,
            owner: body.owner,
            stages: stages,
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
    stages: Array<Stage>;
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

export class Stage {
    name: string;
    start: number;
    end: number;
    players: Array<Player>;
    objectiveInfo: ObjectiveInfo;
}

export interface ObjectiveInfo {
}

export class KOTHObjectiveInfo implements ObjectiveInfo {
    ownership: Array<KothOwnership>; 
}

export class KothOwnership {
    start: number;
    end: number;
    team: string;
}

export class Player {
    name: string;
    colour: string;
    kills: number;
    deaths: number;
    events: Array<GameEvent>;
    heroesPlayed: Array<GameHero>;
}

export class GameHero {
    name: string;
    start: number;
    end: number;
}

export class GameEvent {
    time: number;
    type: string;
}
