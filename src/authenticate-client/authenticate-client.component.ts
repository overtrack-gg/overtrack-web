import { Component, OnInit } from '@angular/core';
import {Router, ActivatedRoute, Params} from '@angular/router';

import { AuthenticateClientService } from './authenticate-client.service';

@Component({
    selector: 'authenticate-client',
    templateUrl: './authenticate-client.component.html',
    providers: [AuthenticateClientService]
})
export class AuthenticateClientComponent implements OnInit  {
    public callback: string;
    public token: string;
    constructor(public route: ActivatedRoute, public authenticateClientService: AuthenticateClientService) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            let callback: string = params['callback'];
            if (callback && callback.startsWith('http://localhost:')){
                this.callback = callback;
            } else {
                console.log('Refusing to honor callback ', callback);
            }
        });
        this.authenticateClientService.fetchToken(() => {
            this.token = this.authenticateClientService.getToken();
        });
    }

    authenticate(): void {
        console.log('yes');
    }

}