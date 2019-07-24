import { Component, OnInit, AfterContentChecked, Input, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule, ActivatedRoute, Params } from '@angular/router';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import * as D3 from 'd3';
import { DOCUMENT } from '@angular/common';
import * as moment from 'moment';

import { GamesListService, PlayerGameList } from './games-list.service';
import { Game } from '../game/game.service';
import { UserLoginService, User } from '../login/user-login.service';

declare var $: any;
declare var Plotly: any;

@Component({
    selector: 'games-list',
    templateUrl: './games-list.component.html',
    providers: [RouterModule],
    // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GamesListComponent implements OnInit, AfterContentChecked {

    gamesLists: Array<PlayerGameList>;
    visibleGames: Array<Game>;
    gamesByDay: Array<Array<Game>>;

    accountNames: Array<string>;
    currentSR: number;
    player: string;

    isOwnGames = false;

    loaded: boolean = false;
    showUploadingGames = true;
    currentUploadRequested: Date = null;
    currentUserID: number;
    isCompactView: boolean = false;

    gameToEdit: Game = null;

    public linkKey: string;
    public linkMouse: number;

    public hideSR: boolean = false;
    public visibleSeasons: string[] = [];
    public allSeasons: string[] = [];
    public dropdownSettings = {
        enableCheckAll: false,
        itemsShowLimit: 3,
        closeDropDownOnSelection: true,
    };

    private fetchSeasons: Array<string> = [];
    private shareKey: string = null;

    private batchEditURL = 'https://api.overtrack.gg/batch_edit';
    
    constructor(public gamesListService: GamesListService,
                public loginService: UserLoginService,
                public activatedRoute: ActivatedRoute,
                private http: Http,
                public router: Router,
                @Inject(DOCUMENT) public document: any,
                // private cdr: ChangeDetectorRef
            ) { }

    ngOnInit(): void {
        this.activatedRoute.params.subscribe(
            params => {
                if (params.hasOwnProperty('share_key')){
                    this.isOwnGames = false;
                    this.shareKey = params['share_key'];
                    this.fetchSharedGames(this.shareKey);
                } else {
                    this.isOwnGames = true;
                    this.fetchOwnGames();
                }             
            }
        );
        this.isCompactView = (localStorage.getItem('isCompactView') === 'true');
    }

    rank(sr: number) {
        if (sr === null || sr == undefined) {
            return 'unknown';
        } else if (sr < 1500) {
            return 'bronze';
        } else if (sr < 2000) {
            return 'silver';
        } else if (sr < 2500) {
            return 'gold';
        } else if (sr < 3000) {
            return 'platinum';
        } else if (sr < 3500) {
            return 'diamond';
        } else if (sr < 4000) {
            return 'master';
        } else {
            return 'grandmaster';
        }
    }

    ngAfterContentChecked(): void {
        let content: string;
        if (this.isOwnGames){
            content = 'Please <a href="/subscribe">subscribe</a> to view full match details for games played after the trial period has ended';
        } else {
            content = 'In order to view full match details the owner of this game needs to be subscribed';        }
        $('.sub-required').popover({
            trigger: 'focus', 
            placement: 'bottom',
            title: 'Subscription Required',
            content: content,
            html: true,
        });
    }

    setSelectedPlayer(playerName: string){
        this.hideSR = playerName == 'Custom Games' || playerName == 'Quick Play';
        this.player = playerName;
        if (this.isOwnGames && $('#account-input').get(0)){
            $('#account-input').get(0).value = playerName;
        }
        this.updateGamesList();
    }

    updateGamesDropdown(){
    }

    changeSeasonSelection(event) {
    }

    closeDropdown(event) {
        let toFetch = this.visibleSeasons;
        if (toFetch.length == 0){
            toFetch = [ this.allSeasons[0] ];
        }

        if (JSON.stringify(toFetch) != JSON.stringify(this.fetchSeasons)){
            console.log('fetch', toFetch);
            if (this.fetchSeasons == null){
                this.fetchSeasons = Object.assign([], toFetch);
            } else{
                this.fetchSeasons = Object.assign([], toFetch);
                if (this.isOwnGames){
                    this.fetchOwnGames();
                } else {
                    this.fetchSharedGames(this.shareKey);
                }
            }
        }
    }

    myTrackByFunction(index: number, item: Game){
        return item.num;
        // return index;
    }

    fetchSharedGames(share_key: string){
        this.visibleGames = [];
        this.gamesByDay = [];
        this.gamesListService.fetchSharedGames(share_key,
            (games, seasons) => {
                console.log('fetchSharedGames: updating games list');
                this.gamesLists = games;
                this.allSeasons = seasons;
                if (this.gamesLists.length){
                    this.accountNames = this.gamesLists.map(gl => gl.player.toUpperCase().split('#')[0]).filter(e => e != 'CUSTOM GAMES');
                    this.setSelectedPlayer(this.gamesLists[0].player);
                }
                this.loaded = true;
                this.updateGamesList();
            },
            err => {
                console.error(err);
            },
            this.fetchSeasons
        );
        this.showUploadingGames = false;
    }

    fetchOwnGames() {
        this.visibleGames = [];
        this.gamesByDay = [];
        this.gamesListService.fetchGames(
            (games, seasons) => {
                console.log('fetchOwnGames: updating games list');
                this.gamesLists = games;
                this.allSeasons = seasons;
                if (this.gamesLists.length){
                    this.accountNames = this.gamesLists.map(gl => gl.player.toUpperCase().split('#')[0]).filter(e => e != 'CUSTOM GAMES');
                    this.setSelectedPlayer(this.gamesLists[0].player);
                }
                this.loaded = true;
                this.updateGamesList();
            },
            err => {
                console.error(err);
            },
            this.fetchSeasons
        );
        this.showUploadingGames = true;
        this.loginService.getUser().subscribe(user => {
            this.updateUploadingGame(user);
        });
    }

    updateUploadingGame(user: User){
        if (user && user.currentUploadRequested && (new Date().getTime() - user.currentUploadRequested.getTime()) < 10 * 60 * 1000){
            this.currentUserID = user.id;
            this.currentUploadRequested = user.currentUploadRequested;
        } else {
            this.currentUploadRequested = null;
        }
    }
    
    playerHref(playerGames: PlayerGameList){
        return 'player_' + playerGames.player.replace(/\W/g, '_');
    }

    updateGamesList() {
        console.log('updateGamesList');

        if (this.visibleSeasons.length == 0){
            this.visibleSeasons = [ this.allSeasons[0] ];
        }

        let sr: Array<number> = [];
        let gamePoints: Array<number> = [];
        let last: number = null;

        let visibleGames: Array<Game> = [];
        for (let gl of this.gamesLists){
            if (gl.player == this.player){
                for (let g of gl.list){
                    visibleGames.push(g);
                }
            }
        }
        this.visibleGames = visibleGames;
        console.log('set ' + this.visibleGames.length + ' games visible');
        let games: Array<Game> = Object.assign([], this.visibleGames);

        let workingDay = null;
        let dayIndex = -1;
        this.gamesByDay = visibleGames.reduce((days, game) => {
            const gameDate = moment(game.startTime).startOf('day');
            if (!gameDate.isSame(workingDay)) {
                workingDay = gameDate;
                days[++dayIndex] = [];
            }

            days[dayIndex].push(game);
            return days;
        }, []);

        games = games.slice();
        games.reverse();
        if (games.length > 40){
            games = games.slice(sr.length - 40);
        }
        let index2id: Map<number, number> = new Map<number, number>();
        let x = 0;
        for (let game of games){
            if (game.endSR == null){
                if (last != null){
                    sr.push(null);
                    gamePoints.push(null);
                }
            } else {
                if (last != null && last != game.startSR){
                    if (game.startSR != null){
                        sr.push(null);
                        gamePoints.push(null);
                    }
                    sr.push(game.startSR);
                    gamePoints.push(null);
                }
                gamePoints.push(game.endSR);
                sr.push(game.endSR);
                index2id.set(sr.length-1, game.num);
            }
            last = game.endSR;
        }
        this.currentSR = last;

        let srDottedX: Array<number> = [];
        let srDottedY: Array<number> = [];
        for (let i = 1; i < sr.length-1; ++i){
            if (sr[i] == null){
                srDottedX.push(i-2);
                srDottedX.push(i-1);
                srDottedX.push(i+1);
                srDottedX.push(i+2);

                srDottedY.push(null);
                srDottedY.push(sr[i-1]);
                srDottedY.push(sr[i+1]);
                srDottedY.push(null);
            }
        }
        Plotly.newPlot('sr-graph', [
                {
                    y: sr,
                    mode: 'lines',
                    hoverinfo: 'skip',
                    line: {
                        color: '#c19400',
                        shape: 'spline',
                        smoothing: 0.9
                    }
                },
                {
                    y: gamePoints,
                    mode: 'markers',
                    hoverinfo: 'y',
                    marker: {
                        size: 8,
                        color: '#c19400',
                    }
                },
                {
                    x: srDottedX,
                    y: srDottedY,
                    mode: 'lines',
                    hoverinfo: 'skip',
                    line: {
                        dash: 'dot',
                        color: '#c19400',
                        shape: 'spline',
                        smoothing: 0.9
                    } 
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
                if ( player !== this.player) {
                    D3.select('#gametable li.active').classed('active', false);
                    for (const elem of (D3.selectAll('#gametable li') as any)._groups[0]) {
                        const d3elem = D3.select(elem);
                        if (d3elem.select('a').size() && d3elem.select('a').text() === this.player) {
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

        // this.cdr.markForCheck();
    }
    
    route(game: Game, event: any) {
        if (!game.viewable){
            // $('.popover-sub').popover('hide');
            // $('.popover-sub').removeClass('popover-sub');
            // let gameElem = $('#game-' + game.num);
            // gameElem.popover({
            //     trigger: 'focus',
            //     title: 'Subscribe to view full game details',
            //     content: 'Viewing full game details',
            //     placement: 'bottom',
            // });
            // gameElem.popover('show');
            // gameElem.addClass('popover-sub');
        } else if (!game.error && this.linkKey === game.key && this.linkMouse === event.button) {
            if (event.button === 0) { // Left mouse button
                if (event.ctrlKey){
                    window.open('./game/' + game.key);
                } else {
                    this.router.navigate(['/game/' + game.key]);
                }
            } else if (event.button === 1) { // Middle mouse button
                window.open('./game/' + game.key);
            }
        }
       
        this.linkKey = null;
        this.linkMouse = null;
    }

    prepRoute(game: Game, event: any) {
        this.linkKey = game.key;
        this.linkMouse = event.button;
        if (event.button === 1) { // Middle mouse button
            event.preventDefault();
        }
    }

    getFormattedDuration(game: Game) {
      return moment.unix(game.duration).format("m:ss")
    }

    map(game: Game) {
        return game.map.toLowerCase().replace(' ', '-').replace(' ', '-').replace('\'', '').replace(':', '');
    }

    unit(game: Game) {
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

    edit(game: Game, event: any){
        this.gameToEdit = game;
        $("#edit").modal('show');
        event.stopPropagation();
    }

    batchEdit(action: string){
        let accountName = $('#account-input').get(0).value;
        let playername = $('#playername-input').val().toUpperCase();

        if (action == 'delete'){
            if (!confirm('Delete all games beloining to ' + accountName + '? This action cannot be undone.')){
                console.log('Edit canceled');
                $('#batch-edit').modal('hide');
                return;
            }
        } else if (playername.length < 3){
            $('#playername-input').fadeTo(100, 0.3, function() { $(this).fadeTo(500, 1.0); });
            return;
        }

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        $('#batch-edit').find('button').attr('disabled', true);
        this.http.post(
            this.batchEditURL, 
            {
                'action': action,
                'account_name': accountName,
                'player_name': playername
            },
            options
        ).subscribe(
            succ => {
                $('#batch-edit').modal('hide');
                $('#batch-edit').find('button').attr('disabled', false);
                this.document.location.reload();
            },
            err => {
                $('#batch-edit').modal('hide');
                throw err;
            }
        );
    }

    setIsCompact(isCompact) {
        this.isCompactView = isCompact;
        localStorage.setItem('isCompactView', isCompact);

        if (isCompact) {
            $('#gametable table').addClass('compact');
        } else {
            $('#gametable table').removeClass('compact');
        }
    }
}
