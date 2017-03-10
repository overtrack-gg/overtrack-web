import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry } from './games-list.service';

@Component({
    selector: 'games-list',
    templateUrl: './games-list.component.html',
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

    rank(game: GamesListEntry) {
        if (game.sr == null){
            return 'unknown';
        } else if (game.sr < 1500) {
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
