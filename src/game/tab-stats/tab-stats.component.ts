import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

import { heroStatNames, heroGraphedStats, statNames } from '../tab-graphs/tab-graphs.component';
import { HeroStatistics, EndGameStatistics, HeroPlayed } from '../game.service';

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
    @Input() endgameStatistics: EndGameStatistics;
    @Input() heroPlayed: HeroPlayed;

    heroNames: Array<string>;
    statsByHero: Map<string, HeroStatistics>;
    duration: number = 0;

    ngOnInit(): void {
        this.heroNames = [];
        this.statsByHero = new Map<string, HeroStatistics>();
        if (this.endgameStatistics){
            // prefer using endgame stats
            console.log('Using endgame stats', this.endgameStatistics);
            for (let hero of this.heroPlayed.timePlayed){
                console.log('>>>', hero);
                if (hero.duration < 0.9 * 60 * 1000){
                    console.log('Ignoring %d seconds on %s', hero.duration / 1000, hero.hero);
                    continue;
                }
                let heroStats = this.makeHeroStats(hero.hero.split('_')[0], hero.duration, this.endgameStatistics.heroes, this.heroStatistics);
                if (heroStats){
                    this.heroNames.push(hero.hero.split('_')[0]);
                    this.statsByHero.set(hero.hero.split('_')[0], heroStats);
                } else {
                    console.warn('Could not get stats for', hero.hero)
                }
            }
            let summedDuration = this.heroPlayed.timePlayed.reduce((p, c) => p + c.duration, 0);

            // try to find all heroes in endgame stats
            let allheroStats = this.makeHeroStats('all heroes', summedDuration, this.endgameStatistics.heroes, null);
            // make all hero stats from tab
            // This should not be needed as "all heroes" displays first
            // if (!allheroStats){
            //     allheroStats = this.makeHeroStats('ALL', summedDuration, null, this.heroStatistics);
            // }
            if (!allheroStats){
                this.duration = summedDuration;
            } else {
                allheroStats.heroName = 'ALL';
                this.heroNames.push('ALL');
                this.statsByHero.set('ALL', allheroStats);
            }

        } else if (this.heroStatistics){
            console.log('Using tab stats', this.heroStatistics);
            for (let stat of this.heroStatistics){
                if (this.heroPlayed){
                    for (let hero of this.heroPlayed.timePlayed){
                        if (hero.hero == stat.heroName){
                            console.log('Updating time played for', stat.heroName, 'from', stat.timePlayed, '(from tab) to', hero.duration, '(from hero played)')
                            stat.timePlayed = hero.duration;
                            break;
                        }
                    }
                }
                if (stat.timePlayed < 0.9 * 60 * 1000){
                    console.log('Ignoring %d seconds on %s', stat.timePlayed / 1000, stat.heroName);
                    continue;
                }
                this.heroNames.push(stat.heroName);
                this.statsByHero.set(stat.heroName, stat);
            }
        } else {
            return;
        }
        console.log(this.heroNames);
        this.heroNames = this.heroNames.sort((a, b) => {
            return this.statsByHero.get(b).timePlayed - this.statsByHero.get(a).timePlayed;
        });

        // take the duration from "All Heroes"
        if (this.heroNames.indexOf('ALL') != -1){
            this.duration = Array.from(this.statsByHero.values()).map(s => s.timePlayed).reduce((p, c) => Math.max(p, c), 0);
        }

        let neverSwitched = Array.from(this.statsByHero.values()).reduce((p, c) => p || (c.heroName != 'ALL' && c.timePlayed >= this.duration * 0.95), false);
        if (neverSwitched && this.heroNames.indexOf('ALL') != -1){
            // No need to show "All Heroes"
            this.heroNames.splice(this.heroNames.indexOf('ALL'), 1);
        }
    }

    makeHeroStats(hero: string, timePlayed: number, endgameStats: Array<{hero: string, statistics: Map<string, number>}>, tabStats: Array<HeroStatistics>): HeroStatistics {
        console.log('Getting stats for', hero, 'using endgame and tab stats');
        let matchingEndgameStats: {hero: string, statistics: Map<string, number>} = null;
        if (endgameStats){
            for (let e of endgameStats){
                if (e.hero == hero){
                    matchingEndgameStats = e;
                    break;
                }
            }
        }
        if (matchingEndgameStats){
            console.log('Found endgame stats:', matchingEndgameStats.statistics.keys());

            let heroStats: HeroStatistics = {
                heroName: hero,
                timePlayed: timePlayed,

                elims: null,
                damage: null,
                objectiveKills: null,
                healing: null,
                objectiveTime: null,
                deaths: null,

                heroStat1: null,
                heroStat2: null,
                heroStat3: null,
                heroStat4: null,
                heroStat5: null,
                heroStat6: null,
            }

            let statNameLookup = {
                'ELIMINATIONS': 'elims',
                'HERO DAMAGE DONE': 'damage',
                'OBJECTIVE KILLS': 'objectiveKills',
                'HEALING DONE': 'healing',
                'OBJECTIVE TIME': 'objectiveTime',
                'DEATHS': 'deaths'
            };

            let stats = {};
            if (hero.toLowerCase().indexOf('all') == -1){
                // only do hero stats if this is not for all heroes
                let thisHeroStatNames: Array<string> = heroStatNames[hero];
                for (let stat of Array.from(matchingEndgameStats.statistics.keys())){
                    let statName = stat.replace('Ö', 'O').toLowerCase();
                    let i = thisHeroStatNames.indexOf(statName);
                    if (i != -1){
                        statNameLookup[stat] = 'heroStat' + (i+1);
                    }
                }
            }

            for (let k of Object.keys(statNameLookup)){
                console.log(k, statNameLookup[k], '->', matchingEndgameStats.statistics.get(k));
                heroStats[statNameLookup[k]] = matchingEndgameStats.statistics.get(k);
            }
            console.log(heroStats);
            return heroStats;
        } else if (tabStats){
            console.log('Using tab stats');
            console.log(tabStats);
            for (let e of tabStats){
                if (e.heroName == hero){
                    console.log('Found tab stats: ', e);
                    return e;
                }
            }
            console.warn('Could not find stats in tab');
            return null;
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
