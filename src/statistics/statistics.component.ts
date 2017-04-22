import { Component, OnInit, Input } from '@angular/core';
import { Router, RouterModule } from '@angular/router';

import { GamesListService, GamesListEntry, PlayerGameList, GamesListHero } from '../games-list/games-list.service';
import { GameService, Game, KillFeedEntry, Stage, Player, GameHero, GameEvent, ObjectiveInfo } from '../game/game.service';


declare var Plotly: any;
const ALL_MAPS_NAME = "All Maps";
const LOW_FREQUENCY_HERO_PERCENTAGE = 20;

@Component({
    selector: 'statistics',
    templateUrl: './statistics.component.html',
    styleUrls: ['./statistics.component.css'],
    providers: [GamesListService, RouterModule, GameService]
})
	

export class StatisticsComponent implements OnInit {
    gamesLists: Array<PlayerGameList>;
	mapStats: Map<string, MapStats>; //mapping of map to (hero to winrate)
	mapList: Array<string>;
	mapList2: Array<string>;//if player played more than 7 maps, split in two lists
	activeMap: string; //currently selected map
	activeHero: string = "";//last clicked hero in dropdown menu for detailed stats
	heronamesOrderedByWR: Array<string>;
	heronamesOrderedByTime: Array<string>;
	showAllHeroes: boolean = false;//should all heroes be displayed, or only the most played ones
	lfhp: number = LOW_FREQUENCY_HERO_PERCENTAGE;
	normalise: boolean = false;

    constructor(private gamesListService: GamesListService, private gameService: GameService,
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
		thisHeroWR.gamesPlayed += 1;
		thisHeroWR.significantGamesPlayed += hero.percentagePlayed * 100 > this.lfhp ? 1 : 0;
		if(game.result === "WIN")
		{
			thisHeroWR.timewon += hero.percentagePlayed * game.duration;
			thisHeroWR.gamesWon += 1;
			thisHeroWR.significantGamesWon += hero.percentagePlayed * 100 > this.lfhp ? 1 : 0;
		}
	}
	
