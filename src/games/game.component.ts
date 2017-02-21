import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { GameService, Game, KillFeedEntry, GameHero } from './game.service.js';

@Component({
    selector: 'game',
    templateUrl: 'games/game.component.html',
    providers: [GameService]
})
export class GameComponent implements OnInit {
    game: Game;

    constructor(private gameService: GameService, private route: ActivatedRoute) { }

    ngOnInit(): void {
        this.route.params
            .switchMap((params: Params) =>
                       this.gameService.getGame(params['user'] + '/' + params['game']))
            .subscribe(
                res => {
                    this.game = this.gameService.toGame(res);
                },
                err => {
                    console.error(err);
                }
            );
    }

    mapClass() {
        if (this.game === null) {
            return '';
        }
        return this.game.map.toLowerCase().replace(' ', '-').replace('\'', '');
    }

    playedPercentage(hero: GameHero, all: Array<GameHero>) {
        let sum = 0;
        all.forEach((h) => sum += h.timePlayed);
        
        return 75 * hero.timePlayed / sum;
    }

    leftColor(kill: KillFeedEntry) {
        if (kill.isLeftRed) {
            return 'text-danger';
        }
        return 'text-info';
    }

    rightColor(kill: KillFeedEntry) {
        if (kill.isLeftRed) {
            return 'text-info';
        }
        return 'text-danger';
    }

    time(kill: KillFeedEntry) {
        let secs = Math.floor(kill.time / 1000);
        let mins = Math.floor(secs / 60);
        secs = secs - 60 * mins;
        let secd = secs < 10 ? '0' + secs : secs;
        return mins + ':' + secd;
    }
}
