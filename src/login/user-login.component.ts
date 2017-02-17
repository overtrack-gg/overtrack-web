import { Component, OnInit } from '@angular/core';

import { UserLoginService, User } from './user-login.service.js';

const callbackUrl = '?next=http://localhost:3000/callback';

@Component({
    selector: 'user-login',
    templateUrl: 'login/user-login.component.html',
    providers: [UserLoginService]
})
export class UserLoginComponent implements OnInit {
    loginUrl: string;
    currentUser: User;

    constructor(private userLoginService: UserLoginService) { }

    ngOnInit(): void {
        this.userLoginService.getUser().subscribe(
            res => {
                this.currentUser = this.userLoginService.toUser(res);
            },
            err => {
                this.loginUrl = this.userLoginService.toAuthUrl(err) + callbackUrl;
                this.currentUser = null;
            }
        );
    }
}
