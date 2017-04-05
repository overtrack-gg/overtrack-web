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

        if (stat.indexOf('accuracy') != -1 || stat.indexOf('energy') != -1){
            return v + '%';
        } else {
            return v + '';
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
            for (let statName of statNames){
                if (this.tabStatistics[statName][i]){
                    showHero = true;
                    break;
                }
            }
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

}