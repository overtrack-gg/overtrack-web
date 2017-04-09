import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

declare var Plotly: any;

// ಠ_ಠ 
export let heroStatNames = {
	'genji': ['weapon accuracy', 'damage reflected', 'kill streak - best', 'dragonblade kills', 'final blows'],
	'mccree': ['weapon accuracy', 'critical hits', 'kill streak - best', 'deadeye kills', 'final blows', 'fan the hammer kills'],
	'pharah': ['weapon accuracy', 'barrage kills', 'kill streak - best', 'rocket direct hits', 'final blows'],
	'reaper': ['weapon accuracy', 'death blossom kills', 'kill streak - best', 'souls consumed', 'final blows'],
	's76': ['weapon accuracy', 'helix rocket kills', 'kill streak - best', 'tactical visor kills', 'final blows'],
	'sombra': ['weapon accuracy', 'enemies hacked', 'kill streak - best', 'enemies emp\'d', 'offensive assists'],
	'tracer': ['weapon accuracy', 'pulse bomb kills', 'kill streak - best', 'pulse bombs attatched', 'final blows'],
	'bastion': ['weapon accuracy', 'sentry kills', 'kill streak - best', 'tank kills', 'recon kills', 'self healing'],
	'hanzo': ['weapon accuracy', 'critical hits', 'kill streak - best', 'recon assists', 'final blows', 'dragonstrike kills'],
	'junkrat': ['weapon accuracy', 'enemies trapped', 'kill streak - best', 'rip-tire kills', 'final blows'],
	'mei': ['damage blocked', 'blizzard kills', 'kill streak - best', 'self healing', 'enemies frozen'],
	'torb': ['weapon accuracy', 'turret kills', 'kill streak - best', 'molten core kills', 'torbjorn kills', 'armor packs created'],
	'widowmaker': ['recon assists', 'scoped accuracy', 'kill streak - best', 'scoped critical hits', 'final blows'],
	'dva': ['weapon accuracy', 'self-destruct kills', 'kill streak - best', 'mechs called', 'damage blocked'],
	'orisa': ['weapon accuracy', 'offensive assists', 'kill streak - best', 'damage amplified', 'damage blocked'],
	'reinhardt': ['damage blocked', 'fire strike kills', 'kill streak - best', 'earthshatter kills', 'charge kills'],
	'roadhog': ['weapon accuracy', 'hook accuracy', 'kill streak - best', 'self healing', 'enemies hooked', 'whole hog kills'],
	'winston': ['damage blocked', 'players knocked back', 'kill streak - best', null, 'melee kills'],
	'zarya': ['damage blocked', 'average energy', 'kill streak - best', 'graviton surge kills', 'high energy kills'],
	'ana': ['unscoped accuracy', 'nano boost assists', 'scoped accuracy', 'enemies slept', 'defensive assists'],
	'lucio': ['weapon accuracy', 'offensive assists', 'kill streak - best', 'defensive assists', 'sound barriers provided'],
	'mercy': ['offensive assists', 'blaster kills', 'defensive assists', 'damage amplified', 'players resurrected'],
	'symmetra': ['sentry turret kills', 'players teleported', 'kill streak - best', 'teleporter uptime', 'damage blocked'],
	'zenyatta': ['weapon accuracy', 'defensive assists', 'kill streak - best', 'best transcendance heal', 'offensive assists'],
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

        // if we ever healed then add the healing graph
        for (let h of this.tabStatistics.healing){
            if (h){
                this.graphNames.push('healing');
                break;
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
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
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
        for (let i in values){
            if (values[i] != null) {
                x.push(time[i]);
                if (heroes[i] == hero){
                    y.push(values[i]);
                    maxy = Math.max(maxy, values[i]);
                } else {
                    y.push(null);
                }
            }
        }
        x.push(this.stages[this.stages.length - 1].end);
        y.push(null);

        this.renderPlotlyGraph([
                {
                    x: x,
                    y: y,
                    name: '',
                    mode: 'lines+markers'
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
        let heroSwapName: Array<string> = [heroes[0]];
        
        let maxy: number = 0;
        let last = -1;
        let lastHero = heroes[0];
        for (let i in values){
            if (values[i] != null){
                if ((stat == "damage" || stat == "healing" || stat == "objective_time") && values[i] < last){
                    continue;
                }

                if (heroes[i] != lastHero){
                    heroSwapX.push(time[i] - 1);
                    heroSwapY.push(values[i]);
                    lastHero = heroes[i];
                    heroSwapName.push(lastHero);
                }

                last = values[i];
                x.push(time[i]);
                y.push(values[i]);
                maxy = Math.max(maxy, values[i])
            }
        }
        x.push(this.stages[this.stages.length - 1].end);
        y.push(y[y.length - 1]);

        this.renderPlotlyGraph([
                {
                    x: x,
                    y: y,
                    name: '',
                    mode: 'lines+markers'
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
                'type': 'line',
                'x0': stage.end,
                'y0': 0,
                'x1': stage.end,
                'y1': maxy,
                'line': {
                    'color': 'rgb(191, 128, 55)',
                    'width': 3,
                }
            });
        }
        vlines.pop();

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

}