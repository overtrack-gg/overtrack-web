import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RoutesRecognized } from '@angular/router';

@Component({
	selector: 'overtrack',
	templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {

	private shareKey: string = null;
	private shareKeyFragment: string = null;

	constructor(private router: Router) {}

	ngOnInit(): void {
		this.router.events.subscribe(
			event => {
				if (event instanceof RoutesRecognized) {
					if (event.url.split('/').length > 2){
						this.shareKey = event.url.split('/')[2];
						this.shareKeyFragment = '/' + this.shareKey;
					} else {
						this.shareKey = null;
					}
				}
			}
		)
	}

}
