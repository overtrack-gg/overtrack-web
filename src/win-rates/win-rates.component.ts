import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList, GamesListHero } from '../games-list/games-list.service';
import { heroStatNames } from '../game/tab-graphs/tab-graphs.component';


declare var Plotly: any;
const ALL_MAPS_NAME = "All Maps";
const LOW_FREQUENCY_HERO_PERCENTAGE = 20;

@Component({
    selector: 'statistics',
    templateUrl: './win-rates.component.html',
    styleUrls: ['./win-rates.component.css'],
    providers: [RouterModule]
})
	

export class WinRatesComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;
	mapStats: Map<string, MapStats>; //mapping of map to (hero to winrate)
	mapList: Array<string>;
	mapList2: Array<string>;//if player played more than 7 maps, split in two lists
	activeMap: string = ALL_MAPS_NAME; //currently selected map
	activeHero: string = "";//last clicked hero in dropdown menu for detailed stats
	heronamesOrderedByWR: Array<string>;
	heronamesOrderedByTime: Array<string>;
	showAllHeroes: boolean = false;//should all heroes be displayed, or only the most played ones
	lfhp: number = LOW_FREQUENCY_HERO_PERCENTAGE;
	normalise: boolean = true;

    constructor(private gamesListService: GamesListService, 
				private router: Router,
				private activatedRoute: ActivatedRoute) { }

	 ngOnInit(): void {
        this.activatedRoute.params.subscribe(
            params => {
                if (params.hasOwnProperty('share_key')){
                    this.fetchSharedGames(params['share_key']);
                } else {
                    this.fetchOwnGames();
                }
            }
        );
		this.normalise = localStorage.getItem('normalise') != 'false';
    }

	fetchSharedGames(share_key: string){
        this.gamesListService.fetchSharedGames(share_key,
            res => {
                this.gamesLists = res;
				if (this.gamesLists.length){
                 	this.calcWinrates(this.gamesLists[0].list);
	 			}
            },
            err => {
                console.error(err);
            }
        );
    }

    fetchOwnGames() {
        this.gamesListService.fetchGames(
            res => {
                this.gamesLists = res;
				if (this.gamesLists.length){
                 	this.calcWinrates(this.gamesLists[0].list);
	 			}
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
		//thisHeroWR.lastGameTimePlayed = hero.percentagePlayed * game.duration;
		thisHeroWR.gamesPlayed += 1;
		thisHeroWR.significantGamesPlayed += hero.percentagePlayed * 100 > this.lfhp ? 1 : 0;
		if(game.result === "WIN")
		{
			thisHeroWR.timewon += hero.percentagePlayed * game.duration;
			thisHeroWR.gamesWon += 1;
			thisHeroWR.significantGamesWon += hero.percentagePlayed * 100 > this.lfhp ? 1 : 0;
		}
	}
	
    calcWinrates(games: Array<GamesListEntry>): void {
		this.activeMap = ALL_MAPS_NAME;
		let maps: Map<string, MapStats> = new Map<string, MapStats>();
		maps.set(ALL_MAPS_NAME, new MapStats());
        for (let game of games){
			if (game.result == "UNKN"){
				continue;
			}

			if(game.heroes === null)
				continue;
			if(!maps.has(game.map))
			{
				maps.set(game.map, new MapStats());
			}
			//general stats
			maps.get(game.map).totalGames++;
			maps.get(ALL_MAPS_NAME).totalGames++;
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
		console.log(this.mapStats);
		
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

		this.mapStats.forEach((mapStat, map) => {
			mapStat.maxHeroTime = -1;
			mapStat.heroWinrates.forEach((winrate, hero) => {
				if (winrate.timeplayed > mapStat.maxHeroTime){
					mapStat.maxHeroTime = winrate.timeplayed;
				}
			});
		});
	}

	switchMap(map: string){
		this.activeMap = map;
	}

	currentMapHeroes(){
		let arr = Array.from(this.mapStats.get(this.activeMap).heroWinrates.keys());
		if(arr.indexOf("") != -1)
			arr.splice(arr.indexOf(""), 1);
		if(arr.indexOf("unknown") != -1)
			arr.splice(arr.indexOf("unknown"), 1);
		return arr;
	}
	
	sortedByWR(heroes: Array<string>) {
		return heroes.sort((a, b) => {
			return this.getHeroWinrate(b) - this.getHeroWinrate(a);
		})
	}

	sortedByPlaytime(heroes: Array<string>) {
		let mapStat = this.mapStats.get(this.activeMap);
		return heroes.sort((a, b) => {
			return mapStat.heroWinrates.get(b).timeplayed - mapStat.heroWinrates.get(a).timeplayed;
		})
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

	toggleNormalise() {
		this.normalise = !this.normalise;
		localStorage.setItem('normalise', this.normalise ? 'true': 'false');
	}

	getWinrate() {
		let map = this.mapStats.get(this.activeMap);
		return ((map.gamesWon / map.totalGames)	* 100).toFixed(2)
	}

	getHeroWinrate(heroName: string) {
		if (this.normalise){
			return this.getHeroWinrateByTime(heroName);
		} else {
			// maybe add an option to include all games?
			// if (this.showAllHeroes){
			// 	return heroWinrates.get(heroName).gamesWon / heroWinrates.get(heroName).gamesPlayed * 100;
			// }
			return this.getHeroWinrateByGames(heroName);
		}
	}
	
	getHeroWinrateByTime(heroName: string) {
		let heroWinrates = this.mapStats.get(this.activeMap).heroWinrates;
		if(heroWinrates.get(heroName).timewon == 0)
			return 0;
		return heroWinrates.get(heroName).timewon / heroWinrates.get(heroName).timeplayed * 100;
	}

	getHeroWinrateByGames(heroName: string) {
		let heroWinrates = this.mapStats.get(this.activeMap).heroWinrates;
		// maybe add an option to include all games?
		// if (this.showAllHeroes){
		// 	return heroWinrates.get(heroName).gamesWon / heroWinrates.get(heroName).gamesPlayed * 100;
		// }
		if(heroWinrates.get(heroName).significantGamesWon == 0)
			return 0;
		return heroWinrates.get(heroName).significantGamesWon / heroWinrates.get(heroName).significantGamesPlayed * 100;
	}

	getHeroPlayrate(heroName: string) {
		let mapStat = this.mapStats.get(this.activeMap);
		return mapStat.heroWinrates.get(heroName).timeplayed / mapStat.maxHeroTime * 100;
	}

	hideHero(heroName: string) {
		let map = this.mapStats.get(this.activeMap);
		if (!this.normalise && map.heroWinrates.get(heroName).significantGamesPlayed == 0){
			// no games played
			return true 
		} else if (this.showAllHeroes){
			return false;
		} else {
			return map.timeplayed / this.lfhp > map.heroWinrates.get(heroName).timeplayed;
		}
	}

	toTitleCase(str: string){
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }

	toHeroName(str: string) {
        if (str == 's76'){
            str = 'Soldier: 76';
        } else if (str == 'torb'){
            str = 'Torbjörn';
        } else if (str == 'dva'){
           return 'D.Va';
        }
        return this.toTitleCase(str);
    } 
}

class HeroWinrate{
	heroname: string;
	timeplayed: number = 0;
	timewon: number = 0;
	
	gamesPlayed: number = 0;
	significantGamesPlayed: number = 0;
	gamesWon: number = 0;
	significantGamesWon: number = 0;
}

class MapStats{
	heroWinrates: Map<string, HeroWinrate> = new Map<string, HeroWinrate>();
	totalGames: number = 0;
	gamesWon: number = 0;
	gamesTied: number = 0;
	gamesLost: number = 0;
	timeplayed: number = 0;
	maxHeroTime: number = 0;
}