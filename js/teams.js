/* Football Math — teams.js: NFL teams, colors, stadiums, and rosters (QB, RB, 3 WRs, K).
   Plain script (no modules): shares globals with the other js/ files. Load order is set in index.html. */

/* =========================================================
   LEAGUE — city, name, colors (c1 main, c2 accent, h helmet), stadium.
   logo: '' shows a colored circle. For home use you can paste an
   image data: URI into logo.
   ========================================================= */
const TEAMS={
  ARI:{city:'Arizona',name:'Cardinals',c1:'#97233F',c2:'#FFB612',h:'#FFFFFF',stadium:'State Farm Stadium'},
  ATL:{city:'Atlanta',name:'Falcons',c1:'#A71930',c2:'#000000',h:'#101820',stadium:'Mercedes-Benz Stadium'},
  BAL:{city:'Baltimore',name:'Ravens',c1:'#241773',c2:'#9E7C0C',h:'#101820',stadium:'M&T Bank Stadium'},
  BUF:{city:'Buffalo',name:'Bills',c1:'#00338D',c2:'#C60C30',h:'#FFFFFF',stadium:'Highmark Stadium'},
  CAR:{city:'Carolina',name:'Panthers',c1:'#0085CA',c2:'#101820',h:'#A5ACAF',stadium:'Bank of America Stadium'},
  CHI:{city:'Chicago',name:'Bears',c1:'#0B162A',c2:'#C83803',stadium:'Soldier Field'},
  CIN:{city:'Cincinnati',name:'Bengals',c1:'#FB4F14',c2:'#000000',stadium:'Paycor Stadium'},
  CLE:{city:'Cleveland',name:'Browns',c1:'#311D00',c2:'#FF3C00',h:'#FF3C00',stadium:'Huntington Bank Field'},
  DAL:{city:'Dallas',name:'Cowboys',c1:'#003594',c2:'#869397',h:'#B0B7BC',stadium:'AT&T Stadium'},
  DEN:{city:'Denver',name:'Broncos',c1:'#FB4F14',c2:'#002244',h:'#002244',stadium:'Empower Field at Mile High'},
  DET:{city:'Detroit',name:'Lions',c1:'#0076B6',c2:'#B0B7BC',h:'#B0B7BC',stadium:'Ford Field'},
  GB:{city:'Green Bay',name:'Packers',c1:'#203731',c2:'#FFB612',h:'#FFB612',stadium:'Lambeau Field'},
  HOU:{city:'Houston',name:'Texans',c1:'#03202F',c2:'#A71930',stadium:'NRG Stadium'},
  IND:{city:'Indianapolis',name:'Colts',c1:'#002C5F',c2:'#A2AAAD',h:'#FFFFFF',stadium:'Lucas Oil Stadium'},
  JAX:{city:'Jacksonville',name:'Jaguars',c1:'#006778',c2:'#D7A22A',h:'#101820',stadium:'EverBank Stadium'},
  KC:{city:'Kansas City',name:'Chiefs',c1:'#E31837',c2:'#FFB81C',stadium:'Arrowhead Stadium'},
  LV:{city:'Las Vegas',name:'Raiders',c1:'#000000',c2:'#A5ACAF',h:'#A5ACAF',stadium:'Allegiant Stadium'},
  LAC:{city:'Los Angeles',name:'Chargers',c1:'#0080C6',c2:'#FFC20E',h:'#FFFFFF',stadium:'SoFi Stadium'},
  LAR:{city:'Los Angeles',name:'Rams',c1:'#003594',c2:'#FFA300',stadium:'SoFi Stadium'},
  MIA:{city:'Miami',name:'Dolphins',c1:'#008E97',c2:'#FC4C02',h:'#FFFFFF',stadium:'Hard Rock Stadium'},
  MIN:{city:'Minnesota',name:'Vikings',c1:'#4F2683',c2:'#FFC62F',stadium:'U.S. Bank Stadium'},
  NE:{city:'New England',name:'Patriots',c1:'#002244',c2:'#C60C30',h:'#B0B7BC',stadium:'Gillette Stadium'},
  NO:{city:'New Orleans',name:'Saints',c1:'#101820',c2:'#D3BC8D',h:'#D3BC8D',stadium:'Caesars Superdome'},
  NYG:{city:'New York',name:'Giants',c1:'#0B2265',c2:'#A71930',stadium:'MetLife Stadium'},
  NYJ:{city:'New York',name:'Jets',c1:'#125740',c2:'#FFFFFF',stadium:'MetLife Stadium'},
  PHI:{city:'Philadelphia',name:'Eagles',c1:'#004C54',c2:'#A5ACAD',stadium:'Lincoln Financial Field'},
  PIT:{city:'Pittsburgh',name:'Steelers',c1:'#101820',c2:'#FFB612',stadium:'Acrisure Stadium'},
  SF:{city:'San Francisco',name:'49ers',c1:'#AA0000',c2:'#B3995D',h:'#B3995D',stadium:"Levi's Stadium"},
  SEA:{city:'Seattle',name:'Seahawks',c1:'#002244',c2:'#69BE28',stadium:'Lumen Field'},
  TB:{city:'Tampa Bay',name:'Buccaneers',c1:'#D50A0A',c2:'#34302B',h:'#34302B',stadium:'Raymond James Stadium'},
  TEN:{city:'Tennessee',name:'Titans',c1:'#0C2340',c2:'#4B92DB',stadium:'Nissan Stadium'},
  WAS:{city:'Washington',name:'Commanders',c1:'#5A1414',c2:'#FFB612',stadium:'Northwest Stadium'},
};
Object.keys(TEAMS).forEach(k=>{TEAMS[k].abbr=k; TEAMS[k].logo=TEAMS[k].logo||''; TEAMS[k].h=TEAMS[k].h||TEAMS[k].c1;});

