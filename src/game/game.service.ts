import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs';

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


    addPlayersToStage(players: Array<Player>, stage: any, killfeed: Array<KillFeedEntry>, team: Array<any>, teamColour: string, tab?: any, heroPlayed?: HeroPlayed) {
        class TabPress {
            player: number;
            blue: boolean;
            time: number;
            hero: string;
        }
        let killfeedAndTab: Array<KillFeedEntry | TabPress> = [];
        killfeedAndTab = killfeedAndTab.concat(killfeed);
        if (tab){
            for (let i in tab.time){
                if (tab.blue_team){
                    for (let j=0; j < 6; j++){
                        let hero = null
                        if (j == 0){
                            hero = tab.hero[i];
                        } else if (tab.blue_team[i].reduce((p, c) => p && c != null, true)){
                            hero = tab.blue_team[i][j];
                        }
                        if (hero){
                            killfeedAndTab.push({
                                player: j,
                                blue: true,
                                time: tab.time[i],
                                hero: hero
                            });
                        }
                        hero = null;
                        if (tab.red_team[i].reduce((p, c) => p && c != null, true)){
                            hero = tab.red_team[i][j];
                        }
                        if (hero){
                            killfeedAndTab.push({
                                player: j,
                                blue: false,
                                time: tab.time[i],
                                hero: hero
                            });
                        }
                    }
                } else {
                    killfeedAndTab.push({
                        player: 0,
                        blue: true,
                        time: tab.time[i],
                        hero: tab.hero[i]
                    }); 
                }
            }
            killfeedAndTab = killfeedAndTab.sort((a, b) => a.time - b.time);
        }
        if (heroPlayed){
            for (let swap of heroPlayed.swaps){
                killfeedAndTab.push({
                    player: 0,
                    blue: true,
                    time: swap.timestamp,
                    hero: swap.hero
                });
            }
        }
        console.log('killfeedAndTab', killfeedAndTab, stage);
        killfeedAndTab = killfeedAndTab.sort((a, b) => a.time - b.time);
        let firstPlayer = true;
        for (const player of team) {
            const heroes: Array<GameHero> = [];
            const events: Array<GameEvent> = [];
            let kills = 0;
            let deaths = 0;

            for (const event of killfeedAndTab) {
                if (event.time > stage.end || (event.time < stage.start && stage.index != 0)) {
                    // outside of this stage
                    continue;
                }

                // heroes played
                let hero: string;
                if ('hero' in event){
                    let tabPress = <TabPress> event;
                    if (tabPress.blue == (teamColour == 'blue') && team[tabPress.player] == player){
                        hero = tabPress.hero;
                    }
                } else {
                    let kill = <KillFeedEntry> event;
                    let leftColor = kill.isLeftRed ? 'red': 'blue';
                    if (kill.leftPlayer === player.name && leftColor == teamColour) {
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
                    if (kill.rightPlayer === player.name && ((!kill.isRes && leftColor != teamColour) || (kill.isRes && leftColor == teamColour))) {
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
                        if (firstPlayer && heroPlayed){
                            // if we have hero played data then don't guess
                            heroes.push({
                                name: hero,
                                start: event.time - stage.start,
                                end: event.time - stage.start + 2 * 1000
                            });
                        } else {
                            heroes.push({
                                name: hero,
                                start: heroes[heroes.length - 1].end,
                                end: event.time - stage.start
                            });
                        }
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
            firstPlayer = false;
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

        let heroPlayed: HeroPlayed = null;
        if (body.hero_played){
            heroPlayed = {
                timePlayed: [],
                swaps: [],
                duration: 0
            }
            let totalDuration = 0;
            for (let hero of Object.keys(body.hero_played.time_played)){
                heroPlayed.timePlayed.push({
                    hero: hero,
                    duration: body.hero_played.time_played[hero],
                    percent: 0
                });
                totalDuration += body.hero_played.time_played[hero];
            }
            for (let hero of heroPlayed.timePlayed){
                hero.percent = hero.duration / totalDuration;
            }
            for (let swap of body.hero_played.swaps){
                heroPlayed.swaps.push({
                    hero: swap[1],
                    timestamp: swap[0]
                });
            }
            heroPlayed.duration = totalDuration;
        }

        let count = 1;
        const killfeed: Array<KillFeedEntry> = [];
        for (const kill of body.killfeed || []) {
            const isRes = (kill[1] & 2) != 0;
            let id = "event" + count;

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
                end: body.game_duration * 1000,
                index: 0
            }];
        } else {
            for (let j in objective_stages){
                objective_stages[j].index = +j;
            }
        }

        const stages: Array<Stage> = [];
        let index = 0;
        let ult_index = 0;
        for (const stage of objective_stages){
            const players: Array<Player> = [];
            // only provide heroPlayed if this is not a spectated game
            this.addPlayersToStage(players, stage, killfeed, body.teams.blue, 'blue', body.tab_statistics, body.spectate_bar ? null : heroPlayed);
            this.addPlayersToStage(players, stage, killfeed, body.teams.red, 'red', body.tab_statistics);

            this.addAssists(players[0], body.assists, stage);
            this.addKillfeedAssists(players, stage, killfeed);

            let overtime: Array<OvertimePeriod> = [];
            for (const p of (stage.overtime || [])){   
                overtime.push({
                    start: p.start,
                    end: p.end
                })
            }

            let objectiveInfo: PayloadObjectiveInfo|KOTHObjectiveInfo|ObjectiveInfo;
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
                    overtime: overtime,
                    ownership: ownership,
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
                    overtime: overtime,
                    checkpoints: checkpoints
                };
            } else {
                objectiveInfo = {
                    overtime: []
                };
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

            if (body.spectate_bar){
                for (let i in players){
                    let start = 0;
                    for (let e of body.spectate_bar.has_ult[i]){
                        let t: number = e[0];
                        let gain: boolean = e[1];
                        if (gain){
                            start = t;
                        } else if (start) {
                            let end = t;
                            if (stage.start < start && start < stage.end){
                                t = Math.min(t, stage.end);
                                (players[i].events as Array<GameEvent>).push({
                                    id: 'event-ult' + ult_index++,
                                    absoluteTime: start,
                                    time: start - stage.start,
                                    type: 'ult',
                                    duration: end - start
                                });
                            }
                        }
                    }
                }
            } else {
                for (let ult_period of body.ults as Array<Array<number>> || []){
                    let start = ult_period[0];
                    let end = ult_period[1];
                    if (stage.start < start && start < stage.end){
                        (players[0].events as Array<GameEvent>).push({
                            id: 'event-ult' + ult_index++,
                            absoluteTime: start,
                            time: start - stage.start,
                            type: 'ult',
                            duration: end - start
                        });
                    }
                }
            }

            stages.push({
                name: stage.stage,
                index: index++,
                start: stage.start,
                killfeed: this.filterKillfeed(stage, killfeed),
                end: stage.end,
                duration: stage.end - stage.start,
                players: players,
                objectiveInfo: objectiveInfo,

                progress: progress,
                formatProgress: formatProgress,
                events: stage.events
            });
        }
        console.log('stages:', stages)

        let heroStatistics: Array<HeroStatistics> = [];
        if (body.hero_statistics){
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
            if (heroStatistics.length == 1 && heroStatistics[0].heroName == 'ALL'){
                let mainPlayed = heroPlayed.timePlayed.sort((a, b) => a.duration - b.duration)[0];
                if (mainPlayed.percent > 0.95){
                    console.warn(mainPlayed.hero, 'was played for', mainPlayed.percent * 100, '% of the game but only "ALL" was seen - setting ALL at', mainPlayed.hero);
                    let mainHeroStat: HeroStatistics = {...heroStatistics[0]};
                    mainHeroStat.heroName = mainPlayed.hero.split('_')[0];
                    heroStatistics.push(mainHeroStat);
                }
            }
        }
        
        let validRanks = 0;
        let teams: Teams;
        let placement: boolean = false;

        let gameType = 'competitive';
        if (body.custom_game){
            gameType = 'custom';
        } else if (body.game_type){
            gameType = body.game_type;
        }

        if (body.avg_sr || gameType != 'competitive'){
            teams = {
                blue: [],
                blueAvgSR: body.avg_sr ? body.avg_sr[0]: null,
                red: [],
                redAvgSR:  body.avg_sr ? body.avg_sr[1]: null
            }
            let fallbackRank = gameType == 'competitive' ? 'unknown' : 'none';
            for (let player of body.teams.blue){
                teams.blue.push({
                    name: player.name,
                    rank: player.rank || fallbackRank
                })
                if (player.rank){
                    validRanks += 1;
                }
            }
            for (let player of body.teams.red){
                teams.red.push({
                    name: player.name,
                    rank: player.rank || fallbackRank
                })
                if (player.rank){
                    validRanks += 1;
                }
            }
            if (teams.blue[0].rank == 'placement'){
                placement = true;
            }
            if (validRanks < 9 && gameType == 'competitive'){
                teams = null;
            }
        } else {
            teams = null;
        }

        let endGameStatistics: EndGameStatistics = null;
        if (body.endgame_statistics){
            endGameStatistics = {
                heroes: []
            }
            for (let hero of Object.keys(body.endgame_statistics)){
                let heroStats: Map<string, number> = new Map();
                for (let stat of body.endgame_statistics[hero]){
                    heroStats.set(stat[0], stat[1]);
                }
                endGameStatistics.heroes.push({
                    hero: hero,
                    statistics: heroStats
                });
            }
            if (endGameStatistics.heroes.length == 0){
                endGameStatistics = null;
            }
        }

        
        return {
            num: null,
            error: false,
            url: this.gameUrl + body.key + '/game.json',
            heroes: null,
            rank: null,
            season: null,
            viewable: true,
            hasSR: true,

            userID: body.user_id,
            map: body.map,
            mapType: body.map_type,
            gameType: gameType,
            blueScore: body.score ? body.score[0] : null,
            redScore: body.score ? body.score[1] : null,
            result: body.result === 'UNKNOWN' ? 'UNKN' : body.result,
            role: body.role,
            startTime: new Date(body.game_started * 1000),
            player: body.player,
            key: body.key,
            owner: body.owner,
            stages: stages,
            killfeedMissing: !body.killfeed,
            killfeed: killfeed,
            endTime: new Date(body.game_ended),
            duration: body.game_duration,
            tabStatistics: body.tab_statistics,
            heroStatistics: heroStatistics,
            endGameStatistics: endGameStatistics,
            heroPlayed: heroPlayed,

            startSR: body.start_sr,
            startSREditable: true,
            //startSREditable: !body.start_sr || body.start_sr_editable,
            endSR: body.end_sr,
            endSREditable: true,
            //endSREditable: !body.end_sr || body.end_sr_editable,

            teams: teams,
            customGame: body.custom_game,
            placement: placement,
            rankEditable: teams == null || body.rank_editable || body.rank_ediable,
            groupSize: body.group_size,
            twitch: body.twitch || null,
            playlists: body.playlists,

            deleted: false,
            listView: null,
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
    hasSR: boolean;

    userID: number;
    map: string;
    mapType: string;
    gameType: string;
    result: 'UNKN' | 'WIN' | 'DRAW' | 'LOSS' | 'ERROR';
    role: 'tank' | 'damage' | 'support';
    startTime: Date;
    redScore: number;
    blueScore: number;
    player: string;
    key: string;
    owner: string;
    stages: Array<Stage>;
    killfeedMissing: boolean;
    killfeed: Array<KillFeedEntry>;
    endTime: Date;
    duration: number;
    tabStatistics: any;
    heroStatistics: Array<HeroStatistics>;
    heroPlayed: HeroPlayed;
    endGameStatistics: EndGameStatistics;

    startSR: number;
    startSREditable: boolean;
    endSR: number;
    endSREditable: boolean;
    teams: Teams;
    customGame: boolean;
    placement: boolean;
    rankEditable: boolean;
    groupSize: number;
    twitch: string;

    playlists: object;

    deleted: boolean;

    listView: Object;
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
    duration: number;
    players: Array<Player>;
    objectiveInfo: ObjectiveInfo;

    progress: number;
    formatProgress: string;
    events: Array<GameEvent>;
}

export class OvertimePeriod{
    start: number;
    end: number;
}

export interface ObjectiveInfo {
    overtime: Array<OvertimePeriod>;
}

export class KOTHObjectiveInfo implements ObjectiveInfo {
    overtime: Array<OvertimePeriod>;
    ownership: Array<KothOwnership>;
}

export class KothOwnership {
    start: number;
    end: number;
    team: string;
}

export class PayloadObjectiveInfo implements ObjectiveInfo{
    overtime: Array<OvertimePeriod>;
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
    otherHero?: string;
    other?: string;
    duration?: number;
}

export class HeroPlayed {
    timePlayed: Array<{
        hero: string;
        duration: number;
        percent: number;
    }>;

    swaps: Array<{
        hero: string;
        timestamp: number;
    }>;

    duration: number;
}

export class EndGameStatistics {
    heroes: Array<{
        hero: string,
        statistics: Map<string, number>
    }>;
}

