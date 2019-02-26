import { Component, Input, OnChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import * as D3 from 'd3';

import { Stage, GameHero, GameEvent, Player, KillFeedEntry, PayloadObjectiveInfo } from './game.service';
import { OnInit } from '@angular/core/src/metadata/lifecycle_hooks';

declare var Twitch: any; // TODO

@Component({
    selector: 'timeline',
    templateUrl: './timeline.component.html',
    host: {
        '(window:keydown)': 'keydown($event)',
        '(window:keyup)': 'keyup($event)'
    },
})
export class TimelineComponent implements OnChanges, AfterViewInit {
    @Input() stage: Stage;
    @Input() active: boolean;
    @Input() showVod: boolean;
    @Input() twitchURL: string;

    private twitchVideoStart: number;
    private twitchVideoOffset = 0;
    
    @ViewChild('timelineBody') element: ElementRef;
    @ViewChild('twitchEmbed') twitchEmebed: ElementRef;

    killfeedTime: number;
    highlightKillWindow = 10 * 1000;

    private host: D3.Selection<HTMLElement, {}, undefined, any>;
    private line;

    private afterView = false;
    ngAfterViewInit() {
        this.afterView = true;
        this.ngOnChanges();
    }

    private twitchPlayer: {
        pause(): void;
        play(): void;
        seek(timestamp: number): void;
        setChannel(channel: string): void;
        setCollection(collection: string, video: string): void;
        setQuality(quality: string): void;
        setVideo(video: string): void;
        getMuted(): boolean;
        setMuted(muted: boolean): void;
        getVolume(): number;
        setVolume(volumelevel: number): void;
        getChannel(): string;
        getCurrentTime(): number;
        getDuration(): number;
        getEnded(): boolean;
        getPlaybackStats(): object;
        getQualities(): string[];
        getQuality(): string;
        getVideo(): string;
        isPaused(): boolean;
        addEventListener(event: string, callback): void;

        setMiniPlayerMode(b: boolean);
    } = null;

    private twitchLoaded = false;
    private seeking = false;
    private mouseInside = false;

    private onPlay: Array<() => void> = [];
    private onPause: Array<() => void> = [];
    
    createTwitchPlayer() {
        let twitchVideo = this.twitchURL.split('videos/')[1].split('?')[0];
        this.twitchVideoStart = Number(this.twitchURL.split('=')[1].split('s')[0]) + this.twitchVideoOffset;
        this.twitchPlayer = new Twitch.Player(this.twitchEmebed.nativeElement.id, {
            width: '100%',
            height: 480,
            video: twitchVideo,
            layout: 'video',
            theme: 'dark',
            autoplay: true,

            async: true,
            branding: false,
            showInfo: false,
            controls: true
        });
        this.twitchEmebed.nativeElement.children[0].addEventListener('mouseover', e => {
            this.mouseInside = true;
        });
        this.twitchEmebed.nativeElement.children[0].addEventListener('mouseout', e => {
            this.mouseInside = false;
        });
        let initialMute = this.twitchPlayer.getMuted();
        this.twitchPlayer.setMuted(true);
       
        for (let type of [Twitch.Player.ENDED, Twitch.Player.PAUSE, Twitch.Player.PLAY, Twitch.Player.OFFLINE, Twitch.Player.ONLINE, Twitch.Player.READY]){
            this.twitchPlayer.addEventListener(type, e => {
                console.log('>', type, this.twitchPlayer.getCurrentTime());
            });
        }
        this.twitchPlayer.addEventListener(Twitch.Player.PLAY, e => {
            for (let c of this.onPlay){
                c();
            }
            this.onPlay = [];
        });
        this.twitchPlayer.addEventListener(Twitch.Player.PAUSE, e => {
            for (let c of this.onPause){
                c();
            }
            this.onPause = [];
        });

        let t = this.twitchVideoStart + this.stage.start / 1000;
        this.twitchPlayer.seek(t);
        this.onPlay.push(() => {
            this.twitchPlayer.pause();
            this.twitchPlayer.seek(t);
        });

        window.setInterval(e => {
            if (!this.twitchLoaded){
                let now = this.twitchPlayer.getCurrentTime();
                if (now > 0 && this.twitchPlayer.isPaused()){

                    if (Math.abs(now - t) < 10){
                        this.twitchLoaded = true;
                        window.setTimeout(e => {
                            this.twitchPlayer.setMuted(initialMute);
                        }, 500);
                        console.log('Twitch loaded');
                    } else {
                        window.setTimeout(e => {
                            if (!this.twitchLoaded){
                                console.log('Twitch is at', now, 'but we requested', t, ': reseeking');
                                this.twitchPlayer.seek(t);
                            }
                        }, 100);
                    }
                }
            }

            if (this.active && this.showVod && this.twitchLoaded){
                let now = this.twitchPlayer.getCurrentTime() - 2;
                let start = this.twitchVideoStart + this.stage.start / 1000;
                let end = this.twitchVideoStart + this.stage.end / 1000;
                let duration = this.stage.duration / 1000;

                this.killfeedTime = (now - this.twitchVideoStart) * 1000;

                let x = ((now - start) / duration) * 100;
                if (this.line && !this.seeking){
                    this.line.attr('x1', x + '%');
                    this.line.attr('x2', x + '%');
                    this.line.style('display', null);
                }

                if (now > end){
                    this.twitchPlayer.pause();
                    this.twitchPlayer.seek(end);
                }
                if (now < start - 20){
                    this.twitchPlayer.seek(start);
                }
                if (this.twitchPlayer.isPaused() || this.mouseInside){
                    this.twitchPlayer.setMiniPlayerMode(false);
                } else {
                    this.twitchPlayer.setMiniPlayerMode(true);
                }
            } else {
                this.line.style('display', 'none');
            }
        }, 250);

        window.setInterval(e => {
            if (!this.twitchPlayer.isPaused()){
                let scrollTo = 0;
                for (let k of this.stage.killfeed){
                    if (k.time + 10 * 1000 > this.killfeedTime){
                        break;
                    }
                    scrollTo += 1;
                }
                let killfeed = D3.select('.killfeed-' + this.stage.index);
                (killfeed.node() as any).scrollTop = 31 * (scrollTo - 2);
            }
        }, 500);
    }

    keydown(e: KeyboardEvent){
        if (e.code == 'Space' && this.active){
            return false;
        }
    }

    keyup(e: KeyboardEvent){
        if (e.code == 'Space' && this.active){
            this.playpause();
            return false;
        }
    }

    play() {
        this.twitchPlayer.play();
    }

    pause() {
        this.twitchPlayer.pause();
    }

    private ready = true;
    playpause() {
        if (this.twitchPlayer && this.ready && !this.seeking){
            let now = this.twitchPlayer.getCurrentTime();
            if (now < this.twitchVideoStart + this.stage.end / 1000){
                this.ready = false;
                if (this.twitchPlayer.isPaused()){
                this.onPlay.push(() => {
                        // Fix bug where the player can get stuck after unpausing
                        this.twitchPlayer.seek(Math.max(this.twitchVideoStart + this.stage.start / 1000, now - 0.25));
                        this.ready = true;
                    });
                    this.play();
                } else {
                    this.onPause.push(() => {
                        this.ready = true;
                    });
                    this.pause();
                }
            }
        }
    }

    seek(time: number){
        if (this.twitchPlayer && this.twitchLoaded && this.showVod){
            let x = time / this.stage.duration;

            let start = this.twitchVideoStart + this.stage.start / 1000;
            let duration = this.stage.duration / 1000;

            let t = start + x * duration;
            if (this.twitchPlayer.isPaused()){
                console.log('seek to', t, 'from paused');

                this.onPlay.push(() => {
                    this.twitchPlayer.seek(t);
                });
                this.play();
            } else {
                console.log('seek to', t, 'from playing');
                this.onPause.push(() => {
                    window.setTimeout(e => {
                        this.twitchPlayer.seek(t - Math.random() * 3 + 2);
                        let initialMute = this.twitchPlayer.getMuted();
                        this.twitchPlayer.setMuted(true);
                        this.onPlay.push(() => {
                            this.twitchPlayer.seek(t);
                            this.twitchPlayer.setMuted(initialMute);
                            this.seeking = false;
                            console.log('seeked');
                        });
                        this.play();
                    }, 1000);
                })
                this.seeking = true;
                this.pause();
            }

            this.line.attr('x1', (x*100) + '%');
            this.line.attr('x2', (x*100) + '%');
        }
    }

    private init = false;
    ngOnChanges() {
        if (!this.init){
            this.init = true;
            this.createTimeline();
        }
        if (!this.twitchPlayer && this.active && this.afterView && this.showVod){
            this.createTwitchPlayer();
        }
        if (this.twitchPlayer && !this.active){
            this.twitchPlayer.pause();
        }
        if (this.twitchPlayer && !this.showVod){
            this.twitchPlayer.pause();
        }
    }

    createTimeline() {
        this.host = D3.select(this.element.nativeElement);
        
        const players = this.host.select('.timeline-players').selectAll('div')
            .data(this.stage.players).enter();
        const div = players.append('div').attr('class', 'col-xs-12');
        div.style('padding-bottom', (player: Player, i: number) =>
                 i === 5 ? '10px' : '0px');
        // Add name
        div.append('b')
            .attr('class', (player: Player) => {
                return 'col-xs-2 text-right text-' + player.colour + (player.name.indexOf('@') != -1 ? ' too-long' : '');
            }).text((player: Player) => player.name);

        const svg = div.append('svg')
            .attr('class', 'timeline col-xs-9');
        
        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '40px')
            .attr('fill', 'gray')
            .attr('stroke', 'white');

        // ults
        svg.selectAll('.timeline-event-nohover .ult-period').data((player: Player) => player.events.filter(event => event.type == 'ult'))
            .enter().append('rect')
            .attr('class', (event: GameEvent) => 'timeline-event ult-period ' + event.id)
            .attr('y', '28px')
            .attr('height', '11px')
            .attr('fill', '#9FECFC')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('width', (event: GameEvent) => this.x(Math.min(event.duration, this.stage.duration - event.time)) + '%')
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime)
            .attr('data-duration', (event: GameEvent) => event.duration);
        svg.selectAll('.timeline-event-nohover .ult-icon-gain').data((player: Player) => player.events.filter(event => event.type == 'ult'))
            .enter().append('image')
            .attr('class', (event: GameEvent) => 'timeline-event ult-icon-gain ' + event.id)
            .attr('xlink:href','assets/images/timeline/ult_gain.png')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('transform', 'translate(-14)')
            .attr('y', '18px')
            .attr('height', '29px');
        svg.selectAll('.timeline-event-nohover .ult-icon-use').data((player: Player) => player.events.filter(event => event.type == 'ult' && event.absoluteTime + event.duration < this.stage.end))
            .enter().append('image')
            .attr('class', (event: GameEvent) => 'timeline-event ult-icon-use ' + event.id)
            .attr('xlink:href','assets/images/timeline/ult_use.png')
            .attr('x', (event: GameEvent) => this.x(event.time + event.duration) + '%')
            .attr('transform', 'translate(-14)')
            .attr('y', '18px')
            .attr('height', '29px');

        svg.selectAll('.timeline-event .destroyed').data((player: Player) => player.events.filter(event => event.type == 'destroyed'))
            .enter().append('image')
            .attr('class', (event: GameEvent) => 'timeline-event destroyed ' + event.id)
            .attr('xlink:href','assets/images/timeline/explosion.png')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('transform', 'translate(-6)')
            .attr('y', 12)
            .attr('width', 15)
            .attr('height', 15)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime);

        svg.selectAll('.timeline-event .destruction').data((player: Player) => player.events.filter(event => event.type == 'destruction'))
            .enter().append('text')
            .attr('class', (event: GameEvent) => 'timeline-event destruction ' + event.id)
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('y', 26)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime)
            .text('*');

        svg.selectAll('.hero-image').data((player: Player) => player.heroesPlayed)
            .enter().append('image')
            .attr('xlink:href',
                  (hero: GameHero) => 'assets/images/heroes/' + hero.name + '.png')
            .attr('x', (hero: GameHero) => this.x(hero.start) + '%')
            .attr('class', 'hero-image')
            .attr('width', 40)
            .attr('height', 40)
            .attr('y', 0)
            .attr('data-timestamp', (hero: GameHero) => hero.start);

        svg.selectAll('.timeline-event .assist, .timeline-event .support-assist')
            .data((player: Player) => player.events.filter(event => event.type == 'assist' || event.type == 'support-assist'))
            .enter().append('text')
            .attr('class', (event: GameEvent) => 'timeline-event ' + event.type + ' ' + event.id)
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('y', 20)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime)
            .text('●');

        svg.selectAll('.timeline-event .ability-assist')
            .data((player: Player) => player.events.filter(event => event.type == 'ability-assist'))
            .enter().append('text')
            .attr('class', (event: GameEvent) => 'timeline-event ' + event.type + ' ' + event.id)
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('y', 20)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime)
            .text('●');

        svg.selectAll('.timeline-event .kill').data((player: Player) => player.events.filter(event => event.type == 'kill'))
            .enter().append('text')
            .attr('class', (event: GameEvent) => 'timeline-event kill ' + event.id)
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('y', 20)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime)
            .text('●');

        svg.selectAll('.timeline-event .death').data((player: Player) => player.events.filter(event => event.type == 'death'))
            .enter().append('image')
            .attr('class', (event: GameEvent) => 'timeline-event death ' + event.id)
            .attr('xlink:href','assets/images/timeline/skull.png')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('transform', 'translate(-6)')
            .attr('y', 12)
            .attr('width', 15)
            .attr('height', 15)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime);

        svg.selectAll('.timeline-event .death').data((player: Player) => player.events.filter(event => event.type == 'resurrect'))
            .enter().append('image')
            .attr('class', (event: GameEvent) => 'timeline-event resurrect ' + event.id)
            .attr('xlink:href','assets/images/timeline/res.png')
            .attr('x', (event: GameEvent) => this.x(event.time) + '%')
            .attr('transform', 'translate(-6)')
            .attr('y', 9)
            .attr('width', 20)
            .attr('height', 20)
            .attr('data-other', (event: GameEvent) => event.other)
            .attr('data-type', (event: GameEvent) => event.type)
            .attr('data-timestamp', (event: GameEvent) => event.absoluteTime);
        
        // Add the kills and deaths
        const b = div.append('b')
            .attr('class', 'col-xs-1 text-left num');
        b.append('span').attr('class', 'kill')
            .text((player: Player) => player.kills);
        b.append('span')
            .text((player: Player) => ' / ');
        b.append('span').attr('class', 'death')
            .text((player: Player) => player.deaths);
        
        const time = this.host.select('.timeline-players')
            .insert('div',':first-child').attr('class', 'col-xs-12');
        time.append('div').attr('class', 'col-xs-2');
        const timelineTickSvg = time.append('svg')
            .attr('height', 20)
            .attr('class', 'col-xs-10')
            .style('padding', 0)
            .attr('overflow', 'visible');
        
        const scale = D3.scaleLinear()
            .domain([0, (this.stage.end - this.stage.start) / 1000])
            .range([0, (svg.node() as any).getBoundingClientRect().width-1]);

        const axis = D3.axisTop(scale);
        axis.ticks(7);
        axis.tickFormat((d: number) => {
            const min = D3.format('d')(Math.floor(d / 60));
            const sec = D3.format('02d')(d - (Math.floor(d / 60) * 60));
            return min + ':' + sec;
        });

        // Only add a tick for the end value if the previous tick is far enough away
        let ticks = scale.ticks(7);
        if (ticks[ticks.length - 1] < scale.domain()[1] * 0.95){
            axis.tickValues(scale.ticks(7).concat(scale.domain()[1]));
        }
        
        const timelineAxis = timelineTickSvg.append('g').attr('transform','translate(0,19)').call(axis);
        timelineAxis.selectAll('text').attr('fill','white');
        timelineAxis.selectAll('path').attr('stroke','white');
        timelineAxis.selectAll('line').attr('stroke','white');

        const timelineAxis2 = timelineTickSvg.append('g').attr('transform','translate(0,19)').call(axis);
        timelineAxis2.selectAll('text').attr('fill','white');
        timelineAxis2.selectAll('path').attr('stroke','white');
        timelineAxis2.selectAll('line').attr('stroke','white');

        let lineArea = this.host.select('.timeline-players').append('div')
            .attr('class', 'col-xs-12')
            .style('position', 'absolute');
        lineArea.append('div').attr('class', 'col-xs-2 timeline');
        let lineArea2 = lineArea.append('svg').attr('class', 'col-xs-9 timeline');
        this.line = lineArea.append('line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 50)
            .attr('y2', 50 + 12 * 40 + 10)
            .attr('stroke-width', 3)
            .attr('stroke', 'black')
            .style('display', 'none');
        
        // hack hack hack
        window.setTimeout(e =>{
            svg.selectAll(".timeline-event")
                .on("mouseover", this.mouseOverTimelineEvent)
                .on("mouseout", this.mouseOutTimelineEvent);
            
            svg.selectAll("svg .timeline-event")
                .on("click", e => {
                    if (this.active){
                        let x = D3.event.layerX / (lineArea2.node() as any).clientWidth;
                        this.seek(x * this.stage.duration);

                        let scrollTo = 0;
                        for (let k of this.stage.killfeed){
                            if ((e as KillFeedEntry).id == k.id){
                                break;
                            }
                            scrollTo += 1;
                        }
                        let killfeed = D3.select('.killfeed-' + this.stage.index);
                        (killfeed.node() as any).scrollTop = 31 * (scrollTo - 2);
                    }
                });

            svg.selectAll('svg rect')
                .on('click', e => {
                    let d3 = D3;
                    if (this.active){
                        let x = D3.event.layerX / (lineArea2.node() as any).clientWidth;
                        this.seek(x * this.stage.duration);
                    }
                }
            );

            svg.selectAll('svg .hero-image')
                .on('click', e => {
                    let d3 = D3;
                    if (this.active){
                        let x = D3.event.layerX / (lineArea2.node() as any).clientWidth;
                        this.seek(x * this.stage.duration);
                    }
                }
            );

        }, 0);
    }

    mouseOverTimelineEvent() {
        //Find the id of the event by searching through the classes of the current element
        let classes: Array<String> = D3.select(this as any).attr('class').split(" ");
        let eventId = null;
        for (const cls of classes) {
            if (cls.startsWith("event")) {
                eventId = cls;
                break;
            }
        }
        let isKillFeed = (this as any).tagName.toLowerCase() === "tr";

        if (isKillFeed) {
            D3.selectAll("svg .timeline-event:not(." + eventId + ")").classed('faded', true);
            D3.selectAll("tr.timeline-event:not(." + eventId + ")").classed('slight-faded', true);
        } else {
            D3.selectAll(".timeline-event:not(." + eventId + ")").classed('faded', true);
        }

        D3.selectAll(".timeline-event." + eventId).classed('highlighted', true);
    }
     
    mouseOutTimelineEvent() {
        D3.selectAll(".timeline-event").classed('faded', false);
        D3.selectAll(".timeline-event").classed('slight-faded', false);
        D3.selectAll(".timeline-event").classed('highlighted', false);
    }
     

    widthPercentage(hero: GameHero) {
        return 100 * (hero.end - hero.start) / (this.stage.end - this.stage.start);
    }

    x(time: number) {
        return 100 * time / (this.stage.end - this.stage.start);
    }

    eventLeft(event: GameEvent) {
        return 100 * Math.min(event.time / (this.stage.end - this.stage.start), 1);
    }
     
    stageTime(event: GameEvent) {
        const time = Math.floor(event.time / 1000);
        const min = D3.format('d')(Math.floor(time / 60));
        const sec = D3.format('02')(time - (Math.floor(time / 60) * 60));
        return min + ':' + sec;
    }   
     
    leftColor(kill: KillFeedEntry) {
        if (kill.isLeftRed) {
            return 'text-red';
        }
        return 'text-blue';
    }

    rightColor(kill: KillFeedEntry) {
        let isBlue = kill.isLeftRed && !kill.isRes || !kill.isLeftRed && kill.isRes; 
        if (isBlue) {
            return 'text-blue';
        }
        return 'text-red';
    }
     
     tooLong(name: String): String {
         if (name && name.length > 12) {
             return "too-long"
         }
         return "";
     }

    time(kill: KillFeedEntry) {
        let time = kill.time - this.stage.start;
        let secs = Math.floor(time / 1000);
        let mins = Math.floor(secs / 60);
        secs = secs - 60 * mins;
        let secd = secs < 10 ? '0' + secs : secs;
        return mins + ':' + secd;
    }
     
    endTime() {
        const time = Math.floor((this.stage.end - this.stage.start) / 1000);
        const min = D3.format('d')(Math.floor(time / 60));
        const sec = D3.format('02')(time - (Math.floor(time / 60) * 60));
        return min + ':' + sec;
    }

    isKOTH() {
        return 'ownership' in this.stage.objectiveInfo;
    }

    pushingEvents(events: any) {
        if (!events){
            return [];
        }
        return events.filter(e => e.type == 'pushing' && e.end - e.start > 3 * 1000);
    }

    tickEvents(events: any){
        if (!events){
            return [];
        }
        let filteredEvents: Array<any> = [];
        for (let e of events){
            if (e.type != 'tick'){
                continue;
            }
            if (e.time - this.stage.start < 25 * 1000 || this.stage.end - e.time < 25 * 1000){
                // too close to start or end
                continue;
            }
            let objectiveInfo = <PayloadObjectiveInfo>this.stage.objectiveInfo;
            let valid = true;
            for (let checkpoint of objectiveInfo.checkpoints){
                if (Math.abs((checkpoint.time + this.stage.start ) - e.time) < 25 * 1000){
                    valid = false;
                    break;
                }
            }
            if (!valid){
                continue;
            }

            filteredEvents.push(e);
        }
        return filteredEvents;
    }

    pushingWidthPercentage(event){
        return 100 * (event.end - event.start) / (this.stage.end - this.stage.start);
    }

    highlightKill(kill: KillFeedEntry, time: number){
        let timeSinceKill = time - kill.time;
        return (-1 * 1000 < timeSinceKill && timeSinceKill < this.highlightKillWindow);
    }
}
