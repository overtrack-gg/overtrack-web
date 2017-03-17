import { Component, OnInit, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

import { UserLoginService, User } from './user-login.service';

@Component({
    selector: 'user-login',
    templateUrl: './user-login.component.html',
    providers: [UserLoginService]
})
export class UserLoginComponent implements OnInit {
    loginUrl: string;

    constructor(private userLoginService: UserLoginService, @Inject(DOCUMENT) private document: any) { }

    ngOnInit(): void {
        if (!this.userLoginService.getUser()) {
            this.userLoginService.fetchUser(() => {
                const auth = this.userLoginService.getAuthUrl();
                if (auth) {
                    this.loginUrl = auth + '?next=' + this.document.location.href;
                }
            });
        } 
    }
}
