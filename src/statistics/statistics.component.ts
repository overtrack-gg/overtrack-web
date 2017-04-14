import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList, GamesListHero } from '../games-list/games-list.service';


declare var Plotly: any;
const ALL_MAPS_NAME = "All Maps";
const LOW_FREQUENCY_HERO_PERCENTAGE = 20;

@Component({
    selector: 'statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css'],
    providers: [GamesListService, RouterModule]
})
	

export class StatisticsComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;
	mapStats: Map<string, MapStats>; //mapping of map to (hero to winrate)
	mapList: Array<string>;
	mapList2: Array<string>;//if player played more than 7 maps, split in two lists
	activeMap: string; //currently selected map
	heronamesOrderedByWR: Array<string>;
	heronamesOrderedByTime: Array<string>;
	showAllHeroes: boolean = false;//should all heroes be displayed, or only the most played ones
	lfhp: number = LOW_FREQUENCY_HERO_PERCENTAGE;

    constructor(private gamesListService: GamesListService,
        private router: Router) { }

    ngOnInit(): void {
        this.gamesListService.getGamesList().subscribe(
            res => {
                this.gamesLists = this.gamesListService.toGamesList(res);
                this.calcWinrates(this.gamesLists[0].list);
            },
            err => {
                console.error(err);
            }
        );
    }

    playerHref(playerGames: PlayerGameList): string{
        return 'player_' + playerGames.player.replace(/\W/g, '_');
    }

	updateHeroWR(winrates: Map<String, HeroWinrate>, game: GamesListEntry, hero: GamesListHero): void {
		if (!winrates.has(hero.name)) {
			let blankHeroWR = new HeroWinrate();
			blankHeroWR.heroname = hero.name;
			winrates.set(hero.name, blankHeroWR);
		}
		let thisHeroWR = winrates.get(hero.name);
		thisHeroWR.timeplayed += hero.percentagePlayed * game.duration;
		if(game.result === "WIN")
		{
			thisHeroWR.timewon += hero.percentagePlayed * game.duration;
		}
	}
	
    calcWinrates(games: Array<GamesListEntry>): void {
		let maps: Map<string, MapStats> = new Map<string, MapStats>();
		maps.set(ALL_MAPS_NAME, new MapStats());
        for (let game of games){
			if(game.heroes === null)
				continue;
			if(!maps.has(game.map))
			{
				maps.set(game.map, new MapStats());
			}
			//general stats
			if(game.result === "WIN")
			{
				maps.get(game.map).gamesWon++;
				maps.get(ALL_MAPS_NAME).gamesWon++;
			}
			else if(game.result === "DRAW")
			{
				maps.get(game.map).gamesTied++;
				maps.get(ALL_MAPS_NAME).gamesTied++;
			}
			else if(game.result === "LOSS")
			{
				maps.get(game.map).gamesLost++;
				maps.get(ALL_MAPS_NAME).gamesLost++;
			}
			maps.get(game.map).timeplayed += game.duration;
			maps.get(ALL_MAPS_NAME).timeplayed += game.duration;
			//calc hero winrates
			let thisMapHeroWR = maps.get(game.map).heroWinrates;
			for(let singleHero of game.heroes)
			{
				//this map
				this.updateHeroWR(thisMapHeroWR, game, singleHero);
							
				//all maps
				this.updateHeroWR(maps.get(ALL_MAPS_NAME).heroWinrates, game, singleHero);
			}
        }
		this.mapStats = maps;
		
		this.mapList = [];
		this.mapList2 = [];
		let mapcount = 0;
		while(Array.from(maps.keys()).length > this.mapList.length + this.mapList2.length)
		{
			let minMap = "";
			for(let keyMap of Array.from(maps.keys()))
			{
				if(this.mapList.includes(keyMap) || this.mapList2.includes(keyMap))
					continue;//hero already added
				if(minMap === "" || keyMap < minMap)
					minMap = keyMap;
			}
			if(mapcount <= 8)//first 8 maps to first list
				this.mapList.push(minMap);
			else
				this.mapList2.push(minMap);
			mapcount++;
		}
		this.renderMapStats(ALL_MAPS_NAME);//default active map to all maps
	}
	
	renderMapStats(map: string): void{
		this.activeMap = map;//adjust active map
		
		let combinedWR = this.mapStats.get(map).heroWinrates;
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
			if(maxHero === "")
				break;
			orderedHeronames.push(maxHero);
		}
		this.heronamesOrderedByWR = orderedHeronames;
		//order by time
		orderedHeronames = [];
		let first = true;
		while(Array.from(combinedWR.keys()).length > orderedHeronames.length)
		{
			let maxTime: number = -1;
			let maxHero: string = "";
			for(let keyHeroname of Array.from(combinedWR.keys()))
			{
				if(orderedHeronames.includes(keyHeroname))
					continue;//hero already added
				let thisHeroWR = combinedWR.get(keyHeroname);
				if(thisHeroWR.timeplayed > maxTime)
				{
					maxTime = thisHeroWR.timeplayed;
					maxHero = keyHeroname;
				}
			}
			if(maxHero === "")
				break;
			if(first)
			{
				first = false;
				this.mapStats.get(this.activeMap).maxHeroTime = maxTime;
			}
			orderedHeronames.push(maxHero);
		}
		this.heronamesOrderedByTime = orderedHeronames;
	}

	formatTime(time: number): string{
		let seconds = Math.floor( (time) % 60 );
		let minutes = Math.floor( (time/60) % 60 );
		let hours = Math.floor( time/(60*60));
		return (hours < 10 ? "0" : "")+hours+":"+(minutes < 10 ? "0" : "")+minutes+":"+(seconds < 10 ? "0" : "")+seconds;
	}
	
	toggleAllHeroes()
	{
		this.showAllHeroes = !this.showAllHeroes;
	}
}

class HeroWinrate{
	heroname: string;
	timeplayed: number = 0;
	timewon: number = 0;
}

class MapStats{
	heroWinrates: Map<string, HeroWinrate> = new Map<string, HeroWinrate>();
	gamesWon: number = 0;
	gamesTied: number = 0;
	gamesLost: number = 0;
	timeplayed: number = 0;
	maxHeroTime: number = 0;
}