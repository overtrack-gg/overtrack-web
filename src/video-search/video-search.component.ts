import { OnInit, Input, ViewEncapsulation, ViewChild, ViewChildren, QueryList, Component, EventEmitter } from '@angular/core';
import { Http } from '@angular/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MultiSelectComponent } from 'ng-multiselect-dropdown';
import { ListItem } from 'ng-multiselect-dropdown/multiselect.model';
import { VgHLS } from 'videogular2/src/streaming/vg-hls/vg-hls';
import { VgAPI } from 'videogular2/core';
import * as Hls from 'hls.js';

interface HeroEventsSummary {
    id: string,
    name: string,
    role: string,
    events: {
        map: Array<string>,
        mode: Array<string>,
        other_hero: Array<string>,
        type: Array<string>
    }
}

interface KillHero{
    hero: string,
    player: string,
    blue_team: boolean,
    name_correct: boolean,
}

interface Kill {
    timestamp: number,
    left: KillHero,
    right: KillHero,
    suicide: boolean,
    resurrect: boolean
}

interface Event {
    id: string,
    game_key: string,
    time: number,
    player: string,
    map: string,
    mode: string,
    hero: string,
    other_hero: string,
    type: string,
    data: Kill,
    suicide: boolean,
    resurrect: boolean
}

@Component({
    selector: 'killfeed-event',
    templateUrl: 'killfeed-event.component.html',
    styles: [
        `
        `
    ]
})
export class KillfeedEventComponent {
    @Input() data: Kill;
    
    time() {
        let time = this.data.timestamp;
        let secs = Math.floor(time);
        let mins = Math.floor(secs / 60);
        secs = secs - 60 * mins;
        let secd = secs < 10 ? '0' + secs : secs;
        return mins + ':' + secd;
    }

    teamClass(hero: KillHero){
        if (hero && hero.blue_team){
            return 'text-blue';
        }
        return 'text-red';
    }

    tooLong(hero: KillHero): string {
        if (hero && hero.player && hero.player.length > 12) {
            return 'too-long'
        }
        return '';
    }
}

@Component({
    selector: 'video-search',
    templateUrl: 'video-search.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [
        `
        body {
            margin: 0;
            height: 100%;
            overflow: hidden
        }
        .footer-container {
            display: none !important;
        }

        .video-search {
            height: calc(100vh - 50px);
        }
        .video-search-form {
            height: 100px;
        }
        .video-search-player{
            height: calc(100vh - 150px);
        }
        .events-overlay {
            display: flex;
            flex-direction: column;
            position: absolute;
            left: 0;
            width: 25%;
            max-width: 350px;
            font-family: sans-serif;
            color: white;
            z-index: 250;
            background-color: rgba(0, 0, 0, 0.4);
            padding-left: 30px;
        }
        .event {
            
        }
        vg-scrub-bar-cue-points .cue-point-container .cue-point {
            background-color: rgba(255, 204, 0, 0.5) !important;
        }
        .no-results-banner {
            position: absolute;
            top: 50px;
            left: 25%;
            width: 50%;
            font-family: 'Roboto', sans-serif;
        }
        `
    ]
})
export class VideoSearchComponent implements OnInit { 

    @Input() playlists: object;
    private heroesEndpoint = 'https://api2.overtrack.gg/video_search/available';
    private videoEndpoint = 'https://api2.overtrack.gg/video_search/video.m3u8'
    private metadataEndpoint = 'https://api2.overtrack.gg/video_search/metadata.vtt';

    private eventsSummary: Array<HeroEventsSummary>;

    metadata: Array<string> = [];
    activeCuePoints: Array<Event> = [];

    url: string;
    haveResults = true;
    form: FormGroup;

    @ViewChild(VgHLS) private vgHls: VgHLS;
    @ViewChildren(MultiSelectComponent) private dropdowns : QueryList<MultiSelectComponent>;
    // @ViewChildren(TextTrack) tracks : QueryList<TextTrack>;
    tracks: Array<TextTrack>;


    @ViewChild('heroDropdown') private heroDropdown: MultiSelectComponent;
    heroes: Array<ListItem>;
    heroDropdownSettings = {
        singleSelection: false,
        enableCheckAll: true,
        clearSearchFilter: true,
        selectAllText: 'All Heroes',
        unSelectAllText: 'Unselect All',
        itemsShowLimit: 2,
        allowSearchFilter: true,
        maxHeight: 500,
    };

