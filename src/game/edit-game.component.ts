import { Component, OnInit, Input, Inject } from '@angular/core';
import { Http, RequestOptions, Headers, Response } from '@angular/http';
import { DOCUMENT } from '@angular/platform-browser';
import {  Game } from './game.service';

declare var $: any;

@Component({
    selector: 'edit-game',
    templateUrl: './edit-game.component.html'
})
export class EditGameComponent {
    @Input() game: Game;
    @Input() leaveOnDelete: boolean;
    @Input() allowRename: boolean;
    private editURL = 'https://api.overtrack.gg/edit_game';

    constructor(
        private http: Http,
        @Inject(DOCUMENT) public document: any
    ) { }

    edit() {
        // this should not be jquery...
        let playername: string = null;
        if ($('#playername-input').get(0)){
            playername = $('#playername-input').val().toUpperCase();
        }
        let startSR = Number($('#start-sr-input').val());
        let endSR = Number($('#end-sr-input').val());
        let result = $('#result-input').get(0).value.toUpperCase();
        let placement = false;
        if ($('#is-placement-input').get(0)){
            placement = $('#is-placement-input').get(0).checked;
        }

        if (playername && playername != this.game.player){
            if (!confirm('Changing the player name will change the tab this game belongs to in the games list. Are you sure?')){
                console.log('Edit canceled');
                $('#edit').modal('hide');
                return;
            }
            if (this.game.killfeed){
                for(let e of this.game.killfeed){
                    if (e.leftPlayer == this.game.player){
                        e.leftPlayer = playername;
                    }
                    if (e.rightPlayer == this.game.player){
                        e.rightPlayer = playername;
                    }
                }
            }
            this.game.player = playername;
            if (this.game.teams){
                this.game.teams.blue[0].name = playername;
            }
            if (this.game.stages){
                for (let s of this.game.stages){
                    s.players[0].name = playername;
                }
                // hack hack hack
                $('.timeline-players > .col-xs-12 > .text-blue').get(0).textContent = playername;
            }
        }

        this.game.player = playername;

        if (this.game.startSR != startSR){
            this.game.startSREditable = true;
        }
        this.game.startSR = startSR || null;

        if (this.game.endSR != endSR){
            this.game.endSREditable = true;
        }
        this.game.endSR = endSR || null;

        this.game.placement = placement;
        this.game.result = result.replace('UNKNOWN', 'UNKN');

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.editURL, 
            {
                'game': this.game.key,
                'player_name': playername,
                'start_sr': startSR,
                'end_sr': endSR,
                'placement': placement,
                'result': result,
            },
            options
        ).subscribe(
            // succ... hehehe
            succ => {
                $('#edit').modal('hide');
            },
            err => {
                $('#edit').modal('hide');
                throw err;
            }
        );
    }

    delete() {
        if (!confirm('Deleting a game cannot be undone. Are you sure?')){
            console.log('Delete canceled');
            $('#edit').modal('hide');
            return;
        }

        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.editURL, 
            {
                'game': this.game.key,
                'delete': true
            },
            options
        ).subscribe(
            succ => {
                this.game.deleted = true;
                if (this.leaveOnDelete){
                    this.document.location.href = '/';
                } else {
                    $('#edit').modal('hide');
                }
            },
            err => {
                $('#edit').modal('hide');
                throw err;
            }
        );
    }
}