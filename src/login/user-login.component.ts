import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';

import { UserLoginService, User } from './user-login.service';

@Component({
    selector: 'user-login',
    templateUrl: './user-login.component.html',
})
export class UserLoginComponent implements OnInit {
    user: User = null;
    loginUrl: string;

    constructor(public userLoginService: UserLoginService, 
                public router: Router,
                public route: ActivatedRoute,
                @Inject(DOCUMENT) public document: any) { }

    ngOnInit(): void {

        this.route.queryParams.subscribe((params: Params) => {
            if (params['loggedin'] == 'false'){
                sessionStorage.setItem('battletag', params['battletag']);
                localStorage.setItem('battletag', params['battletag']);
                if (params['reason'] == 'notwhitelisted'){
                    this.router.navigate(['/register']);
                } else {
                    throw new Error('Unexpected reason: ' + params['reason']); 
                }
            }
        });

        this.userLoginService.fetchUser(user => {
            this.user = user;
            if (!user){
                const auth = this.userLoginService.getAuthUrl();
                if (auth) {
                    this.loginUrl = auth + '?next=' + this.document.location.href;
                }
            }
        });
    }

    logout() {
        this.userLoginService.logout((token: string) => {
           this.document.location.href = this.userLoginService.logoutUrl + '?token=' + token + '&next=' + this.document.location.href;
        });
    }
}
