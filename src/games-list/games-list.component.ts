import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import * as D3 from 'd3';

import { GamesListService, GamesListEntry, PlayerGameList, GamesListRankings } from './games-list.service';
import { UserLoginService, User } from '../login/user-login.service';


declare var Plotly: any;

@Component({
    selector: 'games-list',
    templateUrl: './games-list.component.html',
    providers: [GamesListService, UserLoginService, RouterModule]
})
export class GamesListComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;
    rankings: GamesListRankings;

    private linkKey: string;
    private linkMouse: number;

    constructor(private gamesListService: GamesListService,
                private loginService: UserLoginService,
                private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesLists = this.gamesListService.toGamesList(res);
                const user = this.loginService.getUser();
                if (user) {
                    this.rankings = this.gamesListService.toKnownRankings(this.gamesLists, user);
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
                if (this.gamesLists) {
                    const user = this.loginService.getUser();
                    this.rankings = this.gamesListService.toKnownRankings(this.gamesLists, user);
                    this.renderGraph(user);
                }

            });
        }
    }
    
    playerHref(playerGames: PlayerGameList){
        return 'player_' + playerGames.player.replace(/\s/, '_');
    }

    renderGraph(user: User) {
        let sr: Array<number> = [];
        let last: number = null;
        let playerName = user.battletag.split('#')[0].split('0').join('O').toUpperCase();
        let games = [];
        for (let playerGames of this.gamesLists) {
            if (playerGames.player == playerName) {
                games = playerGames.list;
            }
        }
        games = games.slice();
        games.reverse();
        let index2id: Map<number, number> = new Map<number, number>();
        for (let game of games){
            // TODO: multiple tabs for multiple players in the same account
            if (game.sr != null && game.startSR != null){
                if (last != game.startSR){
                    sr.push(null);
                    if (game.startSR) {
                        sr.push(game.startSR);
                        index2id.set(sr.length-2, game.num);
                    }
                }    
                sr.push(game.sr);
                index2id.set(sr.length-2, game.num);
            }
            last = game.sr;
        }
        if (sr.length > 40){
            sr = sr.slice(sr.length - 40);
        }
        
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
                    color: '#c19400',
                    size: 8
                }
            }], 
            {
                title: '',
                font: {
                    color: 'rgb(150, 150, 150)'
                },
                xaxis: {
                    showgrid: false,
                    zeroline: false,
                    showticklabels: false,
                    fixedrange: true
                },
                yaxis: {
                    fixedrange: true,
                    nticks: 3,
                    side: 'right'
                },
                overlaying: false,
                bargroupgap: 0,
                margin: {
                    l: 10,
                    r: 40,
                    b: 5,
                    t: 5
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
            if (index2id.get(data.points[0].pointNumber)) {
                const element = document.getElementById('game-' + index2id.get(data.points[0].pointNumber));
                const player = D3.select('#gametable li.active a').text();
                if ( player !== playerName) {
                    D3.select('#gametable li.active').classed('active', false);
                    for (const elem of (D3.selectAll('#gametable li') as any)._groups[0]) {
                        const d3elem = D3.select(elem);
                        if (d3elem.select('a').size() && d3elem.select('a').text() === playerName) {
                            d3elem.classed('active', true);
                            const href = d3elem.select('a').attr('href');
                            D3.select('#gametable div.active').classed('active', false);
                            D3.select(href).classed('active', true);
                        } 
                    }
                }
                window.scrollTo(0, element.offsetTop);
                if (activeElement){
                    activeElement.classList.remove('active');
                }
                element.classList.add('active');
                activeElement = element;
            }
        });

    }
    
    formatTime(date: Date) {
        let hour = date.getHours();
        const pm = hour > 11;
        hour = hour % 12;
        hour = hour === 0 ? 12 : hour;
        let min: number|string = date.getMinutes();
        if (min < 10){
            min = '0' + min;
        }
        return hour + ':' + min + (pm ? 'pm' : 'am');
    }
    
    formatDate(date: Date) {
        return date.getDate() + '/' + date.getMonth() + '/' + date.getFullYear().toString().slice(2);
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
