import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';
import 'rxjs/add/operator/switchMap';

import { GameService, Game, KillFeedEntry, Stage, GameHero, GameEvent} from './game.service';
import { UserLoginService } from '../login/user-login.service';


@Component({
    selector: 'metagame',
    templateUrl: './metagame.component.html'
})
export class MetaGameComponent  implements OnInit {
    @Input() id: string;
    data: any;
    hide: boolean;
    
    constructor(private gameService: GameService) {}
    
    ngOnInit(): void {
        this.hide = true;
        this.gameService.getMetaGame(this.id).subscribe(
                res => {
                    const body = res.json();
                    this.data = body;
                },
                err => {
                    console.error(err);
                }
            );
    }
     
     toggleMeta() {
         this.hide = !this.hide;
     }
      
     keys(obj: any, remove: Array<string>) {
         if (obj) {
            return Object.keys(obj).filter((a) => !remove.includes(a));
         }
         return [];
     }
}

@Component({
    selector: 'game',
    templateUrl: './game.component.html',
    providers: [GameService, UserLoginService]
})
export class GameComponent implements OnInit {
    game: Game;

    constructor(private gameService: GameService, private route: ActivatedRoute, private loginService: UserLoginService) { }

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
        if (!this.loginService.getUser()) {
            this.loginService.fetchUser(() => {});
        }
    }

    normaliseString(str: string){
        return str.toLowerCase().replace(' ', '_').replace(/\W/g, '').replace('_', '-');
    }

    stageHref(stage: Stage){
        return 'stage_' + stage.index;
    }

    mapClass() {
        if (this.game === null) {
            return '';
        }
        return this.normaliseString(this.game.map);
    }
    
    wltClass() {
        if (this.game.result == 'UNKN' || !this.game.result){
            return 'text-unknown';
        } else if (this.game.result == 'DRAW'){
            return 'text-warning';
        } else if (this.game.result == 'WIN'){
            return 'text-success';
        } else if (this.game.result == 'LOSS'){
            return 'text-danger';
        }
        throw new Error('Unexpected game result: ' + this.game.result);
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
