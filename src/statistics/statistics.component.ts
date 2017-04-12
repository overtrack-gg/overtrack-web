import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList } from '../games-list/games-list.service';


declare var Plotly: any;

@Component({
    selector: 'statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css'],
    providers: [GamesListService, RouterModule]
})

export class StatisticsComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;
	heroWinratesForMap: Map<string, HeroWinrate>;
	orderedHeronames: Array<string>;

    constructor(private gamesListService: GamesListService,
        private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesLists = this.gamesListService.toGamesList(res);
                this.renderWinrates(this.gamesLists[0].list);
            },
            err => {
                console.error(err);
            }
        );
    }

    playerHref(playerGames: PlayerGameList): string{
        return 'player_' + playerGames.player.replace(/\W/g, '_');
    }
	
    renderWinrates(games: Array<GamesListEntry>): void {
		let maps: Map<string, Map<string, HeroWinrate>> = new Map<string, Map<string, HeroWinrate>>();
		maps.set("All Maps", new Map<string, HeroWinrate>());
        for (let game of games){
			if(game.heroes === null)
				continue;
			if(!maps.has(game.map))
			{
				maps.set(game.map, new Map<string, HeroWinrate>());
			}
			let thisMapHeroWR = maps.get(game.map);
			for(let singleHero of game.heroes)
			{
				//this map
				if(!thisMapHeroWR.has(singleHero.name))
				{
					let blankHeroWR = new HeroWinrate();
					blankHeroWR.heroname = singleHero.name;
					blankHeroWR.timeplayed = 0;
					blankHeroWR.timewon = 0;
					thisMapHeroWR.set(singleHero.name, blankHeroWR);
				}
				let thisHeroWR = thisMapHeroWR.get(singleHero.name);
				thisHeroWR.timeplayed += singleHero.percentagePlayed * game.duration;
				if(game.result === "WIN")
				{
					thisHeroWR.timewon += singleHero.percentagePlayed * game.duration;
				}
				//all maps
				if(!maps.get("All Maps").has(singleHero.name))
				{
					let blankHeroWR = new HeroWinrate();
					blankHeroWR.heroname = singleHero.name;
					blankHeroWR.timeplayed = 0;
					blankHeroWR.timewon = 0;
					maps.get("All Maps").set(singleHero.name, blankHeroWR);
				}
				thisHeroWR = maps.get("All Maps").get(singleHero.name);
				thisHeroWR.timeplayed += singleHero.percentagePlayed * game.duration;
				if(game.result === "WIN")
				{
					thisHeroWR.timewon += singleHero.percentagePlayed * game.duration;
				}
			}
        }
		let combinedWR = maps.get("All Maps");
		let orderedHeronames: Array<string> = [];
		//console.log(combinedWR.keys());
		//order by best winrate first
		while(Array.from(combinedWR.keys()).length > orderedHeronames.length)
		{
			let maxWR: number = -1;
			let maxHero: string = "";
			for(let keyHeroname of Array.from(combinedWR.keys()))
			{
				if(orderedHeronames.includes(keyHeroname))
					continue;//hero already added
				let thisHeroWR = combinedWR.get(keyHeroname);
				if(thisHeroWR.timewon / thisHeroWR.timeplayed > maxWR)
				{
					maxWR = thisHeroWR.timewon / thisHeroWR.timeplayed;
					maxHero = keyHeroname;
				}
			}
			orderedHeronames.push(maxHero);
		}
		
		this.heroWinratesForMap = combinedWR;
		this.orderedHeronames = orderedHeronames;
		console.log(this.heroWinratesForMap);
		console.log(this.orderedHeronames);
	}

}

class HeroWinrate{
	heroname: string;
	timeplayed: number;
	timewon: number;
}