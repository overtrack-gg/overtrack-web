import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';

@Injectable()
export class GameService {
    private gameUrl = 'https://overtrack-parsed-games.s3.amazonaws.com/';
    private metaUrl = 'https://api.overtrack.gg/game_metadata?game_id=';

    constructor (private http: Http) {}

    getGame(id: string): Observable<Response> {
        return this.http.get(this.gameUrl + id + '/game.json');
    }

    getMetaGame(id: string): Observable<Response> {
        return this.http.get(this.metaUrl + id, { withCredentials: true});
    }


    addPlayersToStage(players: Array<Player>, stage: any, killfeed: Array<KillFeedEntry>, team: Array<any>, teamColour: string, tab?: any) {
        let isPlayer = !!tab;
        for (const player of team) {
            const heroes: Array<GameHero> = [];
            const events: Array<GameEvent> = [];
            let kills = 0;
            let deaths = 0;

            class TabPress {
                time: number;
                hero: string;
            }
            let killfeedAndTab: Array<KillFeedEntry | TabPress> = [];
            killfeedAndTab = killfeedAndTab.concat(killfeed);
            if (isPlayer){
                for (let i in tab.time){
                    killfeedAndTab.push({
                        time: tab.time[i],
                        hero: tab.hero[i]
                    })
                }
                killfeedAndTab = killfeedAndTab.sort((a, b) => a.time - b.time);
                isPlayer = false;
            }

            for (const event of killfeedAndTab) {
                if (event.time > stage.end || event.time < stage.start) {
                    // outside of this stage
                    continue;
                }

                // heroes played
                let hero: string;
                if ('hero' in event){
                    let tabPress = <TabPress> event;
                    hero = tabPress.hero;
                } else {
                    let kill = <KillFeedEntry> event;
                    if (kill.leftPlayer === player.name) {
                        if (kill.isRes){
                            // we don't display anything on the Mercy's timeline, but this can be used to check their player
                            hero = kill.leftHero;
                        } else {
                            if (kill.leftHero){
                                if (kill.leftHero.indexOf('_') == -1){
                                    hero = kill.leftHero;
                                } else {
                                    hero = kill.leftHero.split('_')[0];
                                }
                            }
                            if (kill.rightHero) {
                                if (kill.rightHero && kill.rightHero.indexOf('_') == -1){
                                    // kill on a real player instead of a turret/metch/tp/etc.
                                    kills += 1;                    
                                    events.push({
                                        id: kill.id,
                                        absoluteTime: kill.time,
                                        time: kill.time - stage.start,
                                        type: 'kill',
                                        otherHero: kill.rightHero,
                                        other: kill.rightPlayer
                                    });
                                } else {
                                    events.push({
                                        id: kill.id,
                                        absoluteTime: kill.time,
                                        time: kill.time - stage.start,
                                        type: 'destruction',
                                        otherHero: kill.rightHero,
                                        other: kill.rightPlayer
                                    });
                                }
                            }
                        }
                    }
                    if (kill.rightPlayer === player.name) {
                        if (kill.isRes){
                            hero = kill.rightHero;

                            events.push({
                                id: kill.id,
                                absoluteTime: kill.time,
                                time: kill.time - stage.start,
                                type: 'resurrect',
                                otherHero: kill.leftHero,
                                other: kill.rightPlayer
                            });
                        } else { 
                            if (kill.rightHero) {
                                if (kill.rightHero.indexOf('_') == -1){
                                    // kill is on `player`'s hero instead of e.g. their turret (torb_turret)
                                    hero = kill.rightHero;
                                    
                                    deaths += 1;
                                    events.push({
                                        id: kill.id,
                                        absoluteTime: kill.time,
                                        time: kill.time - stage.start,
                                        type: 'death',
                                        otherHero: kill.leftHero,
                                        other: kill.rightPlayer
                                    });
                                } else {
                                    hero = kill.rightHero.split('_')[0];
                                    events.push({
                                        id: kill.id,
                                        absoluteTime: kill.time,
                                        time: kill.time - stage.start,
                                        type: 'destroyed',
                                        otherHero: kill.rightHero,
                                        other: kill.rightPlayer
                                    });
                                }
                            }
                        }
                    }
                }
                if (hero) {
                    if (heroes.length === 0) {
                        // no known hero yet, so assume the first hero seen has been played from the start
                        heroes.push({
                            name: hero,
                            start: 0,
                            end: event.time - stage.start
                        });
                    } else if (heroes[heroes.length - 1].name === hero) {
                        // if the new hero is the same as the last then extend that one on
                        heroes[heroes.length - 1].end = (event.time - stage.start) + 2 * 1000;
                    } else {
                        // once we see a new hero add this to the list
                        heroes.push({
                            name: hero,
                            start: heroes[heroes.length - 1].end,
                            end: event.time - stage.start
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
        let count = 0; //Make id for these events not overlap
        for (let assist of assists){
            if (stage.start < assist[0] && assist[0] < stage.end) {
                player.events.push({
                    id: "event-assist" + count, //TODO: Pair up with killfeed event somehow
                    absoluteTime: assist[0],
                    time: assist[0] - stage.start,
                    type: assist[3] ? 'support-assist' : 'assist',
                    otherHero: null, // TODO
                    other: assist[1]
                })
            }
            ++count;
        }
    }
    
    addKillfeedAssists(players: Array<Player>, stage: any, killfeed: Array<KillFeedEntry>){
         for (const kill of killfeed) {
            if (kill.time > stage.end || kill.time < stage.start) {
                // outside of this stage
                continue;
            }
            let time = kill.time - stage.start;

            let teamToCheck: string;
            if (kill.isLeftRed){
                // look for red assisters
                teamToCheck = 'red';
            } else {
                teamToCheck = 'blue';
            }
            if (kill.assists){
                for (let assist of kill.assists){
                    let assister: Player;
                    let bestAssisterDistance: number = Infinity;
                    for (let player of players){
                        if (player.colour == teamToCheck){
                            for (let hero of player.heroesPlayed){
                                if (hero.name == assist && hero.start < time && time < hero.end){
                                    let assisterDistance = time - hero.start;
                                    // choose the player which most recently switched to the hero we see in the assist
                                    if (assisterDistance < bestAssisterDistance){
                                        bestAssisterDistance = assisterDistance;
                                        assister = player;
                                    }
                                }
                            }
                        }
                    }
                    if (assister){
                        assister.events.push({
                            id: kill.id,
                            absoluteTime: kill.time,
                            time: time,
                            type: 'ability-assist',
                            otherHero: kill.rightHero,
                            other: kill.rightPlayer
                        })
                    } else {
                        console.warn('Could not find player assisting as', assist, 'for kill at', kill.time);
                    }
                }
            }

         }
    }
            
    filterKillfeed(stage: any, killfeed: Array<KillFeedEntry>): Array<KillFeedEntry> {
        let kf: Array<KillFeedEntry> = [];
        for (const event of killfeed) {
            if (event.time > stage.end || event.time < stage.start) {
                // outside of this stage
                continue;
            }
            kf.push(event);
        }   
        return kf;
    }

    toGame(res: Response): Game {
        const body = res.json();
        console.log(body);

        let count = 1;
        const killfeed: Array<KillFeedEntry> = [];
        let resMap: Map<number, string> = new Map();
        for (const kill of body.killfeed) {
            //Make reses use the same id if same time. TODO: Ensure res for same team!
            const isRes = (kill[1] & 2) != 0;
            let id = "event" + count;
            if (isRes) {
                if (resMap.has(kill[0])) {
                    id = resMap.get(kill[0]);
                } else{
                    resMap.set(kill[0], id);
                }
            }

            if (body.rename){
                let originalName: string = body.rename[0];
                let newName: string = body.rename[1];
                if (kill[3] == originalName){
                    kill[3] = newName;
                }
                if (kill[5] == originalName){
                    kill[5] = newName;
                }
            }
            
            killfeed.push({
                id         : id, 
                time       : kill[0],
                isLeftRed  : !(kill[1] & 1),
                isRes      : isRes,
                leftHero   : kill[2],
                leftPlayer : kill[3],
                rightHero  : kill[4],
                rightPlayer: kill[5],
                assists    : kill[6],
                ability    : kill[7]
            });
            ++count;
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
            this.addPlayersToStage(players, stage, killfeed, body.teams.blue, 'blue', body.tab_statistics);
            this.addPlayersToStage(players, stage, killfeed, body.teams.red, 'red');

            this.addAssists(players[0], body.assists, stage);
            this.addKillfeedAssists(players, stage, killfeed);

            let objectiveInfo: ObjectiveInfo;
            if (body.map_type === 'KOTH' || body.map_type == 'Control') {
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

            let progress: number = null;
            let formatProgress: string = null;
            if (stage.format_progress){
                progress = stage.progress;
                formatProgress = stage.format_progress;
            }
            if (stage.checkpoints && stage.checkpoints.length && stage.end - stage.checkpoints[stage.checkpoints.length - 1][0] < 10 * 1000) { // && progress == 0){
                // final progress is within 10s of a checkpoint and the progress here was 0 - this means the previous team was beaten and the progress is set back to 0
                formatProgress = "";
            }

            stages.push({
                name: stage.stage,
                index: index++,
                start: stage.start,
                killfeed: this.filterKillfeed(stage, killfeed),
                end: stage.end,
                players: players,
                objectiveInfo: objectiveInfo,

                progress: progress,
                formatProgress: formatProgress,
                events: stage.events
            });
        }

        let heroStatistics: Array<HeroStatistics> = [];
        for (let heroName of Object.keys(body.hero_statistics)){
            let stat = body.hero_statistics[heroName];
            heroStatistics.push({
                heroName: heroName,
                timePlayed: stat.time_played,

                elims: stat.elims,
                damage: stat.damage,
                objectiveKills: stat.objective_kills,
                healing: stat.healing,
                objectiveTime: stat.objective_time,
                deaths: stat.deaths,
                heroStat1: stat.hero_stat_1,
                heroStat2: stat.hero_stat_2,
                heroStat3: stat.hero_stat_3,
                heroStat4: stat.hero_stat_4,
                heroStat5: stat.hero_stat_5,
                heroStat6: stat.hero_stat_6,
            });
        }
        console.log(body.hero_statistics);

        let validRanks = 0;
        let teams: Teams;
        let placement: boolean = false;
        if (body.avg_sr){
            teams = {
                blue: [],
                blueAvgSR: body.avg_sr[0],
                red: [],
                redAvgSR: body.avg_sr[1],
            }
            for (let player of body.teams.blue){
                teams.blue.push({
                    name: player.name,
                    rank: player.rank || "unknown"
                })
                if (player.rank){
                    validRanks += 1;
                }
            }
            for (let player of body.teams.red){
                teams.red.push({
                    name: player.name,
                    rank: player.rank || "unknown"
                })
                if (player.rank){
                    validRanks += 1;
                }
            }
            console.log(teams.blue[0].rank);
            if (teams.blue[0].rank == 'placement'){
                placement = true;
            }
            if (validRanks < 9){
                teams = null;
            }
        } else {
            teams = null;
        }
        
        return {
            num: null,
            error: false,
            url: this.gameUrl + body.key + '/game.json',
            heroes: null,
            rank: null,
            season: null,
            viewable: true,

            userID: body.user_id,
            map: body.map,
            mapType: body.map_type,
            blueScore: body.score ? body.score[0] : null,
            redScore: body.score ? body.score[1] : null,
            result: body.result === 'UNKNOWN' ? 'UNKN' : body.result,
            startTime: new Date(body.game_started * 1000),
            player: body.player,
            key: body.key,
            owner: body.owner,
            stages: stages,
            killfeed: killfeed,
            endTime: new Date(body.game_ended),
            duration: body.game_duration,
            tabStatistics: body.tab_statistics,
            heroStatistics: heroStatistics,

            startSR: body.start_sr,
            startSREditable: true,
            //startSREditable: !body.start_sr || body.start_sr_editable,
            endSR: body.end_sr,
            endSREditable: true,
            //endSREditable: !body.end_sr || body.end_sr_editable,

            teams: teams,
            customGame: body.custom_game,
            placement: placement,
            rankEditable: teams == null || body.rank_ediable,
            groupSize: body.group_size,

            deleted: false
        };
    }
}

export class Game {
    num: number;
    error: boolean;
    url: string;
    heroes: any;
    rank: 'placement' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
    season: string;
    viewable: boolean;

    userID: number;
    map: string;
    mapType: string;
    result: 'UNKN' | 'WIN' | 'DRAW' | 'LOSS' | 'ERROR';
    startTime: Date;
    redScore: number;
    blueScore: number;
    player: string;
    key: string;
    owner: string;
    stages: Array<Stage>;
    killfeed: Array<KillFeedEntry>;
    endTime: Date;
    duration: number;
    tabStatistics: any;
    heroStatistics: Array<HeroStatistics>;
    startSR: number;
    startSREditable: boolean;
    endSR: number;
    endSREditable: boolean;
    teams: Teams;
    customGame: boolean;
    placement: boolean;
    rankEditable: boolean;
    groupSize: number;

    deleted: boolean;
}

export class Teams {
    blue: Array<TeamPlayer>;
    blueAvgSR: number;

    red: Array<TeamPlayer>;
    redAvgSR: number;
}

export class TeamPlayer{
    name: string;
    rank: string;
}

export class KillFeedEntry {
    id: string;
    time: number;
    isLeftRed: boolean;
    isRes: boolean;
    leftHero: string;
    leftPlayer: string;
    rightHero: string;
    rightPlayer: string;
    assists: string[];
    ability: string[];
}

export class HeroStatistics {
    heroName: string;
    timePlayed: number;
    
    elims: number;
    damage: number;
    objectiveKills: number;
    healing: number;
    objectiveTime: number;
    deaths: number;
    heroStat1: number;
    heroStat2: number;
    heroStat3: number;
    heroStat4: number;
    heroStat5: number;
    heroStat6: number;
}

export class Stage {
    name: string;
    killfeed: Array<KillFeedEntry>;
    index: number;
    start: number;
    end: number;
    players: Array<Player>;
    objectiveInfo: ObjectiveInfo;

    progress: number;
    formatProgress: string;
    events: any; // FIXME
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
    id: string;
    time: number;
    absoluteTime: number;
    type: string;
    otherHero: string;
    other: string;
}
