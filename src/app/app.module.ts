import * as Raven from 'raven-js';
import { NgModule, Injectable, ErrorHandler, isDevMode, Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, URLSearchParams } from '@angular/http';
import { RouterModule, Router, Routes, CanActivate, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { AppComponent } from './app.component';
import { UserLoginComponent } from '../login/user-login.component';
import { GamesListComponent } from '../games-list/games-list.component';
import { ShareLinkComponent } from '../games-list/share-link.component';
import { GameComponent, MetaGameComponent } from '../game/game.component';
import { TimelineComponent } from '../game/timeline.component';
import { TabGraphsComponent } from '../game/tab-graphs/tab-graphs.component';
import { HeroStatisticsComponent, TabStatisticsComponent } from '../game/tab-stats/tab-stats.component';
import { AuthenticateClientComponent } from '../authenticate-client/authenticate-client.component';
import { WinRatesComponent } from '../win-rates/win-rates.component';
import { AllTimeHeroStatisticsComponent, HeroStatisticPaneComponent } from '../hero-statistics/hero-statistics.component';
import { GamesGraphComponent } from '../games-graph/games-graph.component';
import { InstallInstructionsComponent } from '../install-instructions/install-instructions.component';
import { RegisterInterestComponent } from '../register-interest/register-interest.component';
import { WelcomeComponent } from '../welcome/welcome.component';

import { UserLoginService } from '../login/user-login.service';
import { GamesListService } from '../games-list/games-list.service';

declare var ga:Function;

Raven
	.config('https://adb4e1d3ae1040fcb434a6c018934bf4@sentry.io/161537')
	.install();

export class RavenErrorHandler implements ErrorHandler {
	handleError(err:any) : void {
		if ( console && console.group && console.error ) {
			console.group('Error Log Service');
			console.error(err);
			console.error(err.message);
			console.error(err.stack);
			console.groupEnd();
		}

		if (!isDevMode()){
			Raven.captureException(err.originalError || err);
		}
	}
}

@Injectable()
export class LoggedIn implements CanActivate {

	constructor(public router: Router, 
				public userLoginService: UserLoginService,
				) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		if (this.userLoginService.getUser()){
			return true;
		}
		return Observable.create((observer) => {
			this.userLoginService.fetchUser(user => {
				// console.log(this.router.url);
				if (!user){
					let params_str = window.location.href.split('?');
					let params = {};
					if (params_str.length > 1){
						let url_params = new URLSearchParams(params_str[1]).paramsMap;
						url_params.forEach((v, k) => {
							params[k] = v[0];
						})
					}
					if (state.url && state.url != '/'){
						params['next'] = state.url.split('?')[0];
					}
		
					console.log('Redirecting not-logged-in user to /welcome', params);
					this.router.navigate(['/welcome'], { queryParams: params });
				} else {
					ga('set', 'userId', user.battletag); 
				}
				observer.next(!!user);
			})
		});
	}
}

@Component({
	selector: 'redirect-games',
	template: ``
})
export class RedirectToGamesComponent implements OnInit {

    constructor(public router: Router) {}

	ngOnInit(): void {
		console.log('Redirecting to /games');
		this.router.navigate(['/games']);
	}
}

const appRoutes: Routes = [
		{ path: '', pathMatch: 'full', component: RedirectToGamesComponent, canActivate: [LoggedIn] },
		{ path: 'games',  component: GamesListComponent, canActivate: [LoggedIn] },
		{ path: 'statistics', component: AllTimeHeroStatisticsComponent, canActivate: [LoggedIn] },
		{ path: 'graph', component: GamesGraphComponent, canActivate: [LoggedIn] },
		{ path: 'winrates', component: WinRatesComponent, canActivate: [LoggedIn] },
		{ path: 'tracker', component: InstallInstructionsComponent, canActivate: [LoggedIn]},

		{ path: 'games/:share_key', component: GamesListComponent},
		{ path: 'statistics/:share_key', component: AllTimeHeroStatisticsComponent },
		{ path: 'graph/:share_key', component: GamesGraphComponent },
		{ path: 'winrates/:share_key', component: WinRatesComponent },
		
		{ path: 'game/:user/:game',  component: GameComponent },

		{ path: 'authenticate_client', component: AuthenticateClientComponent, canActivate: [LoggedIn] },

		{ path: 'register', component: RegisterInterestComponent },
		{ path: 'welcome', component: WelcomeComponent }
];

@NgModule({
	imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule, FormsModule, ReactiveFormsModule ],
	declarations: [ 
		AppComponent, 
		UserLoginComponent,
		RedirectToGamesComponent,
		GamesListComponent,
		GamesGraphComponent,
		WinRatesComponent,
		GameComponent,
		TimelineComponent,
		MetaGameComponent,
		TabGraphsComponent,
		HeroStatisticsComponent,
		TabStatisticsComponent,
		AllTimeHeroStatisticsComponent,
		AuthenticateClientComponent,
		HeroStatisticPaneComponent,
		InstallInstructionsComponent,
		RegisterInterestComponent,
		WelcomeComponent,
		ShareLinkComponent
	],
	bootstrap:    [ AppComponent ],
	providers: [
		{ provide: ErrorHandler, useClass: RavenErrorHandler }, 
		UserLoginService,
		GamesListService,
		LoggedIn
	]
})
export class AppModule { }
