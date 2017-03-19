import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, GamesListRankings } from './games-list.service';
import { UserLoginService, User } from '../login/user-login.service';


declare var Plotly: any;

@Component({
    selector: 'games-list',
    templateUrl: './games-list.component.html',
    providers: [GamesListService, UserLoginService, RouterModule]
})
export class GamesListComponent implements OnInit {
    gamesList: Array<GamesListEntry>;
    rankings: GamesListRankings;

    private linkKey: string;
    private linkMouse: number;

    constructor(private gamesListService: GamesListService,
                private loginService: UserLoginService,
                private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesList = this.gamesListService.toGamesList(res);
                const user = this.loginService.getUser();
                if (user) {
                    this.rankings = this.gamesListService.toKnownRankings(this.gamesList, user);
                    this.renderGraph(user);
                }
                console.log(res);
            },
            err => {
                console.error(err);
            }
        );
        // Only fetch if user has not been fetched
        if (!this.loginService.getUser()) {
            this.loginService.fetchUser(() => {
                if (this.gamesList) {
                    const user = this.loginService.getUser();
                    console.log(user);
                    this.rankings = this.gamesListService.toKnownRankings(this.gamesList, user);
                    this.renderGraph(user);
                }

            });
        }
    }

    renderGraph(user: User) {
        let sr: Array<number> = [];
        let last: number = null;
        let playerName = user.battletag.split('#')[0].split('0').join('O').toUpperCase();
        let games = this.gamesList.slice();
        games.reverse();
        let index2id: Map<number, number> = new Map<number, number>();
        for (let game of games){
            // TODO: multiple tabs for multiple players in the same account
            if (game.player == playerName){
                if (game.sr != null && game.startSR != null){
                    if (last != game.startSR){
                        sr.push(null);
                    }    
                    sr.push(game.sr);
                    index2id.set(sr.length - 1, game.num);
                }
                last = game.sr;
            }
        }
        if (sr.length > 40){
            sr = sr.slice(sr.length - 40);
        }
        console.log(index2id);
        
        Plotly.newPlot('sr-graph', [
            {
                y: sr,
                mode: 'lines+markers',
                hoverinfo: 'y',
                line: {
                    shape: 'spline',
                    smoothing: 1
                },
                marker: {
                    color: '#e305f8',
                    size: 8
                }
            }], 
            {
                title: '',
                font: {
                    color: 'rgb(200, 200, 200)'
                },
                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    fixedrange: true
                },
                yaxis: {
                    fixedrange: true
                },
                overlaying: false,
                bargroupgap: 0,
                margin: {
                    l: 40,
                    r: 0,
                    b: 0,
                    t: 0
                },
                showlegend: false,
                plot_bgcolor: "rgba(0,0,0,0)",
                paper_bgcolor: "rgba(0.1,0.1,0.14,0.8)",
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

        class CustomHTMLElement extends HTMLElement {
            constructor() {
                super();
            }
            on(event_type, cb) {}
        }

        let plot = <CustomHTMLElement>document.getElementById('sr-graph');
        let activeElement = null;
        plot.on('plotly_click', function(data){
            let element = document.getElementById('game-' + index2id.get(data.points[0].pointNumber));
            window.scrollTo(0, element.offsetTop);
            if (activeElement){
                activeElement.classList.remove('active');
            }
            element.classList.add('active');
            activeElement = element;
        });

    }

    currentSR() {
        if (this.rankings && this.rankings.current) {
            return this.rankings.current;
        }
        return null;
    }
    minSR() {
        if (this.rankings && this.rankings.current) {
            return this.rankings.min;
        }
        return null;
    }
    maxSR() {
        if (this.rankings && this.rankings.current) {
            return this.rankings.max;
        }
        return null;
    }
    avgSR() {
        if (this.rankings && this.rankings.current) {
            return this.rankings.avg;
        }
        return null;
    }

    route(id: string, event: any) {
        console.log(event.button);
        if (this.linkKey === id && this.linkMouse === event.button) {
            if (event.button === 0) { // Left mouse button
                this.router.navigate(['/game/' + id]);
            } else if (event.button === 1) { // Middle mouse button
                window.open('./game/' + id);
            }
        }
        this.linkKey = null;
        this.linkMouse = null;
    }

    prepRoute(id: string, event: any) {
        this.linkKey = id;
        this.linkMouse = event.button;
        if (event.button === 1) { // Middle mouse button
            event.preventDefault();
        }
    }


    wltClass(game: GamesListEntry) {
        if (game.result === 'UNKN') {
            return 'text-unknown';
        } else if (game.result === 'DRAW') {
            return 'text-warning';
        } else if (game.result === 'WIN') {
            return 'text-success';
        } else if (game.result === 'LOSS') {
            return 'text-danger';
        }
        throw new Error('Unexpected game result: ' + game.result);
    }

    min(game: GamesListEntry) {
        return Math.round(game.duration / 60);
    }

    map(game: GamesListEntry) {
        return game.map.toLowerCase().replace(' ', '-').replace(' ', '-').replace('\'', '').replace(':', '');
    }

    unit(game: GamesListEntry) {
        /* if (game.map === 'Nepal'
           || game.map === 'Volskaya Industries'
           || game.map === 'Hanamura'
           || game.map === 'Temple of Anubis'
           || game.map === 'Ilios'
           || game.map === 'Lijiang Tower'
           || game.map === 'Oasis') {
            return '';
        }
        return 'm'; */
        return '';
    }

    rank(sr: number) {
        if (sr === null) {
            return 'unknown';
        } else if (sr < 1500) {
            return 'bronze';
        } else if (sr < 2000) {
            return 'silver';
        } else if (sr < 2500) {
            return 'gold';
        } else if (sr < 3000) {
            return 'platinium';
        } else if (sr < 3500) {
            return 'diamond';
        } else if (sr < 4000) {
            return 'master';
        } else {
            return 'grandmaster';
        }
    }
}
