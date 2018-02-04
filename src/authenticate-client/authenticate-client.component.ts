import { Component, OnInit, Inject } from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';

import { AuthenticateClientService } from './authenticate-client.service';
import { UserLoginService } from '../login/user-login.service';

@Component({
    selector: 'authenticate-client',
    templateUrl: './authenticate-client.component.html',
    providers: [AuthenticateClientService]
})
export class AuthenticateClientComponent implements OnInit  {
    callback: string;
    token: string;
    loggedIn: boolean;
    loginUrl: string;

    constructor(
        public route: ActivatedRoute, 
        public userLoginService: UserLoginService,
        public authenticateClientService: AuthenticateClientService,
        @Inject(DOCUMENT) public document: any
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            let callback: string = params['callback'];
            if (callback && callback.startsWith('http://localhost:')){
                this.callback = callback;
            } else {
                console.log('Refusing to honor callback ', callback);
            }
        });

        this.userLoginService.getUser().subscribe(user => {
            this.loggedIn = !!user;
            if (user){
                this.authenticateClientService.fetchToken(() => {
                    this.token = this.authenticateClientService.getToken();
                });
            } else {
                const auth = this.userLoginService.getAuthUrl();
                if (auth) {
                    this.loginUrl = auth + '?next=' + this.document.location.href;
                }
            }
        });

        this.userLoginService.isLoggedIn().subscribe(isLoggedIn => {
            this.loggedIn = isLoggedIn;
            if (isLoggedIn){
               this.authenticateClientService.fetchToken(() => {
                    this.token = this.authenticateClientService.getToken();
                });
            }
        });


    }

    authenticate(): void {
        console.log('yes');
    }

}