import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class GameService {
    private gameUrl = 'https://s3-us-west-2.amazonaws.com/overtrack-parsed-games/';
    private metaUrl = 'https://api.overtrack.uint8.me/game_metadata?game_id=';

    constructor (private http: Http) {}

    getGame(id: string): Observable<Response> {
        return this.http.get(this.gameUrl + id + '/game.json');
    }

    getMetaGame(id: string): Observable<Response> {
        return this.http.get(this.metaUrl + id, { withCredentials: true});
    }


    addPlayersToStage(players: Array<Player>, stage: any, killfeed: Array<KillFeedEntry>, team: Array<any>, teamColour: string) {
        for (const player of team) {
            const heroes: Array<GameHero> = [];
            const events: Array<GameEvent> = [];
            let kills = 0;
            let deaths = 0;
            for (const kill of killfeed) {
                if (kill.time > stage.end || kill.time < stage.start) {
                    // outside of this stage
                    continue;
                }

                // heroes played
                let hero: string;
                if (kill.leftPlayer === player.name) {
                    if (kill.leftHero.indexOf('_') == -1){
                        // kill is by a hero instead of e.g. torb_turret
                        // this is _not_ who we are playing so ignore
                        hero = kill.leftHero;
                    }
                    if (kill.rightPlayer && kill.rightHero.indexOf('_') == -1){
                        // kill on a real player instead of a turret/metch/tp/etc.
                        kills += 1;                    
                        events.push({
                            time: kill.time - stage.start,
                            type: 'kill',
                            otherHero: kill.rightHero
                        });
                    } else {
                        events.push({
                            time: kill.time - stage.start,
                            type: 'destruction',
                            otherHero: kill.rightHero
                        });
                    }
                }
                if (kill.rightPlayer === player.name) {
                    if (kill.rightHero.indexOf('_') == -1){
                        // kill is on `player`'s hero instead of e.g. their turret (torb_turret)
                        hero = kill.rightHero;
                        
                        deaths += 1;
                        events.push({
                            time: kill.time - stage.start,
                            type: 'death',
                            otherHero: kill.leftHero
                        });
                    } else {
                        events.push({
                            time: kill.time - stage.start,
                            type: 'destroyed',
                            otherHero: kill.rightHero
                        });
                    }
                }
                if (hero) {
                    if (heroes.length === 0) {
                        // no known hero yet, so assume the first hero seen has been played from the start
                        heroes.push({
                            name: hero,
                            start: 0,
                            end: kill.time - stage.start
                        });
                    } else if (heroes[heroes.length - 1].name === hero) {
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
            }

            // extend all heroes on to the end of the stage
            if (heroes.length) {
                heroes[heroes.length - 1].end = stage.end - stage.start;
            } else {
                heroes.push({
                    name: 'unknown',
                    start: 0,
                    end: stage.end - stage.start
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

    addAssists(player: Player, assists: Array<any>, stage: any){
        if (!assists){
            return;
        }
        for (let assist of assists){
            if (stage.start < assist[0] && assist[0] < stage.end) {
                player.events.push({
                    time: assist[0] - stage.start,
                    type: assist[3] ? 'support-assist' : 'assist',
                    otherHero: null // TODO
                })
            }
        }
    }

    toGame(res: Response): Game {
        const body = res.json();
        console.log(body);

        const killfeed: Array<KillFeedEntry> = [];
        for (const kill of body.killfeed) {
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
        if (!objective_stages) {
            objective_stages = [{
                stage: 'Combined',
                start: 0,
                end: body.game_duration * 1000
            }];
        }

        const stages: Array<Stage> = [];
        let index = 0;
        for (const stage of objective_stages){
            const players: Array<Player> = [];
            this.addPlayersToStage(players, stage, killfeed, body.teams.blue, 'blue');
            this.addPlayersToStage(players, stage, killfeed, body.teams.red, 'red');

            this.addAssists(players[0], body.assists, stage);

            let objectiveInfo: ObjectiveInfo;
            if (body.map_type === 'KOTH') {
                const ownership: Array<KothOwnership> = [];
                ownership.push({
                    start: stage.start,
                    end: stage.end,
                    team: 'none'
                });
                for (const owner of stage.ownership) {
                    ownership[ownership.length - 1].end = owner.start;
                    ownership.push({
                        start: owner.start,
                        end: stage.end,
                        team: owner.owner
                    });
                }

                objectiveInfo = {
                    ownership: ownership
                };
            } else if (stage.checkpoints) {
                const checkpoints: Array<PayloadCheckpoint> = [];
                for (const checkpoint of stage.checkpoints){
                    checkpoints.push({
                        time: checkpoint[0] - stage.start,
                        checkpoint: checkpoint[1],
                        team: stage.stage == 'Attack' ? 'blue' : 'red'
                    })
                }
                objectiveInfo = {
                    checkpoints: checkpoints
                };
            } else {
                objectiveInfo = {};
            }

            stages.push({
                name: stage.stage,
                index: index++,
                start: stage.start,
                end: stage.end,
                players: players,
                objectiveInfo: objectiveInfo
            });
        }

        console.log(stages);

        return {
            map: body.map,
            mapType: body.map_type,
            blueScore: body.score ? body.score[0] : null,
            redScore: body.score ? body.score[1] : null,
            result: body.result === 'UNKNOWN' ? 'UNKN' : body.result,
            deaths: body.deaths,
            startTime: body.game_started,
            player: body.player,
            key: body.key,
            owner: body.owner,
            stages: stages,
            killfeed: killfeed,
            endTime: body.game_ended,
            duration: body.game_duration,
            tabStatistics: body.tab_statistics
        };
    }
}

export class Game {
    map: string;
    mapType: string;
    result: string;
    deaths: number;
    startTime: number;
    redScore: number;
    blueScore: number;
    player: string;
    key: string;
    owner: string;
    stages: Array<Stage>;
    killfeed: Array<KillFeedEntry>;
    endTime: number;
    duration: number;
    tabStatistics: any;
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
    index: number;
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

export class PayloadObjectiveInfo implements ObjectiveInfo{
    checkpoints: Array<PayloadCheckpoint>;
}

export class PayloadCheckpoint {
    time: number;
    checkpoint: number;
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
    otherHero: string;
}
