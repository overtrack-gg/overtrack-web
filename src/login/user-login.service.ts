import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class UserLoginService {
    private loginUrl = 'https://1hb0qu4vxl.execute-api.us-west-2.amazonaws.com/dev/user';

    constructor (private http: Http) {}

    getUser(): Observable<Response> {
        return this.http.get(this.loginUrl, { withCredentials: true});
    }

    toAuthUrl(res: Response) {
        let body = res.json();
        return body.authenticate_url;
    }

    toUser(res: Response) {
        let body = res.json();
        return {
            plan     : body.plan,
            id       : body.id,
            battletag: body.battletag
        };
    }
}

// TODO: Move out into own files
export class User {
    plan: string;
    id: number;
    battletag: string;
}
