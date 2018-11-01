import { Component, OnInit } from '@angular/core';
import { Http, Response, RequestOptions, Headers } from '@angular/http';
import { Router, ActivatedRoute, Params} from '@angular/router';

import { UserLoginService } from '../login/user-login.service';

export enum SubscriptionState {
    NoGames = 1,
    NeedMoreGames,
    TrialActive,
    TrialOver,
    CanCancel,
    WillNotRenew,
    TrialNotStarted
}


@Component({
    selector: 'subscribe',
    templateUrl: './subscribe.component.html',
})
export class SubscribeComponent implements OnInit {
    private subscriptionURL = 'https://api.overtrack.gg/get_subscription';
    private subscribeURL = 'https://api.overtrack.gg/subscribe';
    private cancelSubscriptionURL = 'https://api.overtrack.gg/cancel_subscription';

    paypalSubscribeURL = 'https://www.paypal.com/cgi-bin/webscr';
    paypalHostedButtonID = 'M4B2GQMPY5N78';
    paypalUnsubscribeURL = 'https://www.paypal.com/cgi-bin/webscr?cmd=_subscr-find&alias=M6LFV3XCTA2X6';

    subscription: Subscription;
    subscriptionState: SubscriptionState;
    remainingDays: number;

    buttonActive: boolean = false;
    loading: boolean = false;

    userID: number = null;

    constructor(public router: Router, public route: ActivatedRoute, private http: Http) {}

    ngOnInit(): void {
        this.updateSubscriptionInfo();
    }

    updateSubscriptionInfo() {
        this.http.get(
            this.subscriptionURL, 
            {withCredentials: true}
        ).subscribe(
            res => {
                let body = res.json();

                this.userID = body.user_id;

                let currentPeriodEnd: Date = null;
                if (body.current_period_end){
                    currentPeriodEnd = new Date(body.current_period_end * 1000);
                }
                let trialGamesRemaining: number = null;
                if (body.trial_games_remaining){
                    trialGamesRemaining = Math.max(0, body.trial_games_remaining);
                }
                let trialEndTime: Date = null;
                if (body.trial_end_time){
                    trialEndTime = new Date(body.trial_end_time * 1000);
                    this.remainingDays = Math.round((trialEndTime.getTime() - new Date().getTime())/(1000*60*60*24));
                }
                this.subscription = {
                    subscriptionActive: body.subscription_active,
                    subscriptionType: body.subscription_type,

                    accountValid: body.account_valid,
                    free: body.free,

                    trialUsed: body.trial_used,
                    trialValid: body.trial_valid,
                    trialGamesRemaining: trialGamesRemaining,
                    trialEndTime: trialEndTime,
                    gamesParsed: body.games_parsed,

                    cancelAtPeriodEnd: body.cancel_at_period_end,
                    currentPeriodEnd: currentPeriodEnd,
                }
                console.log(this.subscription);

                if (this.subscription.subscriptionActive){
                    if (this.subscription.cancelAtPeriodEnd){
                        this.subscriptionState = SubscriptionState.WillNotRenew;
                    } else {
                        this.subscriptionState = SubscriptionState.CanCancel;
                    }
                } else {
                    /* if (this.subscription.gamesParsed == 0){
                        this.subscriptionState = SubscriptionState.NoGames;
                    } else if (this.subscription.gamesParsed < 3){
                        this.subscriptionState = SubscriptionState.NeedMoreGames;
                    } else */ if (this.subscription.trialValid){
                        this.subscriptionState = SubscriptionState.TrialActive;
                    } else if (!this.subscription.trialUsed){
                        this.subscriptionState = SubscriptionState.TrialNotStarted;
                    } else {
                        this.subscriptionState = SubscriptionState.TrialOver;
                    }
                }
                console.log(this.subscriptionState);
                this.buttonActive = true;
            },
            err => {
                throw new Error(err);
            }
        );
    }

    doSubscribe() {
        this.buttonActive = false;
        var handler = (<any>window).StripeCheckout.configure({
            key: 'pk_live_v4UzZ7r2Oo1OtmbgHryZ19Rk',
            locale: 'auto',
            image: "https://stripe.com/img/documentation/checkout/marketplace.png",
            name: "Overtrack",
            description: "Overtrack Subscription ($4.99 per month)",
            panelLabel: "Subscribe",
            allowRememberMe: false,
            token: token => {
                this.loading = true;
                let headers = new Headers({ 'Content-Type': 'application/json' });
                let options = new RequestOptions({ headers: headers, withCredentials: true });
                this.http.post(
                    this.subscribeURL,
                    JSON.stringify(token), 
                    options
                ).subscribe(
                    res => {
                        this.updateSubscriptionInfo();
                    },
                    err => {
                        console.error(err)
                        //this.updateSubscriptionInfo();
                    }
                );
            },
            closed: e => {
                if (this.loading){
                    this.loading = false;
                } else {
                    this.buttonActive = true;
                }
            }
        });

        handler.open({
            name: 'Overtrack Subscription',
            description: '$4.99 / month until canceled',
            amount: 499
        });
    }

    cancelSubscription() {
        this.buttonActive = false;
        let headers = new Headers({ 'Content-Type': 'application/json' });
        let options = new RequestOptions({ headers: headers, withCredentials: true });
        this.http.post(
            this.cancelSubscriptionURL,
            "",
            options
        ).subscribe(
            res => {
                this.updateSubscriptionInfo();
            },
            err => {
                throw new Error(err);
            }
        );
    }

}

export class Subscription {
    subscriptionActive: boolean;
    subscriptionType: string;

    accountValid: boolean;
    free: boolean;

    trialUsed: boolean;
    trialValid: boolean;
    trialGamesRemaining: number;
    trialEndTime: Date;
    gamesParsed: number;

    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: Date;
}