export interface Hitter {
    Player:string;
    Likely:number;
    Confidence:number;
    Power:number;
    Contact:number;
    Pitcher:number;
    Team:number;
    Bullpen:number;
    Weather:number;
    Park:number;
    Recent:number;
    Matchup:number;
    ["Test Score"]:number;
    ["Zone Fit"]:number;
    Ceiling:number;
    ["HR Form"]:number;
    kHR:number;
    ISO:number;
    ["HH%"]:number;
    ["FB%"]:number;
    ["Brl/BIP%"]:number;
}

export interface Game {
    game:string;
    away_team:string;
    home_team:string;
    venue:string;
    weather:any;
    hitters:{
        away:Hitter[];
        home:Hitter[];
    };
}