    @ViewChild('typeDropdown') private typeDropdown: MultiSelectComponent;
    types: Array<ListItem>;
    typeDropdownSettings = {
        singleSelection: false,
        enableCheckAll: false,
        clearSearchFilter: true,
        itemsShowLimit: 2,
        allowSearchFilter: false,
    };

    @ViewChild('otherHeroDropdown') private otherHeroDropdown: MultiSelectComponent;
    otherHeroes: Array<ListItem>;
    otherHeroDropdownSettings = {
        singleSelection: false,
        clearSearchFilter: true,
        selectAllText: 'All Heroes',
        unSelectAllText: 'Unselect All',
        itemsShowLimit: 2,
        allowSearchFilter: true,
        maxHeight: 500,
    };

    constructor (private http: Http, private fb: FormBuilder) {}

    ngOnInit(): void {
        this.http.get(this.heroesEndpoint, {withCredentials: true}).subscribe(r=>{
            this.eventsSummary = r.json();
            console.log(this.eventsSummary);
            this.updateDropdowns();
            this.updateURL();
        })

        this.form = this.fb.group({
            hero: this.heroDropdown.selectedItems,
            type: this.typeDropdown.selectedItems,
            other_hero: this.otherHeroDropdown.selectedItems
        });
        this.form.valueChanges.subscribe(e => this.updateDropdowns());
    }

    onPlayerReady(api: VgAPI) {
        // update tracks list, used by scrub bar
        api.getDefaultMedia().subscriptions.loadedMetadata.subscribe((e) => {
            console.log('loaded metadata', e);
            this.haveResults = true;
            if (e.target && e.target.textTracks){
                this.tracks = e.target.textTracks;
            }
        });

        (<any>this.vgHls).onError.subscribe((e) => {
            console.error(e);
            this.haveResults = false;
        });

        // highlight the first event
        api.getDefaultMedia().subscriptions.loadedData.subscribe((e) => {
            api.seekTime(0.01);
        });

        // api.getDefaultMedia().subscriptions.play.subscribe((e) => {
        // });

        // hack to make hls.js only use credentials for the m3u8 but not the .ts chunks
        let _this = this;
        let onPlayerReady = this.vgHls.onPlayerReady.bind(this.vgHls);
        this.vgHls.onPlayerReady = function(){ 
            onPlayerReady(); 
            _this.vgHls.config.xhrSetup = function (xhr, url: string) {
                if (url.indexOf(_this.videoEndpoint) != -1){
                    xhr.withCredentials = true; 
                } else {
                    xhr.withCredentials = false; 
                }
            }
        }
    }

    onVideoError(e){
        console.error(e);
    }

    containsKey(list: Array<ListItem>, id: string){
        return list.reduce((p, c) => p || c.id == id, false);
    }

    dropdownContains(dropdownName: string, id: string): boolean{
        return this.containsKey(this.form.get(dropdownName).value || [], id);
    }

    addType(id: string, text: string){
        if (!this.containsKey(this.types, id)){
            let newtypes: Array<ListItem> = Object.assign([], this.types);
            newtypes.push({
                id: id,
                text: text
            })
            this.types = newtypes;
        }
    }

    removeType(id: string){
        this.types = this.types.filter(e => e.id != id);
        if (this.form.get('type').value){
            this.form.get('type').setValue(this.form.get('type').value.filter(e => e.id != id));
        }
    }

    updateDropdowns(){
        if (!this.eventsSummary){
            // not loaded yet
            return;
        }

        let heroes: Array<ListItem> = [];
        let types: Array<ListItem> = [];
        let otherHeroes: Array<ListItem> = [];
        for (let hero of this.eventsSummary){
            if (!hero.events){
                // no events for this hero
                continue;
            }
            heroes.push({
                id: hero.id,
                text: hero.name
            });
            if (!this.form.get('hero').value || this.form.get('hero').value.length == 0 || this.dropdownContains('hero', hero.id)){
                // hero selection is null OR hero is selected
                for (let type of Object.keys(hero.events.type)){
                    let name = type[0].toUpperCase() + type.substr(1);
                    if (!types.reduce((p, e) => p || e.id == type, false)){
                        types.push({
                            id: type,
                            text: name
                        })
                    }
                }
                for (let otherHero of Object.keys(hero.events.other_hero)){
                    if (!otherHeroes.reduce((p, e) => p || e.id == otherHero, false)){
                        otherHeroes.push({
                            id: otherHero,
                            text: this.toHeroName(otherHero)
                        })
                    }
                }
            }
        }
        if (!this.heroDropdown._settings.defaultOpen){
            this.heroes = heroes;
        }
        if (!this.typeDropdown._settings.defaultOpen){
            this.types = types;
        }
        if (!this.otherHeroDropdown._settings.defaultOpen){
            this.otherHeroes = otherHeroes;
        }
    }

