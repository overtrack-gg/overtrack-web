import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

declare var Plotly: any;

// ಠ_ಠ 
// https://api2.overtrack.gg/data/overwatch/stat_names_v1
export let heroStatNames = {
    "ana": [
      "unscoped accuracy",
      "nano boost assists",
      "scoped accuracy",
      "enemies slept",
      "defensive assists",
      null
    ],
    "ashe": [
      "weapon accuracy",
      "scoped critical hits",
      "final blows",
      "dynamite kills",
      "scoped accuracy",
      "bob kills"
    ],
    "baptiste": [
      "weapon accuracy",
      "amplification matrix assists",
      "healing accuracy",
      "defensive assists",
      "damage amplified",
      "immportality field deaths prevented"
    ],
    "bastion": [
      "weapon accuracy",
      "sentry kills",
      "kill streak - best",
      "tank kills",
      "recon kills",
      "self healing"
    ],
    "brigitte": [
      "offensive assists",
      "armor provided",
      "defensive assists",
      "inspire uptime percentage",
      "damage blocked",
      null
    ],
    "doomfist": [
      "weapon accuracy",
      "ability damage done",
      "kill streak - best",
      "meteor strike kills",
      "final blows",
      "shields created"
    ],
    "dva": [
      "weapon accuracy",
      "self-destruct kills",
      "kill streak - best",
      "mechs called",
      "damage blocked",
      null
    ],
    "genji": [
      "weapon accuracy",
      "damage reflected",
      "kill streak - best",
      "dragonblade kills",
      "final blows",
      null
    ],
    "hammond": [
      "weapon accuracy",
      "grappling claw kills",
      "kill streak - best",
      "piledriver kills",
      "final blows",
      "minefield kills"
    ],
    "hanzo": [
      "weapon accuracy",
      "critical hits",
      "kill streak - best",
      "recon assists",
      "final blows",
      "dragonstrike kills"
    ],
    "junkrat": [
      "weapon accuracy",
      "enemies trapped",
      "kill streak - best",
      "rip-tire kills",
      "final blows",
      null
    ],
    "lucio": [
      "weapon accuracy",
      "offensive assists",
      "kill streak - best",
      "defensive assists",
      "sound barriers provided",
      null
    ],
    "mccree": [
      "weapon accuracy",
      "critical hits",
      "kill streak - best",
      "deadeye kills",
      "final blows",
      "fan the hammer kills"
    ],
    "mei": [
      "damage blocked",
      "blizzard kills",
      "kill streak - best",
      "self healing",
      "enemies frozen",
      null
    ],
    "mercy": [
      "offensive assists",
      "blaster kills",
      "defensive assists",
      "damage amplified",
      "players resurrected",
      null
    ],
    "moira": [
      "secondary fire accuracy",
      "coalescence kills",
      "kill streak - best",
      "coalescence healing",
      "defensive assists",
      "self healing"
    ],
    "orisa": [
      "weapon accuracy",
      "offensive assists",
      "kill streak - best",
      "damage amplified",
      "damage blocked",
      null
    ],
    "pharah": [
      "weapon accuracy",
      "barrage kills",
      "kill streak - best",
      "rocket direct hits",
      "final blows",
      null
    ],
    "reaper": [
      "weapon accuracy",
      "death blossom kills",
      "kill streak - best",
      "self healing",
      "final blows",
      null
    ],
    "reinhardt": [
      "damage blocked",
      "fire strike kills",
      "kill streak - best",
      "earthshatter kills",
      "charge kills",
      null
    ],
    "roadhog": [
      "weapon accuracy",
      "hook accuracy",
      "kill streak - best",
      "self healing",
      "enemies hooked",
      "whole hog kills"
    ],
    "soldier": [
      "weapon accuracy",
      "helix rocket kills",
      "kill streak - best",
      "tactical visor kills",
      "final blows",
      null
    ],
    "sombra": [
      "weapon accuracy",
      "enemies hacked",
      "kill streak - best",
      "enemies emp'd",
      "offensive assists",
      null
    ],
    "symmetra": [
      "sentry turret kills",
      "players teleported",
      "kill streak - best",
      "primary fire accuracy",
      "damage blocked",
      "secondary fire accuracy"
    ],
    "torbjorn": [
      "weapon accuracy",
      "turret kills",
      "kill streak - best",
      "molten core kills",
      "torbjorn kills",
      "turret damage"
    ],
    "tracer": [
      "weapon accuracy",
      "pulse bomb kills",
      "kill streak - best",
      "pulse bombs attached",
      "final blows",
      null
    ],
    "widowmaker": [
      "recon assists",
      "scoped accuracy",
      "kill streak - best",
      "scoped critical hits",
      "final blows",
      null
    ],
    "winston": [
      "damage blocked",
      "players knocked back",
      "kill streak - best",
      "primal rage kills",
      "melee kills",
      null
    ],
    "zarya": [
      "damage blocked",
      "average energy",
      "kill streak - best",
      "graviton surge kills",
      "high energy kills",
      null
    ],
    "zenyatta": [
      "secondary fire accuracy",
      "defensive assists",
      "kill streak - best",
      "transcendence healing",
      "offensive assists",
      null
    ]
  }


