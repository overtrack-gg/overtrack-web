import { Component, OnInit, Input, ViewEncapsulation, ViewChild, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { Http } from '@angular/http';
import { FormGroup, FormBuilder } from '@angular/forms';
import { MultiSelectComponent } from 'ng-multiselect-dropdown';
import { ListItem } from 'ng-multiselect-dropdown/multiselect.model';
import { ThrowStmt } from '@angular/compiler';

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
        `
    ]
})
export class VideoSearchComponent implements OnInit { 

    @Input() playlists: object;
    private heroesEndpoint = 'http://localhost:1235/video_search/available';
    private videoEndpoint = 'http://localhost:1235/video_search/video.m3u8'

    private options;

    url: string;
    form: FormGroup;

    @ViewChildren(MultiSelectComponent) private dropdowns : QueryList<MultiSelectComponent>;


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
        this.http.get(this.heroesEndpoint).subscribe(r=>{
            this.options = r.json();
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
        if (!this.options){
            // not loaded yet
            return;
        }

        let heroes: Array<ListItem> = [];
        let types: Array<ListItem> = [];
        let otherHeroes: Array<ListItem> = [];
        for (let hero of this.options){
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
                    // TODO: look this up in a map
                    let matchingHero = this.options.filter(e => e.id == otherHero);
                    if (matchingHero.length){
                        matchingHero = matchingHero[0].name;
                    } else {
                        matchingHero = otherHero;
                    }
                    if (!otherHeroes.reduce((p, e) => p || e.id == otherHero, false)){
                        otherHeroes.push({
                            id: otherHero,
                            text: matchingHero
                        })
                    }
                }
            }
        }
        console.log(heroes);
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
            console.log('Setting video path to', this.url);
        }
    }

}