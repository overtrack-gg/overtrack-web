import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList } from '../games-list/games-list.service';


declare var Plotly: any;

@Component({
    selector: 'games-graph',
    templateUrl: './games-graph.component.html',
    providers: [GamesListService, RouterModule]
})
export class GamesGraphComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;

    constructor(private gamesListService: GamesListService,
        private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesLists = this.gamesListService.toGamesList(res);
                this.renderGraph(this.gamesLists[0].list);
            },
            err => {
                console.error(err);
            }
        );
    }

    playerHref(playerGames: PlayerGameList){
        return 'player_' + playerGames.player.replace(/\W/g, '_');
    }

    formatDate(date: Date): string {
        var days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
        return days[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear().toString().slice(2);
    }

    renderGraph(games: Array<GamesListEntry>): void {
        let sr: Array<number> = [];
        let srX: Array<number> = [];

        let gamePointsText: Array<string> = [];
        let gamePoints: Array<number> = [];
        let gamePointsX: Array<number> = [];

        let xAxisText: Array<string> = [];
        let xAxisPoints: Array<number> = [];

        let index2game: Map<number, GamesListEntry> = new Map<number, GamesListEntry>();
        
        let lastDate: string = null;
        let last: number = null;
        let x = 0;
        for (let game of games.slice().reverse()){
            if (game.sr){
                let currentDate: string = this.formatDate(game.time);
                if (lastDate != currentDate){
                    xAxisText.push(currentDate);
                    xAxisPoints.push(x);
                    lastDate = currentDate;
                }
                gamePointsText.push(game.result + ' - ' + game.map); gamePoints.push(game.sr); gamePointsX.push(x);
                index2game.set(sr.length-1, game);
                sr.push(game.sr); srX.push(x);
                x += 2;
            } else if (last != null){
                 sr.push(null); srX.push(x++);
            }
            last = game.sr;
        }

        Plotly.newPlot('sr-graph', [
                {
                    x: srX,
                    y: sr,
                    mode: 'lines',
                    hoverinfo: 'skip',
                    line: {
                        color: '#c19400'
                    }
                },
                {
                    x: gamePointsX,
                    y: gamePoints,
                    text: gamePointsText,
                    mode: 'markers',
                    hoverinfo: 'y+text',
                    marker: {
                        size: 8,
                        color: '#c19400',
                    }
                }
            ], 
            {
                title: '',
                font: {
                    color: 'rgb(150, 150, 150)'
                },
                xaxis: {
                    title: '',
                    
                    tickmode: 'array',
                    ticktext: xAxisText,
                    tickvals: xAxisPoints,

                    ticks: '',
                    showgrid: true,
                    gridcolor: 'rgba(0, 0, 0, 0.2)',
                    zeroline: false,
                    fixedrange: true
                },
                yaxis: {
                    fixedrange: true,
                    nticks: 3,
                    side: 'right'
                },
                overlaying: false,
                //bargroupgap: 0,
                margin: {
                    l: 10,
                    r: 40,
                    b: 70,
                    t: 5
                },
                showlegend: false,
                plot_bgcolor: "rgba(0, 0, 0, 0)",
                paper_bgcolor: "rgba(0, 0, 0, 0)",
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