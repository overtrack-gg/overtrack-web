import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params} from '@angular/router';

import { UserLoginService } from '../login/user-login.service';

@Component({
    selector: 'welcome',
    templateUrl: './welcome.component.html',
})
export class WelcomeComponent implements OnInit {
    next: string;
    constructor(public router: Router, public route: ActivatedRoute, public userLoginService: UserLoginService) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params: Params) => {
            this.next = params['next'];
            if (this.next){
                this.userLoginService.getUser().subscribe(user => {
                    if (user){
                        console.log('Navigating to ', this.next);
                        this.router.navigate([this.next]);
                    }
                })
            }
        });
    }

}