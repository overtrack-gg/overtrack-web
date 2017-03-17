import { Component, Input } from '@angular/core';
import * as D3 from 'd3';

import { Stage, GameHero, GameEvent } from './game.service';


@Component({
    selector: 'timeline',
    templateUrl: './timeline.component.html'
})
export class TimelineComponent {
    @Input() stage: Stage;

    widthPercentage(hero: GameHero) {
        return 100 * (hero.end - hero.start) / (this.stage.end - this.stage.start);
    }

    eventLeft(event: GameEvent) {
        return 100 * event.time / (this.stage.end - this.stage.start);
    }

    isKOTH() {
        return 'ownership' in this.stage.objectiveInfo;
    }
}