	updateHeroKDA(winrates: Map<String, HeroWinrate>, kdaThisMap: Array<HeroWinrate>): void{
		kdaThisMap.forEach(function(curHeroWR){
			if (!winrates.has(curHeroWR.heroname)) {
				let blankHeroWR = new HeroWinrate();
				blankHeroWR.heroname = curHeroWR.heroname;
				winrates.set(curHeroWR.heroname, blankHeroWR);
			}
			winrates.get(curHeroWR.heroname).kills += curHeroWR.kills;
			winrates.get(curHeroWR.heroname).deaths += curHeroWR.deaths;
			winrates.get(curHeroWR.heroname).assists += curHeroWR.assists;
			winrates.get(curHeroWR.heroname).damage += curHeroWR.damage;
			winrates.get(curHeroWR.heroname).healing += curHeroWR.healing;
		});
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
			
			//store dmg, healing, kills, deaths...
			this.gameService.getGame(game.key).subscribe(
                res => {
                    let singlegame = this.gameService.toGame(res);
					let kdaThisGame: Array<HeroWinrate> = [];
					let heroEndTimes: Array<number> = [];
					singlegame.stages.forEach(function(curStage){
						curStage.players.forEach(function(curPlayer){
							if(curPlayer.name !== singlegame.player)
								return;
							let curHero = curPlayer.heroesPlayed[0];
							let curHeroIndex = 0;
							let curHeroWR: HeroWinrate = new HeroWinrate();
							curHeroWR.heroname = curHero.name;
							kdaThisGame.push(curHeroWR);
							heroEndTimes.push(curHero.end);
							curPlayer.events.forEach(function(curEvent){
								if(curEvent.time > curHero.end)
								{
									curHeroIndex++;
									curHero = curPlayer.heroesPlayed[curHeroIndex];
									//new hero -> new entry in array
									curHeroWR = new HeroWinrate();
									curHeroWR.heroname = curHero.name;
									kdaThisGame.push(curHeroWR);
									heroEndTimes.push(curHero.end);
								}
								if(curEvent.type === "kill")
									curHeroWR.kills++;
								else if(curEvent.type === "death")
									curHeroWR.deaths++;
								else if(curEvent.type === "assist")
									curHeroWR.assists++;
							});
						});
					});
					//add dmg and healing
					if(singlegame.tabStatistics)
					{
						let lastHero = singlegame.tabStatistics.hero[0];
						let lastDamage = 0;//damage/healing for last hero
						let lastHealing = 0;
						let kdaThisGameIndex = 0;//index of next hero is greater or equal this
						singlegame.tabStatistics.hero.forEach(function(curHero, tabStatsIndex){
							if(lastHero !== curHero || tabStatsIndex == singlegame.tabStatistics.hero.length-1)
							{//last instance of last hero -> store stats
								let prevIndex = tabStatsIndex-1;//we want to look at the last instance of the prev played hero
								if(tabStatsIndex == singlegame.tabStatistics.hero.length-1)
									prevIndex = tabStatsIndex;
									
								if(kdaThisGame[kdaThisGameIndex].heroname !== lastHero)
									return;//a hero was only chosen in spawn, but not actually played -> ignore
								
								kdaThisGame[kdaThisGameIndex].damage += singlegame.tabStatistics.damage[prevIndex] - lastDamage;
								kdaThisGame[kdaThisGameIndex].healing += singlegame.tabStatistics.healing[prevIndex] - lastHealing;
								lastDamage = singlegame.tabStatistics.damage[prevIndex];
								lastHealing = singlegame.tabStatistics.healing[prevIndex];
								
								kdaThisGameIndex++;
								lastHero = curHero;
							}
						});
					}
					this.updateHeroKDA(thisMapHeroWR, kdaThisGame);
					this.updateHeroKDA(maps.get(ALL_MAPS_NAME).heroWinrates, kdaThisGame);
                },
                err => {
                    console.error(err);
                }
            );
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
		this.activeHero = "";//delete selected hero - will default to highest WR hero in renderMapStats()
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
		if(this.activeHero === "")
			this.activeHero = orderedHeronames[0];//if no hero selected, default to highest winrate hero
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
			if(maxHero === "" || maxTime == 0)
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
	
	//returns the hero for which detailed stats should be displayed. Note: activeHero is the last clicked hero
	//if activeHero wasnt played on this map, show stats for hero that is first option in dropdown menu
	getDisplayedHero(): string{
		if(this.mapStats.get(this.activeMap).heroWinrates.has(this.activeHero))
			return this.activeHero;
		else
			return this.heronamesOrderedByTime[0];
	}
	
	changeActiveHero(str: string){
		this.activeHero = str;
	}

	sortedByWR(heroes: Array<string>) {
		return heroes.sort((a, b) => {
			return this.getHeroWinrate(b) - this.getHeroWinrate(a);
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
	
	// ---------------------------------------------------FOR DROPDOWN MENU---------------------------------
	getDisplayedHeroKills(){
		return this.getHeroKills(this.getDisplayedHero());
	}
	getDisplayedHeroDeaths(){
		return this.getHeroDeaths(this.getDisplayedHero());
	}
	getDisplayedHeroAssists(){
		return this.getHeroAssists(this.getDisplayedHero());
	}
	getDisplayedHeroKDARatio(){
		return this.getHeroKDARatio(this.getDisplayedHero());
	}
	getDisplayedHeroDamage(){
		return this.getHeroDamage(this.getDisplayedHero());
	}
	getDisplayedHeroHealing(){
		return this.getHeroHealing(this.getDisplayedHero());
	}
	// ---------------------------------------------------FOR DROPDOWN MENU---------------------------------
	
	getHeroKills(heroName: string){
		return this.getStatPerTenMin(this.mapStats.get(this.activeMap).heroWinrates.get(heroName).kills,
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).timeplayed).toFixed(2);
	}
	getHeroDeaths(heroName: string){
		return this.getStatPerTenMin(this.mapStats.get(this.activeMap).heroWinrates.get(heroName).deaths,
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).timeplayed).toFixed(2);
	}
	getHeroAssists(heroName: string){
		return this.getStatPerTenMin(this.mapStats.get(this.activeMap).heroWinrates.get(heroName).assists,
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).timeplayed).toFixed(2);
	}
	getHeroKDARatio(heroName: string){
		return ((this.mapStats.get(this.activeMap).heroWinrates.get(heroName).kills +
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).assists)/
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).deaths).toFixed(2);
	}
	getHeroDamage(heroName: string){
		return this.getStatPerTenMin(this.mapStats.get(this.activeMap).heroWinrates.get(heroName).damage,
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).timeplayed).toFixed(2);
	}
	getHeroHealing(heroName: string){
		return this.getStatPerTenMin(this.mapStats.get(this.activeMap).heroWinrates.get(heroName).healing,
			this.mapStats.get(this.activeMap).heroWinrates.get(heroName).timeplayed).toFixed(2);
	}
	
	getStatPerTenMin(stat: number, timeplayed: number){
		return stat/(timeplayed/60/10);
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
            str = 'D.Va';
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
	
	kills: number = 0;
	deaths: number = 0;
	assists: number = 0;
	
	damage: number = 0;
	healing: number = 0;
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