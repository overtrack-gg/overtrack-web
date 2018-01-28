import { Component, OnInit } from '@angular/core';

declare var $: any;

@Component({
    selector: 'faq',
    templateUrl: './faq.component.html',
})
export class FAQComponent implements OnInit {

    ngOnInit(): void {
        $('.scrollto').on('click', e => {
            $('html, body').animate({scrollTop: $(e.target.hash).offset().top - 60}, 250);
            return false;
        });
        if (document.location.hash){
            window.setTimeout(e => {$('html, body').animate({scrollTop: $(document.location.hash).offset().top - 60}, 250);}, 400);
        }
    }
}
