import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RoutesRecognized, NavigationEnd } from '@angular/router';

declare var ga:Function;

@Component({
	selector: 'overtrack',
	templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

	shareKey: string = null;
	shareKeyFragment: string = null;

	constructor(public router: Router) {}

	ngOnInit(): void {
		this.router.events.subscribe(
			event => {
				if (event instanceof RoutesRecognized) {
					let parts = event.url.split('/');
					if (parts.length > 2 && parts[1] != 'game'){
						this.shareKey = parts[2];
						this.shareKeyFragment = '/' + this.shareKey;
					} else {
						this.shareKeyFragment = null;
						this.shareKey = null;
					}
				}

				if (event instanceof NavigationEnd) {
					ga('set', 'page', event.urlAfterRedirects);
       				ga('send', 'pageview');
				}

			}
		);
	}
    
    prevent(event: any) {
        if (!event.ctrlKey) {
            event.preventDefault();
        }
    }
}