/* =========================================================
   ROSTERS — from current NFL depth charts (Ourlads, Nov 22 2026).
   QB, RB, three WRs, kicker: [jersey number, name]. Edit freely.
   ========================================================= */
const ROSTERS={
  BUF:{QB:[17,'Josh Allen'],RB:[4,'James Cook'],WR:[[0,'Keon Coleman'],[2,'DJ Moore'],[10,'Khalil Shakir']],K:[16,'Tyler Bass']},
  MIA:{QB:[14,'Kyle McCord'],RB:[0,'Ollie Gordon'],WR:[[18,'Chris Bell'],[7,'Caleb Douglas'],[6,'Malik Washington']],K:[38,'Daniel Carlson']},
  NE:{QB:[10,'Drake Maye'],RB:[38,'Rhamondre Stevenson'],WR:[[1,'A.J. Brown'],[13,'Mack Hollins'],[3,'DeMario Douglas']],K:[8,'Andy Borregales']},
  NYJ:{QB:[7,'Geno Smith'],RB:[20,'Breece Hall'],WR:[[5,'Garrett Wilson'],[15,'Adonai Mitchell'],[11,'Omar Cooper Jr.']],K:[19,'Jason Sanders']},
  BAL:{QB:[11,'Jacoby Brissett'],RB:[22,'Derrick Henry'],WR:[[4,'Zay Flowers'],[7,'Rashod Bateman'],[6,"Ja'Kobi Lane"]],K:[35,'Riley Patterson']},
  CIN:{QB:[9,'Joe Burrow'],RB:[30,'Chase Brown'],WR:[[1,"Ja'Marr Chase"],[5,'Tee Higgins'],[81,'Dohnte Meyers']],K:[2,'Evan McPherson']},
  CLE:{QB:[4,'Deshaun Watson'],RB:[10,'Quinshon Judkins'],WR:[[3,'Jerry Jeudy'],[12,'Denzel Boston'],[1,'KC Concepcion Jr.']],K:[25,'Andre Szmyt']},
  PIT:{QB:[8,'Aaron Rodgers'],RB:[30,'Jaylen Warren'],WR:[[4,'DK Metcalf'],[15,'Ben Skowronek'],[17,'Germie Bernard']],K:[9,'Chris Boswell']},
  HOU:{QB:[7,'C.J. Stroud'],RB:[32,'David Montgomery'],WR:[[12,'Nico Collins'],[14,'Kayshon Boutte'],[19,'Xavier Hutchinson']],K:[15,"Ka'imi Fairbairn"]},
  IND:{QB:[5,'Anthony Richardson'],RB:[28,'Jonathan Taylor'],WR:[[80,'Deion Burks'],[13,'Laquon Treadwell'],[6,'Anthony Gould']],K:[3,'Spencer Shrader']},
  JAX:{QB:[16,'Trevor Lawrence'],RB:[33,'Bhayshul Tuten'],WR:[[7,'Brian Thomas Jr.'],[3,'Jakobi Meyers'],[11,'Parker Washington']],K:[39,'Cam Little']},
  TEN:{QB:[1,'Cam Ward'],RB:[20,'Tony Pollard'],WR:[[14,'Carnell Tate'],[5,'Elic Ayomanor'],[17,'Chimere Dike']],K:[6,'Joey Slye']},
  DEN:{QB:[10,'Bo Nix'],RB:[20,'Jonah Coleman'],WR:[[14,'Courtland Sutton'],[17,'Jaylen Waddle'],[13,'Pat Bryant']],K:[3,'Wil Lutz']},
  KC:{QB:[15,'Patrick Mahomes'],RB:[9,'Kenneth Walker'],WR:[[4,'Rashee Rice'],[1,'Xavier Worthy'],[12,'Josh Downs']],K:[7,'Harrison Butker']},
  LV:{QB:[15,'Fernando Mendoza'],RB:[2,'Ashton Jeanty'],WR:[[1,'Tre Tucker'],[9,'Jalen Nailor'],[18,'Jack Bech']],K:[14,'Matt Gay']},
  LAC:{QB:[10,'Justin Herbert'],RB:[8,'Omarion Hampton'],WR:[[15,'Ladd McConkey'],[1,'Quentin Johnston'],[9,"Tre' Harris"]],K:[11,'Cameron Dicker']},
  DAL:{QB:[4,'Dak Prescott'],RB:[33,'Javonte Williams'],WR:[[88,'CeeDee Lamb'],[3,'George Pickens'],[19,'Ryan Flournoy']],K:[17,'Brandon Aubrey']},
  NYG:{QB:[18,'J.J. McCarthy'],RB:[44,'Cam Skattebo'],WR:[[1,'Malik Nabers'],[17,'Darnell Mooney'],[88,'Malachi Fields']],K:[34,'Dominic Zvada']},
  PHI:{QB:[14,'Joe Milton'],RB:[26,'Saquon Barkley'],WR:[[6,'DeVonta Smith'],[13,'Dontayvion Wicks'],[9,'Makai Lemon']],K:[4,'Jake Elliott']},
  WAS:{QB:[5,'Jayden Daniels'],RB:[1,'Rachaad White'],WR:[[14,'Antonio Williams'],[13,'Treylon Burks'],[3,'Stefon Diggs']],K:[19,'Drew Stevens']},
  CHI:{QB:[18,'Caleb Williams'],RB:[4,"D'Andre Swift"],WR:[[15,'Rome Odunze'],[10,'Luther Burden III'],[14,'Kalif Raymond']],K:[8,'Cairo Santos']},
  DET:{QB:[16,'Jared Goff'],RB:[0,'Jahmyr Gibbs'],WR:[[14,'Amon-Ra St. Brown'],[1,'Jameson Williams'],[18,'Isaac TeSlaa']],K:[39,'Jake Bates']},
  GB:{QB:[10,'Jordan Love'],RB:[8,'Josh Jacobs'],WR:[[0,'Matthew Golden'],[9,'Christian Watson'],[83,'Savion Williams']],K:[28,'Trey Smack']},
  MIN:{QB:[8,'Kirk Cousins'],RB:[27,'Jordan Mason'],WR:[[18,'Justin Jefferson'],[3,'Jordan Addison'],[14,'Jauan Jennings']],K:[16,'Will Reichard']},
  ATL:{QB:[9,'Michael Penix Jr.'],RB:[7,'Bijan Robinson'],WR:[[5,'Drake London'],[4,'Jahan Dotson'],[14,'Olamide Zaccheaus']],K:[39,'Jake Moody']},
  CAR:{QB:[9,'Bryce Young'],RB:[30,'Chuba Hubbard'],WR:[[4,'Tetairoa McMillan'],[17,'Xavier Legette'],[18,'Jalen Coker']],K:[10,'Ryan Fitzgerald']},
  NO:{QB:[6,'Tyler Shough'],RB:[3,'Travis Etienne Jr.'],WR:[[12,'Chris Olave'],[0,'Jordyn Tyson'],[14,'Devaughn Vele']],K:[39,'Charlie Smyth']},
  TB:{QB:[6,'Baker Mayfield'],RB:[7,'Bucky Irving'],WR:[[2,'Emeka Egbuka'],[14,'Chris Godwin Jr.'],[15,'Tez Johnson']],K:[4,'Chase McLaughlin']},
  ARI:{QB:[19,'Carson Beck'],RB:[22,'Tyler Allgeier'],WR:[[80,'Simi Fehoko'],[82,'Reggie Virgil'],[81,'Devin Duvernay']],K:[38,'Chad Ryland']},
  LAR:{QB:[9,'Matthew Stafford'],RB:[23,'Kyren Williams'],WR:[[8,'Tutu Atwell'],[6,'CJ Daniels'],[4,'Konata Mumpfield']],K:[19,'Brandon McManus']},
  SF:{QB:[13,'Brock Purdy'],RB:[23,'Christian McCaffrey'],WR:[[5,'Mike Evans'],[19,'Deebo Samuel Sr.'],[11,'DeMarcus Robinson']],K:[18,'Eddy Piñeiro']},
  SEA:{QB:[14,'Sam Darnold'],RB:[26,'Zach Charbonnet'],WR:[[11,'Jaxon Smith-Njigba'],[10,'Cooper Kupp'],[22,'Rashid Shaheed']],K:[5,'Jason Myers']},
};
const last=n=>{ const p=n.replace(/ (Jr\.|Sr\.|III|II|IV)$/,'').split(' '); return p.slice(1).join(' ')||n; };
const RS=k=>ROSTERS[k]||ROSTERS.DET;
