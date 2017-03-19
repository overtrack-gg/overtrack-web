import { Component, Input, OnChanges, ElementRef, ViewChild } from '@angular/core';
import * as D3 from 'd3';

import { Stage, GameHero, GameEvent, Player } from './game.service';


@Component({
    selector: 'timeline',
    templateUrl: './timeline.component.html'
})
export class TimelineComponent implements OnChanges {
    @Input() stage: Stage;
    @ViewChild('timelineBody') element: ElementRef;

    private host: D3.Selection<HTMLElement, {}, undefined, any>;

    ngOnChanges() {
        this.host = D3.select(this.element.nativeElement);

        const players = this.host.select('.timeline-players').selectAll('div')
            .data(this.stage.players).enter();
        const div = players.append('div').attr('class', 'col-xs-12');
        div.style('padding-bottom', (player: Player, i: number) =>
                 i === 5 ? '10px' : '0px');
        // Add name
        div.append('b')
            .attr('class', (player: Player) => {
                return 'col-xs-2 text-right text-' + player.colour;
            }).text((player: Player) => player.name);

        const svg = div.append('svg')
            .attr('class', 'timeline col-xs-8');

        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '40px')
            .attr('fill', 'gray')
            .attr('stroke', 'white');

        svg.selectAll('image').data((player: Player) => player.heroesPlayed)
            .enter().append('image')
            .attr('xlink:href',
                  (hero: GameHero) => 'assets/images/heroes/' + hero.name + '.png')
            .attr('x', (hero: GameHero) => this.x(hero.start) + '%')
            .attr('class', 'hero-image')
            // .attr('transform', 'translate(-20)')
            .attr('y', 0);
            
        svg.selectAll('text').data((player: Player) => player.events.filter(event => event.type == 'kill'))
            .enter().append('text')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('y', 20)
            .attr('class', (event: GameEvent) => 'timeline-event ' + event.type)
            .text('●');

        svg.selectAll('image').data((player: Player) => player.events.filter(event => event.type == 'death'))
            .enter().append('image')
            .attr('xlink:href','assets/images/timeline/skull.png')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('transform', 'translate(-6)')
            .attr('y', 12)
            .attr('width', 15)
            .attr('height', 15);
     

        // Add the kills and deaths
        const b = div.append('b')
            .attr('class', 'col-xs-2 text-left num');
        b.append('span').attr('class', 'kill')
            .text((player: Player) => player.kills);
        b.append('span')
            .text((player: Player) => ' / ');
        b.append('span').attr('class', 'death')
            .text((player: Player) => player.deaths);
    }

    widthPercentage(hero: GameHero) {
        return 100 * (hero.end - hero.start) / (this.stage.end - this.stage.start);
    }

    x(time: number) {
        return 100 * time / (this.stage.end - this.stage.start);
    }

    eventLeft(event: GameEvent) {
        return 100 * event.time / (this.stage.end - this.stage.start);
    }

    isKOTH() {
        return 'ownership' in this.stage.objectiveInfo;
    }
}
