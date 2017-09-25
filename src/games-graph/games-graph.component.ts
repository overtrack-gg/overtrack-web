import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { GamesListService, PlayerGameList } from '../games-list/games-list.service';
import { Game } from '../game/game.service';


declare var Plotly: any;

@Component({
    selector: 'games-graph',
    templateUrl: './games-graph.component.html',
    providers: [RouterModule]
})
export class GamesGraphComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;

    constructor(public gamesListService: GamesListService,
                public router: Router,
                public activatedRoute: ActivatedRoute) { }

     ngOnInit(): void {
        this.activatedRoute.params.subscribe(
            params => {
                if (params.hasOwnProperty('share_key')){
                    this.fetchSharedGames(params['share_key']);
                } else {
                    this.fetchOwnGames();
                }
            }
        );
    }

	fetchSharedGames(share_key: string){
        this.gamesListService.fetchSharedGames(share_key,
            res => {
                this.gamesLists = res;
                if (this.gamesLists.length){
                    this.renderGraph(this.gamesLists[0].list);
                }
            },
            err => {
                console.error(err);
            }
        );
    }

    fetchOwnGames() {
        this.gamesListService.fetchGames(
            res => {
                this.gamesLists = res;
                if (this.gamesLists.length){
                    this.renderGraph(this.gamesLists[0].list);
                }
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
        console.log(date);
        return days[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear().toString().slice(2);
    }

    renderGraph(games: Array<Game>): void {
        let sr: Array<number> = [];
        let srX: Array<number> = [];

        let gamePointsText: Array<string> = [];
        let gamePoints: Array<number> = [];
        let gamePointsX: Array<number> = [];

        let xAxisText: Array<string> = [];
        let xAxisPoints: Array<number> = [];

        let index2game: Map<number, Game> = new Map<number, Game>();
        
        let lastDate: string = null;
        let last: number = null;
        let x = 0;
        for (let game of games.slice().reverse()){
            if (game.endSR){
                let currentDate: string = this.formatDate(game.endTime);
                if (lastDate != currentDate){
                    xAxisText.push(currentDate);
                    xAxisPoints.push(x);
                    lastDate = currentDate;
                }
                gamePointsText.push(game.result + ' - ' + game.map); gamePoints.push(game.endSR); gamePointsX.push(x);
                index2game.set(sr.length-1, game);
                sr.push(game.endSR); srX.push(x);
                x += 2;
            } else if (last != null){
                 sr.push(null); srX.push(x++);
            }
            last = game.endSR;
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