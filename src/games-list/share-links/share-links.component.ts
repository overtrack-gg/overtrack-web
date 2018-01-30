import { Component, OnInit, Input, Inject } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { Http, Response, Headers } from '@angular/http';
import { DOCUMENT } from '@angular/platform-browser';

declare var $: any;
declare var $: any;

@Component({
    selector: 'share-links',
    templateUrl: './share-links.component.html',
    styles:['.url-copyable:hover{ color: white; background-color: #888888 }']
})
export class ShareLinksComponent implements OnInit {

    @Input() accounts: Array<string>;

    private shareKeysURL = 'https://api.overtrack.gg/share_keys';

    shareKeys: Array<ShareLink> = [];
    defaultLinks = 0;
    twitchAccount: string = null;
    hasTwitchLink = false;
    hasBattletagLink = false;

    constructor(
        public router: Router,
        private http: Http,
        public route: ActivatedRoute,
        @Inject(DOCUMENT) public document: any
    ) { }

    ngOnInit(): void {
        console.log(this.accounts);

        this.route.queryParams.subscribe((params: Params) => {
            if (params['share'] != undefined){
                if (params['share'] == 'refresh'){
                    this.router.navigate(['.'], { relativeTo: this.route, queryParams: { share: '' }});
                    $('#share-links').find('button').attr('disabled', false);
                    this.http.get(this.shareKeysURL, { withCredentials: true}).subscribe(
                        res => { this.updateShareKeys(res); },
                        err => { throw err; }
                    );
                }
                $('#share-links').modal('show');
            }
        });

        this.http.get(this.shareKeysURL, { withCredentials: true}).subscribe(
            res => { this.updateShareKeys(res); },
            err => { throw err; }
        );

        $('#share-links').on('hide.bs.modal', e => {
            this.router.navigate(['.'], { relativeTo: this.route, queryParams: {  }});
        });
    }

    showShareLinks() {
        $('#share-links').modal('show');
        this.router.navigate(['.'], { relativeTo: this.route, queryParams: { share: '' }});
    }

    updateShareKeys(res){
        this.shareKeys = [];
        for (let key of res.json().keys){
            this.shareKeys.push({
                key: key.key,
                url: key.url,
                enabled: key.player_name_filter,
                custom_games: key.custom_games,
                type: key.type
            })
        }
        this.twitchAccount = res.json().twitch_account;
        this.hasBattletagLink = this.shareKeys.reduce((prev, cur) => {
            return prev || cur.type == 'battletag';
        }, false);
        this.hasTwitchLink = this.shareKeys.reduce((prev, cur) => {
            return prev || cur.type == 'twitch';
        }, false);
        this.defaultLinks = this.shareKeys.reduce((prev, cur) => {
            return prev + Number(cur.type == 'default');
        }, 0);
        $('#share-links').find('button').attr('disabled', false);
    }

    createKey(type: string){
        this.http.post(
            this.shareKeysURL, 
            {
                action: 'create',
                type: type
            },
            {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                withCredentials: true
            }
        ).subscribe(
            res => { this.updateShareKeys(res); },
            err => {throw err}
        );
        $('#share-links').find('button').attr('disabled', true);
    }

    editKey(key: string, accounts: Array<string>){
        let all = accounts.indexOf('All Accounts') != -1;
        let custom = accounts.indexOf('Custom Games') != -1;
        let filter = null;
        if (!all){
            filter = accounts.filter(e => e != 'Custom Games');
        }
        this.http.post(
            this.shareKeysURL, 
            {
                action: 'edit',
                key: key,
                player_name_filter: filter,
                custom_games: custom
            },
            {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                withCredentials: true
            }
        ).subscribe(
            res => { this.updateShareKeys(res); },
            err => {throw err}
        );
        $('#share-links').find('button').attr('disabled', true);
    }

    deleteKey(key: string){
        this.http.post(
            this.shareKeysURL, 
            {
                action: 'delete',
                key: key
            },
            {
                headers: new Headers({ 'Content-Type': 'application/json' }),
                withCredentials: true
            }
        ).subscribe(
            res => { this.updateShareKeys(res); },
            err => {throw err}
        );
        $('#share-links').find('button').attr('disabled', true);
    }

    copy(text: string, event) {
        let target = $(event.target);

        target.attr('disabled', false);
        target.focus();
        target.select();
        document.execCommand('copy');
        target.attr('disabled', true);

        target.popover({
            content: 'URL copied',
            placement: 'bottom',
        });
        target.popover('show');
        setTimeout(e => {
            target.popover('hide');
        }, 1000);
    }
}

class ShareLink{
    key: string;
    url: string;
    enabled: Array<string>;
    custom_games: boolean;
    type: string;
}