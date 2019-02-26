import { Component, OnInit, Input } from '@angular/core';

@Component({
    selector: 'playlists',
    template: `
<div class="playlists row">
<div class="panel with-nav-tabs panel-default" style="width: 100%;">
    <div class="panel-heading">
        <ul class="nav nav-tabs">
            <li><b>VOD:</b></li>
            <li class="{{f ? 'active' : ''}} titleize" *ngFor="let tab of tabs; let f = first;"><a (click)="changeTab(tab)" href="#{{ tab }}" data-toggle="tab">{{ tab }}</a></li>
        </ul>
    </div>
    <div class="player">
        <vg-player>
            <vg-overlay-play></vg-overlay-play>
            <!--<vg-buffering></vg-buffering>-->

            <vg-controls>
                <vg-play-pause></vg-play-pause>
                <vg-playback-button></vg-playback-button>

                <vg-time-display vgProperty="current" vgFormat="mm:ss"></vg-time-display>

                <vg-scrub-bar>
                    <vg-scrub-bar-current-time></vg-scrub-bar-current-time>
                    <vg-scrub-bar-buffering-time></vg-scrub-bar-buffering-time>
                </vg-scrub-bar>

                <vg-time-display vgProperty="left" vgFormat="mm:ss"></vg-time-display>
                <vg-time-display vgProperty="total" vgFormat="mm:ss"></vg-time-display>

                <vg-mute></vg-mute>
                <vg-volume></vg-volume>

                <vg-fullscreen></vg-fullscreen>
            </vg-controls>

            <video 
                [vgMedia]="media" 
                #media 
                id="singleVideo"
                preload="auto"
                crossorigin
                [vgHls]="url"
            >
            </video>
        </vg-player>
    </div>
</div>
</div>
`,
    styles: [
        `.playlists { 
            height: 695px; 
            margin-bottom: 40px;
            padding-bottom: 60px;
        }
        .player {
            padding: 20px;
        }
        .titleize {
            text-transform: capitalize;
        }
        .nav > li > i {
            display: block;
            padding: 10px 15px;
        }
        `
    ]
})
export class PlaylistsComponent implements OnInit { 

    @Input() playlists: object;

    private tabOrdering = [
        'vod',
        'Kills',
        'Resurrects',
        'Deaths',
        'Ults'
    ]

    tabs: Array<string> = [];
    url: string;

    toTitleCase(toTransform) {
        return toTransform.replace(/\b([a-z])/g, function (_, initial) {
            return initial.toUpperCase();
        });
      }

    ngOnInit(): void {
        this.url = this.playlists['vod'];

        for (let k of this.tabOrdering){
            if (Object.keys(this.playlists).indexOf(k.toLowerCase()) != -1) {
                if (k == 'vod'){
                    k = 'Game';
                }
                this.tabs.push(k);
            }
        }
        for (let k of Object.keys(this.playlists)){
            let found = false; 
            for (let o of this.tabOrdering){
                if (o.toLowerCase() == k){
                    found = true;
                    break
                }
            }
            if (!found){
                this.tabs.push(this.toTitleCase(k));
            }
        }
    }

    changeTab(tab: string): void {
        if (tab == 'Game'){
            tab = 'vod';
        }
        this.url = this.playlists[tab.toLowerCase()];
    }

}
