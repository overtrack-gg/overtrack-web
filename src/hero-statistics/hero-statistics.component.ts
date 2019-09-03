import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { HeroStatisticsService, HeroStatistics, HeroStatistic } from './hero-statistics.service';

import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'statsFilter',
    pure: false
})
export class StatsFilterPipe implements PipeTransform {
    transform(items: HeroStatistic[], filter: {selectedAccount: string, selectedMode: string, endgameOnly: boolean}): any {
        if (!items || !filter) {
            return items;
        }
        return items.filter(item => 
            !item.is_role &&

            item.account == filter.selectedAccount && 
            item.mode == filter.selectedMode && 
            filter.endgameOnly == item.endgame_only
        ).sort(
            (a, b) => b.statistics.time_played - a.statistics.time_played
        );
    }
}

@Component({
    selector: 'hero-statistics',
    templateUrl: './hero-statistics.component.html',
    styleUrls: ['./hero-statistics.component.css'],
    providers: [RouterModule, HeroStatisticsService]
})
export class AllTimeHeroStatisticsComponent implements OnInit {

    statistics: HeroStatistics;

    selectedAccount: string;
    selectedMode: string;
    endgameOnly: boolean;
 
    constructor(public statsService: HeroStatisticsService) { }
 
    ngOnInit(): void {

        this.statsService.getStats().subscribe(
            s => {
                console.log(s);
                this.statistics = s;

                this.selectedAccount = s.accounts[0];
                this.selectedMode = s.modes[0];
                this.endgameOnly = true;
            }
        )
    }

    totalTime(): number {
        return this.statistics.hero_statistics.filter(
            e => e.hero == 'all heroes' &&
            e.account == this.selectedAccount &&
            e.mode == this.selectedMode &&
            e.endgame_only == this.endgameOnly
        )[0].statistics.time_played;
    }

    formatMode(mode: string): string {
        if (mode == 'competitive'){
            return 'Competitive';
        } else if (mode == 'quickplay'){
            return 'Quick Play';
        } else if (mode == 'custom'){
            return 'Custom Games';
        } else {
            return mode;
        }
    }

}


@Component({
    selector: 'hero-statistic',
    styleUrls: ['./hero-statistics.component.css'],
    templateUrl: './hero-statistic.component.html'
})
export class AllTimeHeroStatisticComponent implements OnInit {
    @Input() stat: HeroStatistic;
    @Input() totalTime: number;
    timePlayed10m: number;

    ngOnInit(): void {
        this.timePlayed10m = this.stat.statistics.time_played / (60 * 10);
    }

    isAllHeroes(): boolean {
        return this.stat.hero == 'all heroes';
    }

    heroImage(): string {
        if (this.isAllHeroes()){
            return 'ALL';
        } else {
            return this.stat.hero;
        }
    }

    s2ts(seconds: number): string {
        console.log(seconds, 's2ts')
        let s = Math.floor(seconds % 60);
		let m = Math.floor(seconds / 60) % 60;
		let h = Math.floor(seconds / (60 * 60));
		return (h > 0 ? (h < 10 ? "0" : "") + h + ":" + (m < 10 ? "0" : "") : "") + m + ":" + (s < 10 ? "0" : "") + s;
    }

    heroStatNames(): string[] {
        return Object.keys(this.stat.statistics.hero_specific_stats);
    }

    averageHeroStatPerGames(k: string): boolean {
        if (k.indexOf('best') != -1){
            return true;
        } else if (k.indexOf('accuracy') != -1){
            return true;
        } else {
            return false;
        }
    }

    heroStatUnit(k: string): string {
        if (k.indexOf('best') != -1){
            return ' AVG PER GAME';
        } else if (k.indexOf('accuracy') != -1){
            return '% AVG PER GAME';
        } else {
            return ' /10min';
        }
    }

}
