import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class AuthenticateClientService {
    private getTokenUrl = 'https://api.overtrack.gg/get_client_token';
    private token: string;

    constructor (private http: Http) {}

    getToken(): string {
        return this.token;
    }

    fetchToken(callback: () => void) {
         this.http.get(this.getTokenUrl, { withCredentials: true}).subscribe(
                res => {
                    const body = res.json();
                    this.token = body.token;
                    callback();
                },
                err => {
                    const body = err.json();
                    this.token = null;
                    callback();
                }
            );
    }
}
