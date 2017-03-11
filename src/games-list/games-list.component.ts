import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, GamesListRankings } from './games-list.service';
import { UserLoginService, User } from '../login/user-login.service';

@Component({
    selector: 'games-list',
    templateUrl: './games-list.component.html',
    providers: [GamesListService, UserLoginService, RouterModule]
})
export class GamesListComponent implements OnInit {
    gamesList: Array<GamesListEntry>;
    rankings: GamesListRankings;
    user: User;

    constructor(private gamesListService: GamesListService,
                private loginService: UserLoginService,
                private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesList = this.gamesListService.toGamesList(res);
                if (this.user) {
                    this.rankings = this.gamesListService
                        .toKnownRankings(this.gamesList, this.user);
                }
                console.log(res);
            },
            err => {
                console.error(err);
            }
        );
        this.loginService.getUser().subscribe(
            res => {
                this.user = this.loginService.toUser(res);
                if (this.gamesList) {
                    this.rankings = this.gamesListService
                        .toKnownRankings(this.gamesList, this.user);
                }
                
            }
        );
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

    route(id: string) {
        this.router.navigate(['/game/' + id]);
    }

    wltClass(game: GamesListEntry) {
        if (game.result == 'UNKN'){
            return 'text-unknown';
        } else if (game.result == 'DRAW'){
            return 'text-warning';
        } else if (game.result == 'WIN'){
            return 'text-success';
        } else if (game.result == 'LOSS'){
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
        if (sr == null){
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