    onDropDownClose() {
        let hasOpenDropdown = this.dropdowns.reduce((prev, dropdown) => prev || dropdown._settings.defaultOpen, false);
        if (hasOpenDropdown){
            return;
        }
        this.updateURL();
    }

    updateURL() {
        // TODO: wait to see if url will update again 
        // maybe schedule the update and cancel then reschedule if the url changes before the change
        let params = new URLSearchParams();
        for (let filter in this.form.controls){
            // TODO: dont add if all of the options are selected

            let value = this.form.get(filter).value;
            for (let k of value || []){
                params.append(filter, k.id);
            }
        }
        let newURL = this.videoEndpoint + '?' + params.toString();
        if (this.url != newURL){
            this.url = newURL;
            this.metadata = [this.metadataEndpoint + '?' + params.toString()];
            this.activeCuePoints = [];
        }
    }

    titleise(s: string) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    toHeroName(id: string) {
        let matchingHero = this.eventsSummary.filter(e => e.id == id);
        if (matchingHero.length){
            return matchingHero[0].name;
        } else {
            return this.titleise(id);
        }
    }

    toDateString(epoch: number){
        let date = new Date(epoch * 1000)
        return this.formatDate(date) + ' ' +  this.formatDay(date) + ' ' + this.formatTime(date);
    }

    formatTime(date: Date) {
        let hour = date.getHours();
        const pm = hour > 11;
        hour = hour % 12;
        hour = hour === 0 ? 12 : hour;
        let min: number|string = date.getMinutes();
        if (min < 10){
            min = '0' + min;
        }
        return hour + ':' + min + (pm ? 'pm' : 'am');
    }
    
    formatDate(date: Date) {
        return date.toLocaleDateString(undefined, {
            year: '2-digit',
            month: 'numeric',
            day: 'numeric'

        });
    }

    formatDay(date: Date) {
        var days = ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'];
        return days[date.getDay()]
    }

    showEvent(event: Event){
        if (!this.activeCuePoints.reduce((p, e) => p || e.id == event.id, false)){
            this.activeCuePoints.push(event);
        }
    }

    onEnterCuePoint(event) {
        this.showEvent({"id": event.id, ...JSON.parse(event.text)});
    }

    onExitCuePoint(event) { 
        this.activeCuePoints = this.activeCuePoints.filter(c => c.id != event.id);
    }
}

// hack to make vgHls bubble errors to us
VgHLS.prototype.ngOnInit = function () {
    var _this = this;
    if (this.API.isPlayerReady) {
        this.onPlayerReady();
    }
    else {
        this.subscriptions.push(this.API.playerReadyEvent.subscribe(function () { return _this.onPlayerReady(); }));
    }
    this.onError = new EventEmitter();
};

VgHLS.prototype.createPlayer = function () {
    var _this = this;
    if (this.hls) {
        this.destroyPlayer();
    }
    // It's a HLS source
    if (this.vgHls && this.vgHls.indexOf('.m3u8') > -1 && Hls.isSupported()) {
        var video = this.ref.nativeElement;
        this.hls = new Hls(this.config);
        this.hls.on(Hls.Events.MANIFEST_PARSED, function (event, data) {
            var videoList = [];
            videoList.push({
                qualityIndex: 0,
                width: 0,
                height: 0,
                bitrate: 0,
                mediaType: 'video',
                label: 'AUTO'
            });
            data.levels.forEach(function (item, index) {
                videoList.push({
                    qualityIndex: ++index,
                    width: item.width,
                    height: item.height,
                    bitrate: item.bitrate,
                    mediaType: 'video',
                    label: item.name
                });
            });
            _this.onGetBitrates.emit(videoList);
        });
        this.hls.on(Hls.Events.ERROR, function (e, d) {
            _this.onError.emit({event: e, data: d});
        })
        this.hls.loadSource(this.vgHls);
        this.hls.attachMedia(video);
    }
    else {
        if (this.target && !!this.target.pause) {
            this.target.pause();
            this.target.seekTime(0);
            this.ref.nativeElement.src = this.vgHls;
        }
    }
};