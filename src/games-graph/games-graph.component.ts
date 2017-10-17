import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { GamesListService, PlayerGameList } from '../games-list/games-list.service';
import { Game } from '../game/game.service';


declare var Plotly: any;

type SRUnknownReason = null | 'placement' | 'unknown';

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

    graphableGamesLists(gameLists: Array<PlayerGameList>){
        if (!gameLists){
            return 
        }
        return gameLists.filter(gameList => gameList.list.filter(game => game.endSR != null).length >= 2);
    }

    compareGamesChronologically(a: Game, b: Game): number {
        // We add other sort keys to get deterministic results even when
        // multiple games have the same startTime, which has previously
        // happened as a result of errors.
        return (+a.startTime - +b.startTime) || (a.duration - b.duration) || (a.key > b.key ? +1 : -1);
    }

    renderGraph(gameLists: PlayerGameList[]): void {
        // A looping list of colors to use for different accounts on the graph.
        // These must be rgba definitions ending in ', 1)' to allow opacity replacement below.
        const colors = [
            'rgba(255, 193, 0, 1)',
            'rgba(117, 96, 242, 1)',
            'rgba(194, 92, 78, 1)',
            'rgba(142, 194, 0, 1)',
            'rgba(0, 142, 194, 1)',
            'rgba(194, 0, 142, 1)'
        ];

        // The number of recent games to show initially.
        const initialGamesVisible = 100;

        // Data for each game, for each player.
        const unfilteredGames = gameLists.map(x => ({
            player: x.player,
            games: x.list.slice().map(data => ({
                data: data,
                date: data.startTime,
                sr: data.endSR || null,
                srWasUnknownReason: (data.endSR ? null : data.rank == 'placement' ? 'placement' : 'unknown') as SRUnknownReason
            })).sort((a, b) => this.compareGamesChronologically(a.data, b.data))
        }));

        // Estimate SR when possible for games that are missing it.
        const gamesWithEstimates = unfilteredGames.map(x => ({
            player: x.player,
            games: this.fillUnknownSRs(x.games)
        }));

        // Filter out games without an SR (even estimated), and players with fewer than two eligible games.
        const graphableGames = gamesWithEstimates
            .map(x => ({
                player: x.player,
                games: x.games.filter(game => !!game.sr && !!game.date)
            })).filter(x => x.games.length > 2);

        // Indicies of all player arrays below, which will exclude filtered players.
        const playerIndicies = graphableGames.map((l, i) => i);

        // Player names.
        const playerNames = graphableGames.map(l => l.player);

        // Each game's x coordinate is its index when sorted by date with all other graphable games.
        const gamesWithXs = graphableGames.map(x => x.games.map(game => ({
            x: NaN,
            ...game
        })));

        type FullyAnnotatedGame = typeof gamesWithXs[0][0];

        // Graphable games from all players, flattened into a single sorted array.
        const allGames = gamesWithXs.reduce((a, b) => a.concat(b)).sort((a, b) => this.compareGamesChronologically(a.data, b.data));
        const allXs: number[] = [];
        for (let x = 0; x < allGames.length; x++) {
            allGames[x].x = x;
            allXs.push(x);
        }

        // Find all unique dates from all games.
        let lastDateFormatted: string|null = null;
        const allDates = allGames.map(game => {
            const dateFormatted = this.formatDate(game.date);
            if (dateFormatted != lastDateFormatted) {
                lastDateFormatted = dateFormatted;
                return {
                    date: game.date,
                    formatted: dateFormatted,
                    x: game.x
                }
            } else {
                return null;
            }
        }).filter(Boolean);

        // We should probably reference this element in a more Angular way.
        const plotlyElement = document.getElementById('sr-graph');

        // The game data, which will be populated below.
        const plotlyData = [] as {
            games: FullyAnnotatedGame[],
            x: number[],
            y: number[],
            name: string,
            showlegend: boolean,
            legendgroup: string|null,
            hoverinfo: string,
            line: {
                width: number,
                color: string,
            }
        }[];

        // Layout settings, and axes whose values may be populated below.
        const plotlyLayout = {
            title: '',
            font: {
                color: 'rgb(150, 150, 150)'
            },
            hovermode: 'closest',
            dragmode: 'pan',
            xaxis: {
                title: '',

                tickmode: 'array',
                ticktext: [] as string[],
                tickvals: [] as number[],

                ticks: '',
                showgrid: true,
                gridcolor: 'rgba(0, 0, 0, 0.2)',
                zeroline: false,
                fixedrange: false,
                range: [NaN, NaN] as [number, number]
            },
            yaxis: {
                fixedrange: true,
                range: [NaN, NaN] as [number, number],
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
            showlegend: false,
            legend: {
                y: 100,
                x: 0,
                orientation: 'h'
            },
            plot_bgcolor: 'rgba(0, 0, 0, 0)',
            paper_bgcolor: 'rgba(0, 0, 0, 0)',
            shapes: [] as any[]
        };

        // Plotly settings.
        const plotlyConfig = {
            displayModeBar: false,
            staticPlot: false,
            doubleClick: false,
            showTips: false,
            showAxisDragHandles: false,
            showAxisRangeEntryBoxes: false,
            displaylogo: false,
            scrollZoom: true
        };

        // Sample the number of X axis tick values (i.e. dates) to be around 15.
        const nInM = Math.max(1, Math.round(allDates.length / 14));
        const sampledDates = allDates.filter((e, i) => i % nInM == 0);

        // Add x ticks to the Plotly layout data.
        for (const date of sampledDates) {
            plotlyLayout.xaxis.tickvals.push(date.x);
            plotlyLayout.xaxis.ticktext.push(date.formatted);
        }

        // Generate dot and line serises for each player.
        const plotlyDataLines: any[] = [];
        const plotlyDataDots: any[] = [];
        const plotlyLayoutShapes: any[] = [];
        for (const playerIndex of playerIndicies) {
            const color = colors[playerIndex % colors.length];
            const translucent = color.replace(', 1)', ', 0.5)');

            const lineXs: number[] = [];
            const lineSRs: number[] = [];

            const dotXs: number[] = [];
            const dotSRs: number[] = [];
            const dotLabels: string[] = [];

            const shapes: any[] = [];

            const playerName = playerNames[playerIndex];
            const games = gamesWithXs[playerIndex];

            let lastGame: FullyAnnotatedGame = null;
            for (const game of games) {
                if (lastGame && (lastGame.x < game.x - 1)) {
                    // If we're not immediately following the last game,
                    // project its SR value forward to x - 1 so this game
                    // only takes the typical amount of x-space (1).
                    lineXs.push(game.x - 1);
                    lineSRs.push(lastGame.sr);
                }

                lineXs.push(game.x);
                lineSRs.push(game.sr);

                let labelPrefix = '';
                if (game.srWasUnknownReason) {
                    labelPrefix = `SR estimated (${game.srWasUnknownReason})<br>`;
                }
                dotXs.push(game.x);
                dotSRs.push(game.sr);
                dotLabels.push(`${labelPrefix}${game.data.result} - ${game.data.map}`);

                lastGame = game;
            }

            // Project SR line out beyond the end of the graph with latest value.
            lineSRs.push(lineSRs[lineSRs.length - 1]);
            lineXs.push(allXs[allXs.length - 1] + 1024);

            plotlyDataLines.push({
                showlegend: true,
                name: playerName,
                legendgroup: playerName,
                x: lineXs,
                y: lineSRs,
                overtrackGames: games,
                mode: 'lines',
                hoverinfo: 'skip',
                line: {
                    width: 2,
                    color: color,
                }
            });
            
            plotlyDataDots.push({
                showlegend: false,
                name: playerName,
                legendgroup: playerName,
                x: dotXs,
                y: dotSRs,
                overtrackGames: games,
                text: dotLabels,
                mode: 'markers',
                hoverinfo: 'y+text',
                marker: {
                    size: 6,
                    color: translucent
                }
            });

            let runOfUnknownSRGames: null | FullyAnnotatedGame[] = [];
            const outlineRun = () => {
                let minSR = 5000;
                let maxSR = 0;

                for (const game of runOfUnknownSRGames) {
                    if (game.sr < minSR) {
                        minSR = game.sr;
                    }
                    if (game.sr > maxSR) {
                        maxSR = game.sr;
                    }
                }

                for (const game of runOfUnknownSRGames) {
                    plotlyLayoutShapes.push({
                        type: 'rect',
                        xref: 'x',
                        yref: 'y',
                        x0: game.x - 0.5,
                        x1: game.x + 0.5,
                        y0: minSR - 25,
                        y1: maxSR + 25,
                        line: {
                            width: 0,
                            color: color,
                        },
                        layer: 'below',
                        fillcolor: game.srWasUnknownReason == 'placement' ? 'rgba(0, 127, 255, 0.25)' : 'rgba(255, 0, 0, 0.125)',
                    });
                }
            };
            for (const game of games) {
                if (game.srWasUnknownReason) {
                    if (runOfUnknownSRGames) {
                        runOfUnknownSRGames.push(game);
                    } else {
                        runOfUnknownSRGames = [game];
                    }
                } else {
                    if (runOfUnknownSRGames) {
                        outlineRun();
                        runOfUnknownSRGames = null;
                    }
                }
            }
            if (runOfUnknownSRGames) {
                outlineRun();
            }
        }

        // Add the lines and dot series to the Plotly data (arguments go top-to-bottom).
        plotlyData.unshift(...plotlyDataLines, ...plotlyDataDots);

        // Add the shapes/outlines to the Plotly layout.
        plotlyLayout.shapes.push(...plotlyLayoutShapes);

        // Show the legend only if there are multiple players.
        plotlyLayout.showlegend = playerIndicies.length > 1;

        // Define limits for panning/zooming.
        const minLeft = -2;
        const maxRight = allXs[allXs.length - 1] + 2;
        const maxRange = maxRight - minLeft;
        const minRange = 2;
        // Gets the closest legal X range and computed Y range for an input X range.
        const getRanges = (left: number, right: number, enabledTraces: Array<string> | null): {xRange: [number, number], yRange: [number, number]} => {
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

            let minSR = 5000;
            let maxSR = 0;

            for (const game of allGames) {
                if (enabledTraces && enabledTraces.indexOf(game.data.player) == -1){
                    continue;
                }
                if (game.x >= left && game.x <= right) {
                    if (game.sr < minSR) {
                        minSR = game.sr;
                    }
                    if (game.sr > maxSR) {
                        maxSR = game.sr;
                    }
                }
            }

            if (minSR >= maxSR) {
                minSR = 0;
                maxSR = 5000;
            }

            const yPadding = 25;

            return {
                xRange: [left, right],
                yRange: [minSR - yPadding, maxSR + yPadding],
            }
        };

        // Set the initial range to include the last 100 games.
        const intitialLeft = allXs[Math.max(allXs.length - initialGamesVisible, 0)] - 0.5;
        const initialRight = allXs[allXs.length - 1] + 1;
        const initialRanges = getRanges(intitialLeft, initialRight, null);
        plotlyLayout.xaxis.range = initialRanges.xRange;
        plotlyLayout.yaxis.range = initialRanges.yRange;

        // Initial Plotly render.
        Plotly.newPlot(plotlyElement, plotlyData, plotlyLayout, plotlyConfig);

        (plotlyElement as any).on('plotly_click', data => {
            if (data.points.length != 1) {
                return;
            }
            if (!data.points[0].data.overtrackGames) {
                return;
            }
            const game: FullyAnnotatedGame = data.points[0].data.overtrackGames[data.points[0].pointNumber];
            if (!game.data.viewable) {
                return;
            }
            if (data.event.ctrlKey){
                window.open('./game/' + game.data.key);
            } else {
                this.router.navigate(['/game/' + game.data.key]);
            }
        });

        (plotlyElement as any).on('plotly_relayout', eventdata => {  
            let eventSource = 'user';
            if (eventdata['source']){
                eventSource = eventdata['source'];
            }

            let left: number = eventdata['xaxis.range[0]'];
            let right: number = eventdata['xaxis.range[1]'];
            if (eventSource == 'user' && right != undefined && left != undefined){
                const enabledTraces: Array<string> = (plotlyElement as any).data.filter(e => e.showlegend == false && e.visible != 'legendonly').map(e => e.name);
                const {xRange, yRange} = getRanges(left, right, enabledTraces);

                Plotly.relayout(plotlyElement, {
                    'source': 'constrainZoom',
                    'xaxis.range': xRange,
                    'yaxis.range': yRange
                });
            }
        });

        (plotlyElement as any).on('plotly_restyle', eventdata => {
            let left: number = (plotlyElement as any).layout.xaxis.range[0];
            let right: number = (plotlyElement as any).layout.xaxis.range[1];
            const enabledTraces: Array<string> = (plotlyElement as any).data.filter(e => e.showlegend == false && e.visible != 'legendonly').map(e => e.name);
            const {xRange, yRange} = getRanges(left, right, enabledTraces);

            Plotly.relayout(plotlyElement, {
                'source': 'constrainZoom',
                'xaxis.range': xRange,
                'yaxis.range': yRange
            });
        });

    }
    
    // Attaches an estimated SR to games with unknown SR, where possible.
    fillUnknownSRs<T extends {data: Game, sr: number}>(games: T[]): T[] {
        // Create our copies of each game item, to be filled below.
        const filled = games.map(game => (Object.assign({}, game)));

        const srPerMatch = 25;
        const delta = (r: typeof Game.prototype.result, winCoefficient: number = 1.0, lossCoefficient: number = 1.0) => {
            if (r == 'WIN') {
                return +srPerMatch * winCoefficient;
            } else if (r == 'LOSS') {
                return -srPerMatch * lossCoefficient;
            } else if (r == 'DRAW') {
                return 0;
            } else {
                return NaN;
            }
        }

        // If we have a startSR and a result, use that to predict the end SR.
        for (const entry of filled) {
            if (!entry.sr) {
                if (entry.data.startSR) {
                    const result = entry.data.startSR + delta(entry.data.result);
                    if (!isNaN(result)) {
                        entry.sr = result;
                    }
                }
            }
        }

        // If the next game has a startSR, use that for the current end SR.
        let previous: T = null;
        for (const entry of filled) {
            if (previous && !previous.sr) {
                if (entry.data.startSR) {
                    previous.sr = entry.data.startSR;
                }
            }

            previous = entry;
        }

        const unknownSegments: {
            // the anchoring start and end SRs, if known.
            start: number|null, // the SR *before/excluding* the first game
            end: number|null, // the SR *after/including* the last game
            games: T[][], // multiple games together are ties, merged for this
        }[] = [];

        let lastEntry: T = null;
        let currentSegment: typeof unknownSegments[0] = null;

        for (const entry of filled) {
            if (currentSegment) {
                if (entry.sr) {
                    // end the current segment
                    currentSegment.end = entry.data.startSR || entry.sr - (delta(entry.data.result) || 0);
                    currentSegment = null;
                } else {
                    // continue current segment
                    if (entry.data.result == 'DRAW') {
                        // group with previous game
                        currentSegment.games[currentSegment.games.length - 1].push(entry);
                    } else {
                        // append on its own
                        currentSegment.games.push([entry]);
                    }
                }
            } else {
                if (entry.sr) {
                    // carry on between segments
                } else {
                    // start new segment
                    currentSegment = {
                        start: lastEntry && lastEntry.sr || null,
                        end: null,
                        games: [[entry]]
                    }
                    unknownSegments.push(currentSegment);
                }
            }
            lastEntry = entry;
        }
        
        for (const unknown of unknownSegments) {
            if (unknown.games.length == 0) {
                // shouldn't happen.
                continue;
            }

            if (!unknown.start && !unknown.end) {
                // We have nothing to anchor an estimate at, so these remain unknown.
                continue;
            }

            // The amount we predict these games will change the SR.
            let naturalTotalDelta = 0;
            let wins = 0;
            let losses = 0;
            let draws = 0;
            let others = 0;
            for (const entry of unknown.games) {
                const result = entry[0].data.result;
                naturalTotalDelta += delta(result) || 0;
                if (result == 'WIN') wins++;
                else if (result == 'LOSS') losses++;
                else if (result == 'DRAW') draws++;
                else others++;
            }

            if (!unknown.start || !unknown.end) {
                // only one end is anchored, so we can just extrapolate without scaling.
                if (!unknown.start) unknown.start = unknown.end - naturalTotalDelta;
                if (!unknown.end) unknown.end = unknown.start + naturalTotalDelta;

                let sr = unknown.start;
                for (const games of unknown.games) {
                    sr += delta(games[0].data.result) || 0;
                    for (const game of games) {
                        game.sr = Math.round(sr);
                    }
                }

                continue;
            }

            // both ends are anchored, so we need to hit this target delta.
            const knownDelta = unknown.end - unknown.start;

            if (wins > 0 && losses > 0) {
                // scale either wins or losses to be worth more in order to hit target.
                let winCoefficient = 1.0;
                let lossCoefficient = 1.0;
                const lossesNaturalValue = - losses * srPerMatch;
                const shortfall = knownDelta - naturalTotalDelta;
                if (shortfall > 0) {
                    winCoefficient += shortfall / wins / srPerMatch;
                } else if (shortfall < 0) {
                    lossCoefficient += -shortfall / losses / srPerMatch;
                }

                let sr = unknown.start;
                for (const games of unknown.games) {
                    sr += delta(games[0].data.result, winCoefficient, lossCoefficient) || 0;
                    for (const game of games) {
                        game.sr = Math.round(sr);
                    }
                }

                continue;
            }

            // just put them in line from start to end, except for draws.
            let sr = unknown.start;
            for (const games of unknown.games) {
                if (games[0].data.result != 'DRAW') {
                    sr += knownDelta / (unknown.games.length - draws);
                }
                for (const game of games) {
                    game.sr = Math.round(sr);
                }
            }
        }

        return filled;
    }
}
