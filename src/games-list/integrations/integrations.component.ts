import { Component, OnInit, Input, Output, EventEmitter, Inject } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';

import { IMultiSelectOption, IMultiSelectSettings, IMultiSelectTexts } from 'angular-2-dropdown-multiselect';

declare var $: any;

@Component({
    selector: 'accounts-dropdown',
    template: `
    <div>
        <ss-multiselect-dropdown
            style="position: absolute; display: inline-block;"
            [settings]="settings"
            [texts]="texts"
            [options]="options"
            [(ngModel)]="selected"
            (ngModelChange)="onChange($event)"
            (dropdownClosed)="dropdownClosed()"
        ></ss-multiselect-dropdown>
    </div>
    `
})
export class AccountsDropdownComponent implements OnInit{

    @Input() accounts: Array<string>;
    @Input() enabled: Array<string>;
    @Input() all: boolean;
    @Input() custom: boolean;

    @Output() accountsSelected = new EventEmitter();

    selected: number[] = [];
    options: IMultiSelectOption[] = [];
    settings: IMultiSelectSettings = {
        fixedTitle: true,
        minSelectionLimit: 1,
        containerClasses: 'btn-block',
    };
    texts: IMultiSelectTexts = {
        defaultTitle: 'Filter Accounts'
    };

    private allPreviouslySelected: boolean;
    private lastNotified: number[];
    private accounts_: Array<string> = [];

    ngOnInit(): void {
        this.options.push({
            id: 1,
            name: 'All Accounts'
        });
        this.accounts_ = this.accounts.filter(e => e.indexOf(' (CTF)') == -1);
        for (let i in this.accounts_){
            this.options.push({
                id: Number(i) + 2,
                name: this.accounts_[i]
            });
        }
        this.options.push({
            id: this.accounts_.length + 2,
            name: 'Custom Games'
        });

        if (this.all){
            this.selected.push(1);
            this.allPreviouslySelected = true;
        }
        if (this.enabled){
            for (let o of this.options){
                for (let a of this.enabled){
                    if (o.name == a){
                        this.selected.push(o.id);
                        break;
                    }
                }
            }
        }
        if (this.custom){
            this.selected.push(this.accounts_.length + 2);
        }
        this.lastNotified = this.selected.slice();
    }

    onChange(event) {
        let allSelected = this.selected.indexOf(1) != -1;
        let specificAccountSelected = this.selected.reduce((p, c) => {
            return p || (c != 1 && c != this.accounts_.length + 2)
        }, false);
        if (allSelected && specificAccountSelected){
            if (this.allPreviouslySelected){
                // all was already selected, so the new select is a specific account
                this.allPreviouslySelected = false;
                // unselect 'All Accounts'
                this.selected = this.selected.filter(s => s != 1)
            } else {
                // all was not already selected, so the new select is 'All Accounts'
                this.allPreviouslySelected = true
                // Unselect specific accounts
                this.selected = this.selected.filter(s => s == 1 || s == this.accounts_.length + 2);
            }
        }
    }

    dropdownClosed() {
        if (this.selected.sort().toString() != this.lastNotified.sort().toString() ){
            this.accountsSelected.emit(this.selected.map(i => this.options[i - 1].name));
        }
        this.lastNotified = this.selected.slice();
    }

}

@Component({
    selector: 'integrations',
    templateUrl: './integrations.component.html'
})
export class IntegrationsComponent implements OnInit{

    @Input() accounts: Array<string>;

    loading: boolean = true;
    twitchAccount: string;
    integrations: Array<Integration> = [];
    hasTwitchBot: boolean;
    webhooks: number;

    private integrationsURL = 'https://api.overtrack.gg/integrations';
    
    private twitchOAuthUrl: string;
    private twitchClientID: string;
    private twitchOAuthNonce: string;
    private twitchOAuthScope: string;