export let heroGraphedStats = [
    'damage reflected',
    'self healing',
    'damage blocked',
    'damage amplified',
]

export let statNames = [
    'elims',
    'damage',
    'healing',
    'objective_time',
    'deaths'
]

@Component({
    selector: 'tab-graphs',
    templateUrl: './tab-graphs.component.html'
})
export class TabGraphsComponent {
    @Input() tabStatistics: any;
    @Input() stages: Array<Stage>;
    graphNames: Array<string> = ['damage'];

    ngOnInit(): void {
        if (!this.tabStatistics){
            return;
        }

        let mercysSeen = 0;
        for (let h of this.tabStatistics.hero){
            if (h == 'mercy'){
                mercysSeen += 1;
            }
        }
        if (mercysSeen > this.tabStatistics.hero.length * 0.95){
            this.graphNames = ['healing'];
        } else if (mercysSeen > this.tabStatistics.hero.length / 2){
            this.graphNames.unshift('healing');
        } else {
            // if we ever healed then add the healing graph
            for (let h of this.tabStatistics.healing){
                if (h){
                    this.graphNames.push('healing');
                    break;
                }
            }
        }

        for (let i in this.tabStatistics.hero){
            let hero: string = this.tabStatistics.hero[i];
            // if (this.tablePanes.indexOf(hero) == -1){
            let showHero: boolean = false;
            for (let statName of statNames){
                if (this.tabStatistics[statName][i]){
                    showHero = true;
                }
            }
            for (let statNum in heroStatNames[hero]){
                // the stat name is not null and there is a nonzero value for that stat at i
                let statName = heroStatNames[hero][statNum];
                if (statName && this.tabStatistics['hero_stat_' + (Number(statNum) + 1)][i]){
                    showHero = true;

                    if (heroGraphedStats.indexOf(statName) != -1){
                        // this is one of the special graphed hero stats
                        let graphName = hero + ': ' + statName;
                        if (this.graphNames.indexOf(graphName) == -1){
                            this.graphNames.push(graphName);
                        }
                    }

                }
            }
        }
    }

    ngAfterViewInit(): void {
        this.switchGraph(this.graphNames[0]);
    }

    toHref(str: string){
        return str.replace(/\W/g, '_');
    }

    toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1)});
    }
    
    toGraphName(str: string){
        if (str.indexOf(': ') != -1){
            str = this.toHeroName(str.split(': ')[0]) + ': ' + str.split(': ')[1];
        }
        return this.toTitleCase(str);
    }

    switchGraph(name: string) {
        window.setTimeout(() => this.renderGraph(name), 0);
    }

    renderGraph(name: string) {
        if (name.indexOf(': ') == -1){
            this.renderUniversalStat(name);
        } else {
            this.renderHeroStat(name.split(': ')[0], name.split(': ')[1])
        }
    }

    renderHeroStat(hero: string, stat: string){
        let statRealName = 'hero_stat_' + (heroStatNames[hero].indexOf(stat) + 1);

        let time: Array<number> = this.tabStatistics.time;
        let values: Array<number> = this.tabStatistics[statRealName];
        let heroes: Array<string> = this.tabStatistics.hero;

        let x: Array<number> = [0];
        let y: Array<number> = [null];

        let maxy: number = 0;
        let lastT = 0;
        let end: number = null;
        for (let i in values){
            if (values[i] != null) {

                if (time[i] - lastT < 15 * 1000){
                    continue;
                }
                if (time[i] > this.stages[this.stages.length - 1].end){
                    if (heroes[i] == hero){
                        end = values[i];
                    }
                    continue;
                }

                lastT = time[i];

                x.push(time[i]);
                if (heroes[i] == hero){
                    y.push(values[i]);
                    maxy = Math.max(maxy, values[i]);
                } else {
                    y.push(null);
                }
            }
        }
        if (end != null){
            x.push(this.stages[this.stages.length - 1].end);
            y.push(end);
            maxy = Math.max(maxy, end);
        }

        this.renderPlotlyGraph([
                {
                    x: x,
                    y: y,
                    name: '',
                    mode: 'lines+markers',
                    'line': {
                        'color': 'rgb(191, 128, 55)',
                        'width': 3,
                        shape: 'spline',
                        smoothing: 0.9
                    }
                }
            ], maxy
         )
    }
    
    renderUniversalStat(stat: string) {
        let time: Array<number> = this.tabStatistics.time;
        let values: Array<number> = this.tabStatistics[stat];
        let heroes: Array<string> = this.tabStatistics.hero;

        if (time.length == 0){
            return;
        }

        let x: Array<number> = [0];
        let y: Array<number> = [0];

        let heroSwapX: Array<number> = [0];
        let heroSwapY: Array<number> = [0];
        let heroSwapName: Array<string> = [this.toHeroName(heroes[0])];
        
        let maxy: number = 0;
        let last = -1;
        let lastHero = heroes[0];
        let lastT = 0;
        let end: number = null;
        for (let i in values){
            if (values[i] != null){
                if ((stat == "damage" || stat == "healing" || stat == "objective_time") && values[i] < last){
                    continue;
                }

                if (time[i] - lastT < 15 * 1000){
                    continue;
                }
                if (time[i] > this.stages[this.stages.length - 1].end){
                    end = values[i];
                    continue;
                }

                lastT = time[i];

                if (heroes[i] != lastHero){
                    heroSwapX.push(time[i] - 1);
                    heroSwapY.push(values[i]);
                    lastHero = heroes[i];
                    heroSwapName.push(this.toHeroName(lastHero));
                }

                last = values[i];
                x.push(time[i]);
                y.push(values[i]);
                maxy = Math.max(maxy, values[i])
            }
        }
        if (end != null){
            x.push(this.stages[this.stages.length - 1].end);
            y.push(end);
            maxy = Math.max(maxy, end);
        }

        this.renderPlotlyGraph([
                {
                    x: x,
                    y: y,
                    name: '',
                    mode: 'lines+markers',
                    'line': {
                        'color': 'rgb(191, 128, 55)',
                        'width': 3,
                        shape: 'spline',
                        smoothing: 0.9
                    }
                },
                {
                    x: heroSwapX,
                    y: heroSwapY,
                    name: '',
                    text: heroSwapName,
                    hoverinfo: 'text',
                    mode: 'markers',
                    marker: {
                        size: 16,
                        color: '#c19400',
                    }
                },
            ], maxy
        )
    }

    renderPlotlyGraph(data: any, maxy: number) {

        let vlines: Array<any> = [];
        for (let stage of this.stages){
            vlines.push({
                'type': 'scatter',
                'x0': stage.end,
                'y0': 0,
                'x1': stage.end,
                'y1': maxy,
                'line': {
                    'color': 'rgb(191, 128, 55)',
                    'width': 3,
                    shape: 'spline',
                    smoothing: 0.9
                }

            });
        }

        Plotly.newPlot('graph', data,
            {
                title: '',
                font: {
                    color: 'rgb(150, 150, 150)'
                },

                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    //showticklabels: false,
                    fixedrange: true,
                    type: 'date',
                    tickformat: "%M:%S",
                    hoverformat: "%M:%S"
                },
                yaxis: {
                    fixedrange: true,
                },

                autosize: true,
                overlaying: false,
                bargroupgap: 0,
                margin: {
                    l: 35,
                    r: 5,
                    b: 30,
                    t: 0
                },
                showlegend: false,
                plot_bgcolor: "rgba(0, 0, 0, 0)",
                paper_bgcolor: "rgba(0, 0, 0, 0)",

                shapes: vlines
            },
            {
                displayModeBar: false,
                staticPlot: false,
                doubleClick: false,
                showTips: false,
                showAxisDragHandles: false,
                showAxisRangeEntryBoxes: false,
                displaylogo: false,
            }
         );

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
        } else if (str == 'hammond'){
            str = 'Wrecking Ball';
        }
        return this.toTitleCase(str);
    } 

}
