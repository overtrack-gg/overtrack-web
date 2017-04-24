import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

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

const appRoutes: Routes = [
    { path: '',  redirectTo: '/games', pathMatch: 'full' },

    { path: 'games',  component: GamesListComponent },
    { path: 'statistics', component: AllTimeHeroStatisticsComponent },
    { path: 'graph', component: GamesGraphComponent },
    { path: 'winrates', component: WinRatesComponent },

    { path: 'game/:user/:game',  component: GameComponent },

    { path: 'authenticate_client', component: AuthenticateClientComponent }
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
    HeroStatisticPaneComponent
  ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