    constructor(
        public router: Router,
        private http: Http,
        public route: ActivatedRoute,
        @Inject(DOCUMENT) public document: any
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            let postArgs = null;
            if (params['integrations'] != undefined){
                $('#integrations').modal('show');
                if (params['integrations'] == 'twitch'){
                    postArgs = {
                        action: 'link',
                        name: 'twitch',
                        code: params['code'],
                        scope: params['scope'],
                    }
                }
            }
            
            let response: Observable<Response> = null;
            if (postArgs){
                let headers = new Headers({ 'Content-Type': 'application/json' });
                let options = new RequestOptions({ headers: headers, withCredentials: true });
                response = this.http.post(
                    this.integrationsURL, 
                    postArgs,
                    options
                )
            } else if (this.loading){
                let options = new RequestOptions({ withCredentials: true });
                response = this.http.get(
                    this.integrationsURL, 
                    options
                )
            }

            if (response){
                response.subscribe(
                    res => {
                        this.update(res);
                        if (postArgs){
                            this.router.navigate(['.'], { relativeTo: this.route, queryParams: { integrations: '' }});
                        }
                    },
                    err => {
                        throw err;
                    }
                );
            }
        });

        $('#integrations').on('hide.bs.modal', e => {
            this.router.navigate(['.'], { relativeTo: this.route, queryParams: {  }});
        });
    }

    update(res){
        this.loading = false;
        const body = res.json();

        this.twitchAccount = body.twitch.account;
        this.twitchOAuthUrl = body.twitch.oauth_url;
        this.twitchClientID = body.twitch.client_id;
        this.twitchOAuthNonce = body.twitch.nonce;
        this.twitchOAuthScope = body.twitch.scope;

        this.integrations = [];
        for (let i of body.integrations){
            console.log(i);
            let integration: Integration = {
                id: i.id,
                type: i.type,
                player_name_filter: i.player_name_filter,
                custom_games: i.custom_games,
            };
            if (integration.type.indexOf('WEBHOOK') != -1){
                integration.webhook = i.webhook;
            } else if (integration.type == 'TWITCH_IRC_MESSAGE'){
                integration.channel = i.channel;
            }
            this.integrations.push(integration);
        }
        this.integrations.sort((a, b) =>{
            return a.type === 'TWITCH_IRC_MESSAGE' ? 0 : 1;
        });
        this.hasTwitchBot = this.integrations.reduce((prev, cur) => {
            return prev || cur.type == 'TWITCH_IRC_MESSAGE';
        }, false);
        this.webhooks = this.integrations.reduce((prev, cur) => {
            return prev + Number(cur.type == 'DISCORD_WEBHOOK' || cur.type == 'GENERIC_WEBHOOK');
        }, 0);
        $('#integrations').find('button').attr('disabled', false);
    }

    showIntegrations() {
        $('#integrations').modal('show');
        this.router.navigate(['.'], { relativeTo: this.route, queryParams: { integrations: '' }});
    }

    linkTwitch(){
        let url = this.twitchOAuthUrl + 
            '?client_id=' + this.twitchClientID + 
            '&redirect_uri=' + document.location.href.split('?')[0] + '%3Fintegrations%3Dtwitch' + 
            '&response_type=code' +
            '&scope=' + this.twitchOAuthScope + 
            '&nonce=' + this.twitchOAuthNonce;
        this.document.location.href = url;
    }

    unlinkTwitch() {
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.integrationsURL, 
            {
                action: 'unlink',
                name: 'twitch'
            },
            options
        ).subscribe(
            res => { 
                this.update(res);
            },
            err => {throw err}
        );
        this.twitchAccount = null;
        $('#integrations').find('button').attr('disabled', true);
    }

    enableTwitchBot() {
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.integrationsURL, 
            {
                action: 'add',
                type: 'TWITCH_IRC_MESSAGE'
            },
            options
        ).subscribe(
            res => { 
                this.update(res); 
            },
            err => {throw err}
        );
        $('#integrations').find('button').attr('disabled', true);
    }

    addDiscordBot() {
        let url: string = $('#url').val();
        let prefix1 = 'https://discordapp.com/api/webhooks/';
        let prefix2 = 'https://canary.discordapp.com/api/webhooks/';
        let prefix3 = 'https://ptb.discordapp.com/api/webhooks/';

        if (url.startsWith(prefix1) || url.startsWith(prefix2) || url.startsWith(prefix3)){
            $('#url').css('background-color', 'white');
            let headers = new Headers({ 'Content-Type': 'application/json' });
            let options = new RequestOptions({ headers: headers, withCredentials: true });
            this.http.post(
                this.integrationsURL, 
                {
                    action: 'add',
                    type: 'DISCORD_WEBHOOK',
                    webhook: url
                },
                options
            ).subscribe(
                res => { 
                    this.update(res); 
                },
                err => {throw err}
            );
            $('#integrations').find('button').attr('disabled', true);
        } else {
            $('#url').css('background-color', 'red');
        }
    }

    updateIntegration(id: string, accounts: Array<string>){
        let all = accounts.indexOf('All Accounts') != -1;
        let custom = accounts.indexOf('Custom Games') != -1;
        let filter = null;
        if (!all){
            filter = accounts.filter(e => e != 'Custom Games');
        }

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.integrationsURL, 
            {
                action: 'edit',
                id: id,
                custom_games: custom,
                player_name_filter: filter
            },
            options
        ).subscribe(
            res => { 
                this.update(res); 
            },
            err => {throw err}
        );
        $('#integrations').find('button').attr('disabled', true);
    }

    deleteIntegration(id: string){
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.integrationsURL, 
            {
                action: 'delete',
                id: id,
            },
            options
        ).subscribe(
            res => { 
                this.update(res);
            },
            err => {throw err}
        );
        $('#integrations').find('button').attr('disabled', true);
    }

    formatType(s: string){
        if (s == 'TWITCH_IRC_MESSAGE'){
            return 'Twitch Bot';
        } else if (s == 'DISCORD_WEBHOOK'){
            return 'Discord Webhook';
        }
    }

    getIntegrationURL(i: Integration){
        if (i.type == 'TWITCH_IRC_MESSAGE'){
            return 'twitch.tv/' + i.channel;
        } else if (i.type == 'DISCORD_WEBHOOK'){
            return i.webhook;
        }
    }

    openShareLinks(){
        $('#integrations').modal('hide');
        this.router.navigate(['.'], { relativeTo: this.route, queryParams: { share: 'refresh' }});
    }
}

class Integration {
    id: string;
    type: string;
    player_name_filter: Array<string>;
    custom_games: boolean;

    webhook?: string;
    channel?: string;
}
