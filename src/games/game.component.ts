import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { GameService, Game, KillFeedEntry, GameHero, Stage} from './game.service.js';

@Component({
    selector: 'timeline',
    templateUrl: 'games/timeline.component.html'
})
export class TimelineComponent {
    @Input() stage: Stage;

    widthPercentage(hero: GameHero) {
        return 75 * (hero.end - hero.start) / (this.stage.end - this.stage.start);
    }

    isKOTH() {
        return 'ownership' in this.stage.objectiveInfo;
    }
}

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

    normaliseString(str: string){
        return str.toLowerCase().replace(' ', '-').replace('\'', '');
    }

    stageHref(stage: Stage){
        return 'stage_' + this.normaliseString(stage.name);
    }

    mapClass() {
        if (this.game === null) {
            return '';
        }
        return this.normaliseString(this.game.map);
    }

    leftColor(kill: KillFeedEntry) {
        if (kill.isLeftRed) {
            return 'text-red';
        }
        return 'text-blue';
    }

    rightColor(kill: KillFeedEntry) {
        if (kill.isLeftRed) {
            return 'text-blue';
        }
        return 'text-red';
    }

    time(kill: KillFeedEntry) {
        let secs = Math.floor(kill.time / 1000);
        let mins = Math.floor(secs / 60);
        secs = secs - 60 * mins;
        let secd = secs < 10 ? '0' + secs : secs;
        return mins + ':' + secd;
    }
}
