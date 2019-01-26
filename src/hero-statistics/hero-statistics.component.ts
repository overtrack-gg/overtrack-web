import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { HeroStatisticsService, HeroStatistics } from './hero-statistics.service';
import { heroStatNames } from '../game/tab-graphs/tab-graphs.component';


@Component({
    selector: 'hero-statistics',
    templateUrl: './hero-statistics.component.html',
    styleUrls: ['./hero-statistics.component.css'],
    providers: [RouterModule, HeroStatisticsService]
})
export class AllTimeHeroStatisticsComponent implements OnInit {

    allTimeStats: Array<HeroStatistics>;
    playerList: Array<string>;
    heroStatsByPlayer: Map<string, Array<HeroStatistics>>;
 
    constructor(public statsService: HeroStatisticsService, 
                public router: Router,
                public activatedRoute: ActivatedRoute) { }
 
    ngOnInit(): void {
        this.activatedRoute.params.subscribe(
            params => {
                this.statsService.getStats(params['share_key']).subscribe(
                    res => {
                        this.initStatistics(res);
                    },
                    err => {
                        console.error(err);
                    }
                );
            }
        );
    }

    initStatistics(res: any) {
        // TODO: this should be done by the service
        this.allTimeStats = this.statsService.toAllTimeStats(res);
        this.playerList = [];
        this.heroStatsByPlayer = new Map<string, Array<HeroStatistics>>();
        let playerPlayedTime = new Map<string, number>();
        for (let stat of this.allTimeStats){
            if (this.playerList.indexOf(stat.playerName) == -1){
                this.playerList.push(stat.playerName);
            }
            if (!this.heroStatsByPlayer.has(stat.playerName)){
                this.heroStatsByPlayer.set(stat.playerName, []);
            }
            this.heroStatsByPlayer.get(stat.playerName).push(stat);
            if (stat.heroName == 'ALL'){
                playerPlayedTime.set(stat.playerName, stat.timePlayed);
            }
        }

        for (let player of this.playerList){
            for (let heroStat of this.heroStatsByPlayer.get(player)){
                heroStat.playRate = heroStat.timePlayed / playerPlayedTime.get(player) * 100;
            }
        }
        console.log(this.heroStatsByPlayer);
    }

    playerHref(s: string): string{
        return 'player_' + s.replace(/\W/g, '_');
    }

    sorted(heroes: Array<HeroStatistics>){
        return heroes.sort((a, b) => {
			return b.timePlayed - a.timePlayed;
		})
    }
}

@Component({
    selector: 'hero-statistic',
    styleUrls: ['./hero-statistics.component.css'],
    templateUrl: './hero-statistic.component.html'
})
export class HeroStatisticPaneComponent implements OnInit {
    @Input() stat: HeroStatistics;
    normTime: number;

    ngOnInit(): void {
        this.normTime = this.stat.timePlayed / (10 * 60 * 1000);
    }

    // getHeroWinrateByTime(){
    //     return 60;
    // }
    
    // getHeroWinrateByGames(){
    //     return 40;
    // }

    formatTime(time: number): string{
		let seconds = Math.floor( (time) % 60 );
		let minutes = Math.floor( (time/60) % 60 );
		let hours = Math.floor( time/(60*60));
		return (hours < 10 ? "0" : "")+hours+":"+(minutes < 10 ? "0" : "")+minutes+":"+(seconds < 10 ? "0" : "")+seconds;
	}

    toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    getHeroName() {
        let str = this.stat.heroName;
        if (str == 'ALL'){
            str = 'All Heroes'
        }else if (str == 's76'){
            str = 'Soldier: 76';
        } else if (str == 'torb'){
            str = 'Torbjörn';
        } else if (str == 'dva'){
           return 'D.Va';
        }
        return this.toTitleCase(str);
    } 

    getObjTime(){
        let v = this.stat.objectiveTime / (this.stat.timePlayed / 1000);
        return v * 100;
    }

    getHeroSpecificStatName(index: number){
        return heroStatNames[this.stat.heroName][index];
    }

    averageHeroStatPerGames(index: number): boolean {
        let statName = heroStatNames[this.stat.heroName][index];
        let blacklist = [
            'best', // best transcendance heal, kill streak - best
            'accuracy', // weapon, hook, etc. 
            'average', // average energy
            'uptime',
            'percentage'
        ]
        for (let b of blacklist) {
            if (statName.indexOf(b) != -1){
                return true
            }
        }
        return false;
    }

    getHeroSpecificStat(index: number){
        return this.stat['heroStat' + (index + 1)];
    }

    getHeroSpecificStatUnit(index: number){
        let statName = heroStatNames[this.stat.heroName][index];
        if (statName.indexOf('best') != -1){
            return 'AVG / game';
        }

        return '%';
    }



}