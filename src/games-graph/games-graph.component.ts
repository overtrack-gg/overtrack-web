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
                    this.renderGraph(this.gamesLists);
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
                    this.renderGraph(this.gamesLists);
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
        return days[date.getDay()] + ' ' + date.toLocaleDateString(undefined, {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric'

        });
    }

    formatLabel(game: Game) {
        return game.result + ' - ' + game.map;
    }

    graphableGamesLists(gameLists: Array<PlayerGameList>){
        if (!gameLists){
            return 
        }
        return gameLists.filter(gameList => gameList.list.filter(game => game.endSR != null).length >= 2);
    }

    renderGraph(gameLists: PlayerGameList[]): void {
        const players = gameLists.map(l => l.player);

        type GraphableGame = {
            game: Game,
            playerIndex: number,
            connectedToNext: boolean
        };

        // All graphable games and their continuity in a single flattened sorted list.
        const graphable: GraphableGame[] = [];

        for (const gamesList of gameLists) {
            let lastEntry: GraphableGame = null;
            const playerIndex = players.indexOf(gamesList.player);
            for (const game of Array.from(gamesList.list).reverse()) {
                const entry = {
                    game: game,
                    playerIndex: playerIndex,
                    connectedToNext: false
                };

                if (game.endSR && game.startTime) {
                    graphable.push(entry);

                    // We're connected if the previous game has an end SR and
                    // the current game's start SR matches that end SR or is unknown.
                    if (lastEntry && (game.startSR == null || game.startSR == lastEntry.game.endSR)) {
                        lastEntry.connectedToNext = true;
                    }
                }

                lastEntry = entry;
            }
        }

        graphable.sort((a, b) => +a.game.startTime - +b.game.startTime);

        // The data for the lines and dots for each account's games.
        const playerLineXs: number[][] = players.map(_ => []);
        const playerLineSRs: number[][] = players.map(_ => []);

        const allXs: number[] = [];
        const playerDotXs: number[][] = players.map(_ => []);
        const playerDotSRs: number[][] = players.map(_ => []);
        const playerDotLabels: string[][] = players.map(_ => []);
        const playerDotGames: Game[][] = players.map(_ => []);

        // The last-graphed entry for each account.
        const playerLastEntries: GraphableGame[] = players.map(_ => null);

        // Dates on the x-axis, common to all accounts.
        let xAxisText: string[] = [];
        let xAxisPoints: number[] = [];

        // A looping list of colors to use for different accounts on the graph.
        const colors = ['#c19400', '#7560f2', '#c2004e', '#8ec200', '#008ec2', '#c2008e'];

        let x = 0;
        let lastDate: string = null;
        let lastEntry = null;
        for (const entry of graphable) {
            const {playerIndex, game, connectedToNext} = entry;

            const playerLastEntry = playerLastEntries[playerIndex];

            if (playerLastEntry) {
                if (playerLastEntry.connectedToNext) {
                    if (playerLastEntry != lastEntry) {
                        playerLineXs[playerIndex].push(x - 1);
                        playerLineSRs[playerIndex].push(playerLastEntry.game.endSR);
                    }
                } else {
                    playerLineXs[playerIndex].push(x);
                    playerLineSRs[playerIndex].push(null);

                    if (playerLastEntry == lastEntry) {
                        // If we're immediately following a non-connected game on the same
                        // account, insert a gap to make it clear they're separate.
                        x++;
                    }
                }
            }

            playerDotXs[playerIndex].push(x);
            playerDotSRs[playerIndex].push(game.endSR);
            playerDotGames[playerIndex].push(game);
            playerDotLabels[playerIndex].push(this.formatLabel(game));

            if ((playerLastEntry && playerLastEntry.connectedToNext) || connectedToNext) {
                playerLineXs[playerIndex].push(x);
                allXs.push(x);
                playerLineSRs[playerIndex].push(game.endSR);
            }

            const date: string = this.formatDate(entry.game.startTime);
            if (lastDate != date){
                xAxisText.push(date);
                xAxisPoints.push(x);
                lastDate = date;
            }

            x++;
            playerLastEntries[playerIndex] = entry;
            lastEntry = entry;
        }

        // Sample the number of X axis tick values (i.e. dates) to be around 15
        let nInM = Math.max(1, Math.round(xAxisText.length / 14))
        xAxisText = xAxisText.filter((e, i) => i % nInM == 0)
        xAxisPoints = xAxisPoints.filter((e, i) => i % nInM == 0)

        // List of data series for Plotly.
        const data: any[] = [];

        // We need to specify the series in the order we want them drawn:
        // lines under dots, then least-recent accounts under more-recent.
        let colorIndex = 0;
        for (let i = players.length - 1; i >= 0; i--) {
            if (playerLineXs[i].length < 2){
                continue;
            }
            const color = colors[colorIndex++ % colors.length];
            data.push({
                showlegend: false,
                name: players[i],
                legendgroup: players[i],
                x: playerLineXs[i],
                y: playerLineSRs[i],
                mode: 'lines',
                hoverinfo: 'skip',
                line: {
                    color: color
                }
            });
        }

        colorIndex = 0;
        for (let i = players.length - 1; i >= 0; i--) {
            if (playerLineXs[i].length < 2){
                continue;
            }
            const color = colors[colorIndex++ % colors.length];
            data.push({
                name: players[i],
                legendgroup: players[i],
                x: playerDotXs[i],
                y: playerDotSRs[i],
                overtrackGames: playerDotGames[i],
                text: playerDotLabels[i],
                mode: 'markers',
                hoverinfo: 'y+text',
                marker: {
                    size: 6,
                    color: color,
                }
            });
            
        }

        // We should probably reference this element in a more Angular way.
        const plotEl = document.getElementById('sr-graph');

        // set the initial zoom to include the last 100 games
        const intitialLeft = allXs[Math.max(allXs.length - 100, 0)] - 0.5;
        const initialRight = allXs[allXs.length - 1] + 1;

        const calculateYAxisRange = (left: number, right: number): [number, number] => {
            let gamesInRange = 0;
            let minX = +Infinity;
            let maxX = -Infinity;
            let minSR = +Infinity;
            let maxSR = -Infinity;

            const defaultRange: [number, number] = [1000, 3000];

            for (let playerIndex = 0; playerIndex < players.length; playerIndex++) {
                for (let dotIndex = 0; dotIndex < playerDotXs[playerIndex].length; dotIndex++) {
                    const x = playerDotXs[playerIndex][dotIndex];
                    const sr = playerDotSRs[playerIndex][dotIndex];
                    if (x >= left && x <= right) {
                        gamesInRange++;
                        if (sr < minSR) {
                            minSR = sr;
                        }
                        if (sr > maxSR) {
                            maxSR = sr;
                        }
                        if (x < minX) {
                            minX = x;
                        }
                        if (x > maxX) {
                            maxX = x;
                        }
                    }
                }
            }

            if (gamesInRange == 0) {
                return defaultRange;
            } else {
                const padding = 25;
                return [minSR - padding, maxSR + padding];
            }
        };

        const layout = {
            title: '',
            font: {
                color: 'rgb(150, 150, 150)'
            },
            hovermode: 'closest',
            dragmode: 'pan',
            xaxis: {
                title: '',
                
                tickmode: 'array',
                ticktext: xAxisText,
                tickvals: xAxisPoints,

                ticks: '',
                showgrid: true,
                gridcolor: 'rgba(0, 0, 0, 0.2)',
                zeroline: false,
                fixedrange: false,
                range: [intitialLeft, initialRight]
            },
            yaxis: {
                fixedrange: true,
                range: calculateYAxisRange(intitialLeft, initialRight),
                nticks: 3,
                side: 'right'
            },
            overlaying: false,
            margin: {
                l: 10,
                r: 40,
                b: 70,
                t: 5
            },
            showlegend: players.length > 1,
            legend: {
                y: 100,
                x: 0,
                orientation: 'h'
            },
            plot_bgcolor: 'rgba(0, 0, 0, 0)',
            paper_bgcolor: 'rgba(0, 0, 0, 0)',
        };

        const config = {
            displayModeBar: false,
            staticPlot: false,
            doubleClick: false,
            showTips: false,
            showAxisDragHandles: false,
            showAxisRangeEntryBoxes: false,
            displaylogo: false,
            scrollZoom: true
        };

        Plotly.newPlot(plotEl, data, layout, config);

        (plotEl as any).on('plotly_click', data => {
            if (data.points.length != 1) {
                return;
            }
            if (!data.points[0].data.overtrackGames) {
                return;
            }
            const game:Game = data.points[0].data.overtrackGames[data.points[0].pointNumber];
            if (!game.viewable) {
                return;
            }
            if (data.event.ctrlKey){
                window.open('./game/' + game.key);
            } else {
                this.router.navigate(['/game/' + game.key]);
            }
        });

        const minLeft = -1;
        const maxRight = initialRight;
        const maxRange = maxRight - minLeft;
        const minRange = 2;
        (plotEl as any).on('plotly_relayout', eventdata => {  

            // prevent the user panning/zooming outside the range of games played
            let eventSource = 'user';
            if (eventdata['source']){
                eventSource = eventdata['source'];
            }

            let left: number = eventdata['xaxis.range[0]'];
            let right: number = eventdata['xaxis.range[1]'];
            if (right != undefined && left != undefined){
                let range = right - left;

                if (range > maxRange) {
                    const excess = range - maxRange;
                    range = maxRange;
                    left += excess / 2;
                    right -= excess / 2;
                } else if (range < minRange) {
                    const shortfall = minRange - range;
                    range = minRange;
                    left -= shortfall / 2;
                    right += shortfall / 2;
                }

                if (left < minLeft) {
                    left = minLeft;
                    right = left + range;
                } else if (right > maxRight) {
                    right = maxRight;
                    left = right - range;
                }

                if (eventSource == 'user'){
                    Plotly.relayout(plotEl, {
                        'source': 'constrainZoom',
                        'xaxis.range': [left, right],
                        'yaxis.range': calculateYAxisRange(left, right)
                    });
                }
            }
        });
    }
}
