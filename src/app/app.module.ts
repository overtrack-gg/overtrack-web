import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent }  from './app.component';
import { UserLoginComponent }  from '../login/user-login.component.js';
import { GamesListComponent }  from '../games-list/games-list.component.js';
import { GameComponent, TimelineComponent }  from '../games/game.component.js';

const appRoutes: Routes = [
    { path: 'games',  component: GamesListComponent },
    { path: 'game/:user/:game',  component: GameComponent },
    { path: '',  redirectTo: '/games', pathMatch: 'full' }
];

@NgModule({
  imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule ],
  declarations: [ AppComponent, UserLoginComponent, GamesListComponent, GameComponent, TimelineComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
