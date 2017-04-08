import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList } from '../games-list/games-list.service';


declare var Plotly: any;

@Component({
    selector: 'statistics',
    templateUrl: './statistics.component.html',
    providers: [GamesListService, RouterModule]
})
export class StatisticsComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;

    constructor(private gamesListService: GamesListService,
        private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesLists = this.gamesListService.toGamesList(res);
            },
            err => {
                console.error(err);
            }
        );
    }

    getMostPlayedMap(): string {
        let counts: Map<string, number> = new Map<string, number>();
        for (let games of this.gamesLists){
            for (let game of games.list){
                let c: number = counts.get(game.map);
                if (!c){
                    c = 0; 
                }
                counts.set(game.map, c + 1);
            }
        }
        console.log(counts);

        let bestC: number = 0;
        let bestM: string;
        counts.forEach((c, map) => {
            if (c > bestC){
                bestM = map;
                bestC = c;
            }
        })
        return bestM;
    }

    getFavoriteHero(games: Array<GamesListEntry>): string {
        let counts: Map<string, number> = new Map<string, number>();
        for (let game of games){
            if (!game.heroes || game.heroes.length == 0 || !game.heroes[0]){
                // ignore bad/incomplete data
                continue;
            }
            let heroName = game.heroes[0].name;
            let c: number = counts.get(heroName);
            if (!c){
                c = 0; 
            }
            counts.set(heroName, c + 1);
        }
        console.log(counts);

        let bestC: number = 0;
        let bestH: string;
        counts.forEach((c, heroName) => {
            if (c > bestC){
                bestH = heroName;
                bestC = c;
            }
        })
        return bestH;
    }

}