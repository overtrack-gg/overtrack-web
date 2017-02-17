import { NgModule }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent }  from './app.component';
import { UserLoginComponent }  from '../login/user-login.component.js';

@NgModule({
  imports:      [ BrowserModule ],
  declarations: [ AppComponent, UserLoginComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
