import * as Raven from 'raven-js';
import { NgModule, Injectable, ErrorHandler, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Router, Routes, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';

import { AppComponent } from './app.component';
import { UserLoginComponent } from '../login/user-login.component';
import { GamesListComponent } from '../games-list/games-list.component';
import { GameComponent, MetaGameComponent } from '../game/game.component';
import { TimelineComponent } from '../game/timeline.component';
import { TabGraphsComponent } from '../game/tab-graphs/tab-graphs.component';
import { HeroStatisticsComponent, TabStatisticsComponent } from '../game/tab-stats/tab-stats.component';
import { AuthenticateClientComponent } from '../authenticate-client/authenticate-client.component';
import { WinRatesComponent } from '../win-rates/win-rates.component';
import { AllTimeHeroStatisticsComponent, HeroStatisticPaneComponent } from '../hero-statistics/hero-statistics.component';
import { GamesGraphComponent } from '../games-graph/games-graph.component';
import { InstallInstructionsComponent } from '../install-instructions/install-instructions.component';
import { WelcomeComponent } from '../welcome/welcome.component';

import { UserLoginService } from '../login/user-login.service';
import { GamesListService } from '../games-list/games-list.service';

Raven
  .config('https://adb4e1d3ae1040fcb434a6c018934bf4@sentry.io/161537')
  .install();

export class RavenErrorHandler implements ErrorHandler {
  handleError(err:any) : void {
    if ( console && console.group && console.error ) {
      console.group('Error Log Service');
      console.error(err);
      console.error(err.message);
      //console.error(err.stack);
      console.groupEnd();
    }

    if (!isDevMode()){
      Raven.captureException(err.originalError || err);
    }
  }
}

@Injectable()
export class LoggedIn implements CanActivate {

  constructor(private router: Router, private userLoginService: UserLoginService) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> | boolean {
    if (this.userLoginService.getUser()){
      return true;
    }
    return Observable.create((observer) => {
      this.userLoginService.fetchUser(user => {
        if (!user){
          this.router.navigate(['/welcome'], { queryParams: { next: state.url } });
        }
        observer.next(!!user);
      })
    });
  }
}

const appRoutes: Routes = [
    { path: '',  redirectTo: '/games', pathMatch: 'full', canActivate: [LoggedIn] },
    { path: 'games',  component: GamesListComponent, canActivate: [LoggedIn] },
    { path: 'statistics', component: AllTimeHeroStatisticsComponent, canActivate: [LoggedIn] },
    { path: 'graph', component: GamesGraphComponent, canActivate: [LoggedIn] },
    { path: 'winrates', component: WinRatesComponent, canActivate: [LoggedIn] },
    { path: 'tracker', component: InstallInstructionsComponent, canActivate: [LoggedIn]},

    { path: 'game/:user/:game',  component: GameComponent },

    { path: 'authenticate_client', component: AuthenticateClientComponent, canActivate: [LoggedIn] },

    { path: 'welcome', component: WelcomeComponent }
];

@NgModule({
  imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule ],
  declarations: [ 
    AppComponent, 
    UserLoginComponent,
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
    WelcomeComponent
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
