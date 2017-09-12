import { OnInit, Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { DOCUMENT } from '@angular/platform-browser';
import { Http, RequestOptions, Headers, Response } from '@angular/http';

import { UserLoginService } from '../login/user-login.service';


@Component({
    selector: 'register',
    templateUrl: './register.component.html',
})
export class RegisterComponent implements OnInit {

    private registerURL = 'https://api.overtrack.gg/register_beta';
    battletag: string;

    constructor(
        public router: Router, 
        private userLoginService: UserLoginService,
        private http: Http,
        @Inject(DOCUMENT) public document: any
    ) {}

    ngOnInit(): void {
        this.userLoginService.getUser().subscribe(user => {
            if (user){
                this.router.navigate(['/']);
            }
        })

        this.battletag = sessionStorage.getItem('battletag');
    }

    register() {
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });
        this.http.post(
            this.registerURL, 
            { 'battletag': localStorage.getItem('battletag') },
            options
        ).subscribe(
            succ => {
                this.document.location.href = 'https://api.overtrack.gg/authenticate?next=https://overtrack.gg';
            },
            err => {
                throw err;
            }
        );
    }
}
