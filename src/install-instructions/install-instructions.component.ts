import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'install-instructions',
    templateUrl: './install-instructions.component.html',
})
export class InstallInstructionsComponent{
    constructor(public router: Router) {}
}