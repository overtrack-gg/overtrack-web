import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import { UserLoginService, User } from './user-login.service';

@Component({
    selector: 'user-login',
    templateUrl: './user-login.component.html',
})
export class UserLoginComponent implements OnInit {
    user: User = null;
    loginUrl: string;

    constructor(private userLoginService: UserLoginService, @Inject(DOCUMENT) private document: any) { }

    ngOnInit(): void {
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
           this.document.location.href = this.userLoginService.logoutUrl + '?token=' + token + '&next='
               + this.document.location.href;
        });
    }
}
