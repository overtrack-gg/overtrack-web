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
import { StatisticsComponent } from '../statistics/statistics.component'

const appRoutes: Routes = [
    { path: 'games',  component: GamesListComponent },
    { path: 'statistics', component: StatisticsComponent },
    { path: 'game/:user/:game',  component: GameComponent },
    { path: '',  redirectTo: '/games', pathMatch: 'full' },

    { path: 'authenticate_client', component: AuthenticateClientComponent }
];

@NgModule({
  imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule ],
  declarations: [ AppComponent, UserLoginComponent, GamesListComponent, StatisticsComponent, GameComponent, TimelineComponent, MetaGameComponent, TabGraphsComponent, HeroStatisticsComponent, TabStatisticsComponent, AuthenticateClientComponent],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
