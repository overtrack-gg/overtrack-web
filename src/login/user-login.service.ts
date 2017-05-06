import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class UserLoginService {
    private loginUrl = 'https://api.overtrack.gg/user';
    public logoutUrl = 'https://api.overtrack.gg/logout';
    private currentUser: User = null;
    private authUrl: string;

    constructor (private http: Http) {}

    getUser(): User {
        return this.currentUser;
    }

    getAuthUrl(): string {
        return this.authUrl;
    }

    logout(callback: (string) => void) {
        this.http.get(this.logoutUrl, { withCredentials: true}).subscribe(
                res => {
                    const token = res.json().token;
                    callback(token);
                },
                err => {
                    console.log(err);
                }
            );
    }

    isLoggedIn():Observable<boolean> {
        return this.http.get(this.loginUrl).map(response => response.ok);
    }

    fetchUser(user: (value: User) => void){
        if (this.currentUser || this.authUrl){
            user(this.currentUser);
        } else {
            this.http.get(this.loginUrl, { withCredentials: true }).subscribe(
                res => {
                    const body = res.json();
                    let currentUploadRequested: Date = null;
                    if (body.current_upload_requested){
                        currentUploadRequested = new Date(body.current_upload_requested * 1000);
                    }
                    this.currentUser = {
                        superuser: body.superuser,
                        id       : body["user-id"],
                        battletag: body.battletag,
                        currentUploadRequested: currentUploadRequested,
                    };
                    user(this.currentUser);
                },
                err => {
                    const body = err.json();
                    this.authUrl = body.authenticate_url;
                    this.currentUser = null;
                    user(this.currentUser);
                }
            );
        }
    }

}

// TODO: Move out into own model file
export class User {
    superuser: boolean;
    id: number;
    battletag: string;
    currentUploadRequested: Date;
}
