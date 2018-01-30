import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

import { heroStatNames, heroGraphedStats, statNames } from '../tab-graphs/tab-graphs.component';
import { HeroStatistics } from '../game.service';

declare var Plotly: any;

@Component({
    selector: 'hero-stats',
    templateUrl: './hero-stats.component.html'
})
export class HeroStatisticsComponent {
    @Input() stat: HeroStatistics;
    @Input() duration: number;
    normTime: number;

    ngOnInit(): void {
        this.normTime = this.stat.timePlayed / (10 * 60 * 1000);
    }

    formatTime(ms: number){
		let seconds = Math.floor( (ms) % 60 );
		let minutes = Math.floor( (ms / 60) % 60 );
		return (minutes < 10 ? "0" : "")+minutes+":"+(seconds < 10 ? "0" : "")+seconds;
    }

    getHeroSpecificStatName(index: number): string{
        return heroStatNames[this.stat.heroName][index];
    }

    showAverageHeroStat(index: number): boolean {
        let statName = heroStatNames[this.stat.heroName][index];
        let blacklist = [
            'best', // best transcendance heal, kill streak - best
            'accuracy', // weapon, hook, etc. 
            'average', // average energy
            'uptime'
        ]
        for (let b of blacklist) {
            if (statName.indexOf(b) != -1){
                return false;
            }
        }
        return true;
    }

    showPercent(index: number): boolean { 
        let statName = heroStatNames[this.stat.heroName][index];
        return (statName.indexOf('accuracy') != -1 || statName.indexOf('average') != -1 || statName.indexOf('uptime') != -1);
    }

    getHeroSpecificStat(index: number){
        return this.stat['heroStat' + (index + 1)];
    }
}

@Component({
    selector: 'tab-stats',
    templateUrl: './tab-stats.component.html'
})
export class TabStatisticsComponent {
    @Input() heroStatistics: Array<HeroStatistics>;
    heroNames: Array<string>;
    statsByHero: Map<string, HeroStatistics>;
    duration: number;

    ngOnInit(): void {
        if (!this.heroStatistics){
            return;
        }

        this.heroNames = [];
        this.statsByHero = new Map<string, HeroStatistics>();
        for (let stat of this.heroStatistics){
            if (stat.timePlayed < 2 * 60 * 1000){
                continue;
            }
            this.heroNames.push(stat.heroName);
            this.statsByHero.set(stat.heroName, stat);
        }
        this.heroNames = this.heroNames.sort((a, b) => {
            return this.statsByHero.get(b).timePlayed - this.statsByHero.get(a).timePlayed;
        });

        
        this.duration = Array.from(this.statsByHero.values()).map(s => s.timePlayed).reduce((p, c) => Math.max(p, c), 0);

        let neverSwitched = Array.from(this.statsByHero.values()).reduce((p, c) => p || (c.heroName != 'ALL' && c.timePlayed >= this.duration * 0.95), false);
        if (neverSwitched){
            // No need to show "All Heroes"
            this.heroNames.splice(this.heroNames.indexOf('ALL'), 1);
        }
    }

    toHref(str: string){
        return str.replace(/\W/g, '_');
    }

    toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1)});
    }

    toHeroName(str: string) {
        if (str == 'ALL'){
            str = 'All Heroes'
        } else if (str == 's76'){
            str = 'Soldier: 76';
        } else if (str == 'torb'){
            str = 'Torbjörn';
        } else if (str == 'dva'){
           str = 'D.Va';
        }
        return this.toTitleCase(str);
    } 

}
