import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable, ReplaySubject } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class UserLoginService {
    private authUrl = 'https://api.overtrack.gg/authenticate';
    private loginUrl = 'https://api.overtrack.gg/user';
    public logoutUrl = 'https://api.overtrack.gg/logout';
    // private currentUser: User = null;

    private user: ReplaySubject<User> = null;

    constructor (private http: Http) {}

    getUser(): Observable<User> {
        if (this.user == null){
            this.user = new ReplaySubject(1);
            this.http.get(this.loginUrl, { withCredentials: true }).subscribe(
                res => {
                    const body = res.json();
                    let currentUploadRequested: Date = null;
                    if (body.current_upload_requested){
                        currentUploadRequested = new Date(body.current_upload_requested * 1000);
                    }
                    let currentUser = {
                        superuser: body.superuser,
                        id       : body["user-id"],
                        battletag: body.battletag,
                        currentUploadRequested: currentUploadRequested,
                    };
                    this.user.next(currentUser);
                },
                err => {
                    this.user.next(null);
                }
            );
        }
        return this.user;
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

    isLoggedIn(): Observable<boolean> {
        return this.http.get(this.loginUrl).pipe(map(response => response.ok));
    }

}

// TODO: Move out into own model file
export class User {
    superuser: boolean;
    id: number;
    battletag: string;
    currentUploadRequested: Date;
}
