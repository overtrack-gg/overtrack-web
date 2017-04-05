import { Component, Input } from '@angular/core';
import { Stage } from '../game.service';

declare var Plotly: any;

@Component({
    selector: 'tab-stats',
    templateUrl: './tab-stats.component.html'
})
export class TabStatisticsComponent {
    @Input() tabStatistics: any;
    @Input() stages: Array<Stage>;
    graphNames: Array<string> = ['damage', 'healing'];

    ngOnInit(): void {
        console.log(this.tabStatistics);

        if (!this.tabStatistics){
            // TODO: say game unsuported
            return;
        }

    }

    ngAfterViewInit(): void {
        this.renderGraph(this.graphNames[0]);
    }

    toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

    renderGraph(name: string) {
        let time: Array<number> = this.tabStatistics.time;
        let values: Array<number> =  this.tabStatistics[name];

        let x: Array<number> = [0];
        let y: Array<number> = [0];

        let maxy: number = 0;
        let last = -1;
        for (let i in values){
            if (values[i] != null){
                if ((name == "damage" || name == "healing" || name == "objective_time") && values[i] < last){
                    continue;
                }

                last = values[i];
                x.push(time[i]);
                y.push(values[i]);
                maxy = Math.max(maxy, values[i])
            }
        }
        x.push(this.stages[this.stages.length - 1].end);
        y.push(y[y.length - 1]);

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

        Plotly.newPlot('graph', [
                {
                    x: x,
                    y: y,
                    mode: 'lines+markers'
                }
            ],
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