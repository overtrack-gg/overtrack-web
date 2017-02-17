import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent }  from './app.component';
import { UserLoginComponent }  from '../login/user-login.component.js';
import { GamesListComponent }  from '../games/games-list.component.js';

const appRoutes: Routes = [
    { path: 'games',  component: GamesListComponent },
    { path: 'game/:id',  component: UserLoginComponent },
    { path: '',  redirectTo: '/games', pathMatch: 'full' }
];

@NgModule({
  imports:      [ RouterModule.forRoot(appRoutes), BrowserModule, HttpModule ],
  declarations: [ AppComponent, UserLoginComponent, GamesListComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
