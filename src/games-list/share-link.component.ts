import { Component, OnInit, Input } from '@angular/core';
import { Http, Response } from '@angular/http';

declare var $: any;

@Component({
    selector: 'share-link',
    template: `
        <button 
            id="share-button"
            type="button" 
            class="btn btn-primary {{ shareKey ? '' : 'disabled' }}" 
            (click)="copy()" 
            (mouseenter)="mouseenter()"
            (mouseleave)="mouseleave()"
            data-trigger="manual"
            data-content="Copy Share Link" 
            data-placement="bottom">
            <span class="glyphicon glyphicon-link"></span>Share
        </button>
    `
})
export class ShareLinkComponent implements OnInit {

    getShareKeyURL = 'https://api.overtrack.gg/get_share_key'
    gamesURL = 'https://overtrack.gg/games/'
    shareKey: string;

    private showCopied = false;

    constructor (private http: Http) {}

    ngOnInit(): void {
        this.http.get(this.getShareKeyURL, { withCredentials: true}).subscribe(
            res => {
                this.shareKey = res.json().share_key
            },
            err => {
                console.log(err);
            }
        );

        // this avoids having to use another package to get ng2 bindings for popover
        $('[data-toggle="popover"]').popover()
    }

    mouseenter() {
        if (!this.showCopied){
            $('#share-button').popover('show');
        }
    }

    mouseleave() {
        if (!this.showCopied){
            $('#share-button').popover('hide');
        }
    }

    copy() {
        let selBox = document.createElement('textarea');

        selBox.style.position = 'fixed';
        selBox.style.left = '0';
        selBox.style.top = '0';
        selBox.style.opacity = '0';
        selBox.value = this.gamesURL + this.shareKey;

        document.body.appendChild(selBox);
        selBox.focus();
        selBox.select();

        document.execCommand('copy');
        document.body.removeChild(selBox);

        this.showCopied = true;
        // $('#share-button').popover('hide');
        $('#share-button').attr('data-content', 'Copied!');
        $('#share-button').popover('show');
        setTimeout(e => {
            console.log('reset');
            $('#share-button').attr('data-content', 'Copy Share Link');
            $('#share-button').popover('hide');
            this.showCopied = false;
        }, 750);
        
    }
}