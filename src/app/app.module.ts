import * as Raven from 'raven-js';
import { NgModule, Injectable, ErrorHandler, isDevMode, Component, OnInit } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpModule, URLSearchParams } from '@angular/http';
import { RouterModule, Router, Routes, CanActivate, ActivatedRoute, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { HttpClientModule } from '@angular/common/http'; 

import { NgMultiSelectDropDownModule } from 'ng-multiselect-dropdown';

import { VgCoreModule } from 'videogular2/core';
import { VgControlsModule } from 'videogular2/controls';
import { VgOverlayPlayModule } from 'videogular2/overlay-play';
import { VgBufferingModule } from 'videogular2/buffering';
import { VgStreamingModule } from 'videogular2/streaming';

import { AppComponent } from './app.component';
import { UserLoginComponent } from '../login/user-login.component';
import { GamesListComponent } from '../games-list/games-list.component';
import { IntegrationsComponent, AccountsDropdownComponent } from '../games-list/integrations/integrations.component';
import { ShareLinksComponent } from '../games-list/share-links/share-links.component';
import { GameComponent, MetaGameComponent } from '../game/game.component';
import { EditGameComponent } from '../game/edit-game.component';
import { TimelineComponent } from '../game/timeline.component';
import { TabGraphsComponent } from '../game/tab-graphs/tab-graphs.component';
import { HeroStatisticsComponent, TabStatisticsComponent } from '../game/tab-stats/tab-stats.component';
import { AuthenticateClientComponent } from '../authenticate-client/authenticate-client.component';
import { WinRatesComponent } from '../win-rates/win-rates.component';
import { AllTimeHeroStatisticsComponent, AllTimeHeroStatisticComponent, StatsFilterPipe } from '../hero-statistics/hero-statistics.component';
import { GamesGraphComponent } from '../games-graph/games-graph.component';
import { InstallInstructionsComponent } from '../install-instructions/install-instructions.component';
import { RegisterComponent } from '../register/register.component';
import { WelcomeComponent } from '../welcome/welcome.component';
import { SubscribeComponent } from '../subscribe/subscribe.component';
import { FAQComponent } from '../faq/faq.component';
import { StreamerInfoComponent } from '../streamer-info/streamer-info.component';
import { NotFoundComponent } from '../404/404.component';
import { PlaylistsComponent } from '../game/playlists/playlists.component'; 
import { VideoSearchComponent, KillfeedEventComponent } from '../video-search/video-search.component';

import { UserLoginService } from '../login/user-login.service';
import { GamesListService } from '../games-list/games-list.service';


declare var ga:Function;

// Raven
// 	.config('https://adb4e1d3ae1040fcb434a6c018934bf4@sentry.io/161537')
// 	.install();

// export class RavenErrorHandler implements ErrorHandler {
// 	handleError(err:any) : void {
// 		if ( console && console.group && console.error ) {
// 			console.group('Error Log Service');
// 			console.error(err);
// 			console.error(err.message);
// 			console.error(err.stack);
// 			console.groupEnd();
// 		}

// 		if (!isDevMode()){
// 			Raven.captureException(err.originalError || err);
// 		}
// 	}
// }

@Injectable()
export class LoggedIn implements CanActivate {

	constructor(public router: Router, 
				public userLoginService: UserLoginService,
				) { }

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
		return Observable.create((observer) => {
			this.userLoginService.getUser().subscribe(user => {
				// console.log('>', user);
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

@Component({
	selector: 'discord-redirect',
	template: ``
})
export class DiscordRedirect implements OnInit {

	ngOnInit(): void {
		window.location.replace('https://discord.gg/JywstAB');
	}
}

const appRoutes: Routes = [
		{ path: '', component: RedirectToGamesComponent, canActivate: [LoggedIn] },
		{ path: 'games',  component: GamesListComponent, canActivate: [LoggedIn] },
		{ path: 'statistics', component: AllTimeHeroStatisticsComponent, canActivate: [LoggedIn] },
		{ path: 'graph', component: GamesGraphComponent, canActivate: [LoggedIn] },
		{ path: 'winrates', component: WinRatesComponent, canActivate: [LoggedIn] },
		
		{ path: 'games/:share_key', component: GamesListComponent},
		{ path: 'statistics/:share_key', component: AllTimeHeroStatisticsComponent },
		{ path: 'graph/:share_key', component: GamesGraphComponent },
		{ path: 'winrates/:share_key', component: WinRatesComponent },
		
		{ path: 'game/:user/:game',  component: GameComponent },

		{ path: 'authenticate_client', component: AuthenticateClientComponent },
		{ path: 'subscribe', component: SubscribeComponent, canActivate: [LoggedIn]  },

		{ path: 'register', component: RegisterComponent },
		{ path: 'welcome', component: WelcomeComponent },
		{ path: 'tracker', component: InstallInstructionsComponent},
		{ path: 'faq', component: FAQComponent },
		{ path: 'streamer', component: StreamerInfoComponent },

		{ path: 'video', component: VideoSearchComponent },

		{ path: 'discord', component: DiscordRedirect },

		{ path: '**', component: NotFoundComponent },
];

@NgModule({
	imports: [
		RouterModule.forRoot(appRoutes),
		BrowserModule, 
		HttpModule, 
		HttpClientModule,
		FormsModule, 
		ReactiveFormsModule,

		NgMultiSelectDropDownModule.forRoot(),

		BrowserModule,
        VgCoreModule,
        VgControlsModule,
        VgOverlayPlayModule,
		VgBufferingModule,
		VgStreamingModule
	],
	declarations: [ 
		AppComponent, 
		UserLoginComponent,
		RedirectToGamesComponent,
		GamesListComponent,
		IntegrationsComponent,
		AccountsDropdownComponent,
		GamesGraphComponent,
		WinRatesComponent,
		GameComponent,
		EditGameComponent,
		TimelineComponent,
		MetaGameComponent,
		TabGraphsComponent,
		HeroStatisticsComponent,
		TabStatisticsComponent,
		AllTimeHeroStatisticsComponent,
		AllTimeHeroStatisticComponent,
		AuthenticateClientComponent,
		InstallInstructionsComponent,
		RegisterComponent,
		WelcomeComponent,
		SubscribeComponent,
		ShareLinksComponent, 
		FAQComponent,
		StreamerInfoComponent,
		NotFoundComponent,
		PlaylistsComponent,
		VideoSearchComponent,
		KillfeedEventComponent,
		DiscordRedirect,

		StatsFilterPipe
	],
	bootstrap: [ 
		AppComponent
	],
	providers: [
		// { provide: ErrorHandler, useClass: RavenErrorHandler }, 
		UserLoginService,
		GamesListService,
		LoggedIn,
	]
})
export class AppModule { }
