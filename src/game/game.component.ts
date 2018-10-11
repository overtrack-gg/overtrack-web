import { Component, OnInit, AfterContentChecked, Input, Inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';
import * as D3 from 'd3';
import { GameService, Game, KillFeedEntry, Stage, GameHero, GameEvent} from './game.service';
import { UserLoginService, User } from '../login/user-login.service';

declare var $: any;

@Component({
    selector: 'metagame',
    templateUrl: './metagame.component.html'
})
export class MetaGameComponent  implements OnInit {
    @Input() id: string;
    data: any;
    hide: boolean;
    
    constructor(
        private gameService: GameService
    ) {}
    
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
    providers: [GameService]
})
export class GameComponent implements OnInit, AfterContentChecked {
    game: Game;
    hideTimelineKey: boolean;
    user: User;
    currentTab: Stage;
    showVod = false;

    constructor(
        public gameService: GameService, 
        public router: Router,
        public route: ActivatedRoute, 
        public loginService: UserLoginService,
        @Inject(DOCUMENT) public document: any
    ) { }

    ngOnInit(): void {
        this.hideTimelineKey = true;
        this.route.params.subscribe(
        params => {
            this.gameService.getGame(params['user'] + '/' + params['game']).subscribe(
                res => {
                    this.game = this.gameService.toGame(res);
                    console.log(this.game);
                    this.currentTab = this.game.stages[0];
                },
                err => {
                    console.error(err);
                }
            );        
        });
        let loaded = false;
        this.route.queryParams.subscribe(params => {
            if (!loaded){
                loaded = true;
                if (params.hasOwnProperty('vod') && params.vod == 'true'){
                    this.showVod = true;

                }
            }
        });
        this.loginService.getUser().subscribe(user => {
            this.user = user;
        })
    }

    ngAfterContentChecked(): void {
        $(document).ready(function(){
            $('[data-toggle="popover"]').popover(); 
        });
    }

    toggleVOD() {
        this.showVod = !this.showVod;
        if (this.showVod){
            this.router.navigate(['.'], { relativeTo: this.route, replaceUrl: true, queryParams: { 'vod': 'true' }});
        } else {
            this.router.navigate(['.'], { relativeTo: this.route, replaceUrl: true, queryParams: {  }});
        }
    }

    changeTab(stage: Stage){
        this.currentTab = stage;
    }
    
    toggleTimelineKey() {
        this.hideTimelineKey = !this.hideTimelineKey;
    }

    normaliseString(str: string){
        return str.toLowerCase().replace(/\s/g, '_').replace(/\W/g, '').replace(/_/g, '-');
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
    
    displaySR(sr: number) {
        if (sr === null || sr == undefined) {
            return '?';
        }
        return '' + sr;
    }
    
    displayGameTime() {
        const time = this.game.duration;
        const min = D3.format('d')(Math.floor(time / 60));
        const sec = D3.format('02')(time - (Math.floor(time / 60) * 60));
        return min + ':' + sec;
    }
    
    displaySRChange() {
        if (this.game.startSR === null || this.game.startSR == undefined 
           || this.game.endSR === null || this.game.endSR == undefined) {
            return '?';
        }
        const diff = this.game.endSR - this.game.startSR;
        return diff > 0 ? '+' + diff : '' + diff;
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
        return date.toLocaleDateString(undefined, {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric'
        });
    }

    formatDay(date: Date) {
        var days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
        return days[date.getDay()]
    }

}
