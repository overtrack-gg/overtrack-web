import { OnInit, Component } from '@angular/core';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';


@Component({
    selector: 'register-interest',
    templateUrl: './register-interest.component.html',
})
export class RegisterInterestComponent implements OnInit {

    registerURL = 'https://api.overtrack.gg/register';

    registered: boolean = false;
    email: string;
    registerForm: FormGroup;

    constructor(private fb: FormBuilder,
                private http: Http) {}

    ngOnInit(): void {
        // this.registered = localStorage.getItem('registered') == 'true';

        this.registerForm = this.fb.group({
            'email': [this.email, []]
        });
    }

    onSubmit() {
        let email: string = this.registerForm.value.email;

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers });
        this.http.post(this.registerURL, {
            'email': email, 
            'battletag': localStorage.getItem('battletag')
        }, options).subscribe(
            succ => {
                this.registered = true;
                localStorage.setItem('registered', 'true');
            }
        );
    }
}
