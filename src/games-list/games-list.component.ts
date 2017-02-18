import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry } from './games-list.service.js';

@Component({
    selector: 'games-list',
    templateUrl: 'games-list/games-list.component.html',
    providers: [GamesListService, RouterModule]
})
export class GamesListComponent implements OnInit {
    gamesList: Array<GamesListEntry>;

    constructor(private gamesListService: GamesListService, private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesList = this.gamesListService.toGamesList(res);
                console.log(res);
            },
            err => {
                console.error(err);
            }
        );
    }

    route(id: string) {
        this.router.navigate(['/game/' + id]);
    }

    wlt(game: GamesListEntry) {
        return game.srChange > 0 ? 'WIN' : game.srChange === 0 ? 'DRAW' : 'LOSS';
    }

    wltClass(game: GamesListEntry) {
        return game.srChange > 0 ? 'text-success' : game.srChange === 0 ? 'text-warning' : 'text-danger';
    }

    min(game: GamesListEntry) {
        return Math.round(game.duration / 60);
    }

    map(game: GamesListEntry) {
        return game.map.toLowerCase().replace(' ', '-').replace('\'', '');
    }

    unit(game: GamesListEntry) {
        if (game.map === 'Nepal'
           || game.map === 'Volskaya Industries'
           || game.map === 'Hanamura'
           || game.map === 'Temple of Anubis'
           || game.map === 'Ilios'
           || game.map === 'Lijiang Tower'
           || game.map === 'Oasis') {
            return '';
        }
        return 'm';
    }

    rank(game: GamesListEntry) {
        if (game.sr < 1500) {
            return 'bronze';
        } else if (game.sr < 2000) {
            return 'silver';
        } else if (game.sr < 2500) {
            return 'gold';
        } else if (game.sr < 3000) {
            return 'platinium';
        } else if (game.sr < 3500) {
            return 'diamond';
        } else if (game.sr < 4000) {
            return 'master';
        } else {
            return 'grandmaster';
        }
    }
}
