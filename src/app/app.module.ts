import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { UserLoginComponent } from '../login/user-login.component';
import { GamesListComponent } from '../games-list/games-list.component';
import { GameComponent, MetaGameComponent } from '../game/game.component';
import { TimelineComponent } from '../game/timeline.component';

const appRoutes: Routes = [
    { path: 'games',  component: GamesListComponent },
    { path: 'game/:user/:game',  component: GameComponent },
    { path: '',  redirectTo: '/games', pathMatch: 'full' }
];

@NgModule({
  imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule ],
  declarations: [ AppComponent, UserLoginComponent, GamesListComponent, GameComponent, TimelineComponent, MetaGameComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
