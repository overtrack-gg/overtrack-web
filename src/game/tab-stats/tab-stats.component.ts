import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

import { heroStatNames, heroGraphedStats, statNames } from '../tab-graphs/tab-graphs.component';

declare var Plotly: any;

@Component({
    selector: 'hero-stats',
    templateUrl: './hero-stats.component.html'
})
export class HeroStatisticsComponent {
    @Input() tabStatistics: any;
    @Input() hero: string;

    stats: Array<string> = [];

    ngOnInit(): void {
        for (let stat of this.hero ? heroStatNames[this.hero] : statNames){
            if (stat) {
                this.stats.push(stat);
            }
        }
    }

    toTitleCase(str: string){
        return str.replace('_', ' ').replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    getLastStat(stat: string){
        let statRealName = this.hero ? 'hero_stat_' + (heroStatNames[this.hero].indexOf(stat) + 1) : stat;

        let v: number = null;
        for (let i in this.tabStatistics.hero){
            let valAtI: number = this.tabStatistics[statRealName][i];
            if ((this.hero == null || this.tabStatistics.hero[i] == this.hero) && valAtI != null){
                v = valAtI;
            }
        }
        return v;
    }

    formatLastStat(stat: string) {
        let v: number = this.getLastStat(stat);
        if (stat.indexOf('accuracy') != -1 || stat.indexOf('average') != -1 || stat.indexOf('uptime') != -1){
            return v + '%';
        } else if (stat.indexOf('time') != -1){
            return Math.floor(v / 60) + ':' + v % 60;
        } else {
            return v + '';
        }
    }

    formatLastStatPerMinute(stat: string) {
        let blacklist = [
            'best', // best transcendance heal, kill streak - best
            'accuracy', // weapon, hook, etc. 
            'average', // average energy
            'uptime'
        ]

        for (let b of blacklist) {
            if (stat.indexOf(b) != -1){
                return '';
            }
        }

        let v: number = this.getLastStat(stat);
        let totalTime: number;
        if (this.hero){
            totalTime = 0;
            let last: string;
            for (let i in this.tabStatistics.hero){
                let current: string = this.tabStatistics.hero[i]; 
                if (last == this.hero && current == this.hero){
                    totalTime += this.tabStatistics.time[i] - this.tabStatistics.time[Number(i) - 1];
                }
                last = current;
            }
        } else {
            totalTime = this.tabStatistics.time[this.tabStatistics.time.length - 1];
        }

        if (stat == 'objective_time'){
            v = v / (totalTime / 1000);
            return (v * 100).toFixed(0) + '%';
        } else {
            v = (v / (totalTime / (60 * 1000)));
            if (v > 10){
                return v.toFixed(0) + ' / min';
            } else if (v > 0.1){
                return v.toFixed(2) + ' / min';
            } else if (v > 0){
                return v.toFixed(3) + ' / min';
            } else {
                return '0 / min';
            }
        }
    }
}

@Component({
    selector: 'tab-stats',
    templateUrl: './tab-stats.component.html'
})
export class TabStatisticsComponent {
    @Input() tabStatistics: any;
    heroes: Array<string> = [];

    ngOnInit(): void {
        if (!this.tabStatistics){
            return;
        }

        for (let i in this.tabStatistics.hero){
            let hero: string = this.tabStatistics.hero[i];
            let showHero: boolean = false;
            for (let statNum in heroStatNames[hero]){
                // the stat name is not null and there is a nonzero value for that stat at i
                let statName = heroStatNames[hero][statNum];
                if (statName && this.tabStatistics['hero_stat_' + (Number(statNum) + 1)][i]){
                    showHero = true;
                    break;
                }
            }
            if (this.heroes.indexOf(hero) == -1 && showHero){
                this.heroes.push(hero);
            }
        }
    }

    toHref(str: string){
        return str.replace(/\W/g, '_');
    }

    toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    toHeroName(str: string) {
        if (str == 's76'){
            str = 'Soldier: 76';
        } else if (str == 'torb'){
            str = 'Torbjörn';
        }
        return this.toTitleCase(str);
    } 

}
