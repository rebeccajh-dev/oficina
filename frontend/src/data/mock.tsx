import type { User } from '../interface/UserInterface'
import type { Interaction } from '../interface/InteractionInterface'
import type { Player } from '../interface/PlayerInterface'


export const USERS: User[] = [
  { id: 1, name: 'João Silva',     club: 'Arsenal FC',      role: 'Diretor de Scouting', hasHistory: true,  initials: 'JS' },
  { id: 2, name: 'María García',   club: 'FC Barcelona',    role: 'Analista de Desempenho', hasHistory: true,  initials: 'MG' },
  { id: 3, name: 'Pierre Dubois',  club: 'Paris SG',        role: 'Scout Sênior',        hasHistory: true,  initials: 'PD' },
  { id: 4, name: 'Hans Müller',    club: 'Bayern München',  role: 'Chefe de Recrutamento', hasHistory: false, initials: 'HM' },
  { id: 5, name: 'Linh Nguyen',    club: 'Ajax',            role: 'Analista Tático',     hasHistory: false, initials: 'LN' },
]

export const HISTORY: Record<number, Interaction[]> = {
  1: [
    { id:1, player:'Florian Wirtz',    position:'Meia',     positionKey:'meia',     type:'avaliou',     note:5, date:'22/09/2026', club:'Bayer Leverkusen' },
    { id:2, player:'Leny Yoro',        position:'Zagueiro', positionKey:'zagueiro', type:'favoritou',            date:'20/09/2026', club:'Manchester United' },
    { id:3, player:'Rayan Cherki',     position:'Meia',     positionKey:'meia',     type:'avaliou',     note:4, date:'18/09/2026', club:'Liverpool FC' },
    { id:4, player:'Castello Lukeba',  position:'Zagueiro', positionKey:'zagueiro', type:'visualizou',           date:'15/09/2026', club:'RB Leipzig' },
    { id:5, player:'Warren Z-Emery',   position:'Volante',  positionKey:'volante',  type:'avaliou',     note:4, date:'12/09/2026', club:'Paris SG' },
    { id:6, player:'Evan Ferguson',    position:'Atacante', positionKey:'atacante', type:'visualizou',           date:'10/09/2026', club:'Brighton' },
    { id:7, player:'Jorrel Hato',      position:'Lateral',  positionKey:'lateral',  type:'avaliou',     note:3, date:'07/09/2026', club:'Ajax' },
    { id:8, player:'Lamine Yamal',     position:'Atacante', positionKey:'atacante', type:'favoritou',            date:'04/09/2026', club:'FC Barcelona' },
  ],
  2: [
    { id:1, player:'Pedri',            position:'Meia',     positionKey:'meia',     type:'avaliou',     note:5, date:'21/09/2026', club:'FC Barcelona' },
    { id:2, player:'Gavi',             position:'Volante',  positionKey:'volante',  type:'favoritou',            date:'19/09/2026', club:'FC Barcelona' },
    { id:3, player:'Benjamin Šeško',   position:'Atacante', positionKey:'atacante', type:'avaliou',     note:4, date:'16/09/2026', club:'Arsenal FC' },
    { id:4, player:'Kobbie Mainoo',    position:'Volante',  positionKey:'volante',  type:'visualizou',           date:'13/09/2026', club:'Manchester United' },
    { id:5, player:'Mike Maignan',     position:'Goleiro',  positionKey:'goleiro',  type:'avaliou',     note:5, date:'09/09/2026', club:'AC Milan' },
  ],
  3: [
    { id:1, player:'Kylian Mbappé',    position:'Atacante', positionKey:'atacante', type:'avaliou',     note:5, date:'23/09/2026', club:'Real Madrid' },
    { id:2, player:'Willian Pacho',    position:'Zagueiro', positionKey:'zagueiro', type:'avaliou',     note:4, date:'18/09/2026', club:'Paris SG' },
    { id:3, player:'Sávio',            position:'Atacante', positionKey:'atacante', type:'favoritou',            date:'14/09/2026', club:'Manchester City' },
    { id:4, player:'Máximo Perrone',   position:'Volante',  positionKey:'volante',  type:'visualizou',           date:'11/09/2026', club:'Valencia CF' },
  ],
}

export const RECOMMENDATIONS: Record<string, Player[]> = {  //popular isso com o dataset do back
  goleiro: [
    { id:1, name:'Bart Verbruggen',       initials:'BV', position:'Goleiro',  positionKey:'goleiro',  club:'Brighton',        affinity:91 },
    { id:2, name:'Giorgi Mamardashvili',  initials:'GM', position:'Goleiro',  positionKey:'goleiro',  club:'Liverpool FC',    affinity:86 },
    { id:3, name:'Andriy Lunin',          initials:'AL', position:'Goleiro',  positionKey:'goleiro',  club:'Real Madrid',     affinity:79 },
  ],
  zagueiro: [
    { id:4, name:'Leny Yoro',             initials:'LY', position:'Zagueiro', positionKey:'zagueiro', club:'Manchester Utd',  affinity:94 },
    { id:5, name:'Castello Lukeba',       initials:'CL', position:'Zagueiro', positionKey:'zagueiro', club:'RB Leipzig',      affinity:88 },
    { id:6, name:'Neraysho Kasanwirjo',   initials:'NK', position:'Zagueiro', positionKey:'zagueiro', club:'Inter Milan',     affinity:82 },
    { id:7, name:'Willian Pacho',         initials:'WP', position:'Zagueiro', positionKey:'zagueiro', club:'Paris SG',        affinity:76 },
  ],
  lateral: [
    { id:8, name:'Jorrel Hato',           initials:'JH', position:'Lateral',  positionKey:'lateral',  club:'Ajax',            affinity:89 },
    { id:9, name:'Alejandro Balde',       initials:'AB', position:'Lateral',  positionKey:'lateral',  club:'FC Barcelona',    affinity:84 },
    { id:10,name:'Destiny Udogie',        initials:'DU', position:'Lateral',  positionKey:'lateral',  club:'Tottenham',       affinity:78 },
  ],
  volante: [
    { id:11,name:'Warren Zaïre-Emery',    initials:'WZ', position:'Volante',  positionKey:'volante',  club:'Paris SG',        affinity:93 },
    { id:12,name:'Kobbie Mainoo',         initials:'KM', position:'Volante',  positionKey:'volante',  club:'Manchester Utd',  affinity:90 },
    { id:13,name:'Máximo Perrone',        initials:'MP', position:'Volante',  positionKey:'volante',  club:'Valencia CF',     affinity:84 },
    { id:14,name:'Camavinga',             initials:'CA', position:'Volante',  positionKey:'volante',  club:'Real Madrid',     affinity:80 },
    { id:15,name:'Khéphren Thuram',       initials:'KT', position:'Volante',  positionKey:'volante',  club:'Juventus',        affinity:74 },
  ],
  meia: [
    { id:16,name:'Florian Wirtz',         initials:'FW', position:'Meia',     positionKey:'meia',     club:'Bayer Leverkusen',affinity:97 },
    { id:17,name:'Rayan Cherki',          initials:'RC', position:'Meia',     positionKey:'meia',     club:'Liverpool FC',    affinity:91 },
    { id:18,name:'Pedri',                 initials:'PE', position:'Meia',     positionKey:'meia',     club:'FC Barcelona',    affinity:88 },
    { id:19,name:'Xavi Simons',           initials:'XS', position:'Meia',     positionKey:'meia',     club:'PSG / Leipzig',   affinity:83 },
  ],
  atacante: [
    { id:20,name:'Lamine Yamal',          initials:'LY', position:'Atacante', positionKey:'atacante', club:'FC Barcelona',    affinity:96 },
    { id:21,name:'Benjamin Šeško',        initials:'BŠ', position:'Atacante', positionKey:'atacante', club:'Arsenal FC',      affinity:89 },
    { id:22,name:'Evan Ferguson',         initials:'EF', position:'Atacante', positionKey:'atacante', club:'Brighton',        affinity:85 },
    { id:23,name:'Sávio',                 initials:'SÁ', position:'Atacante', positionKey:'atacante', club:'Manchester City', affinity:79 },
    { id:24,name:'Endrick',               initials:'EN', position:'Atacante', positionKey:'atacante', club:'Real Madrid',     affinity:73 },
  ],
}

export const POPULAR_PLAYERS: Player[] = [
  { id:16,name:'Florian Wirtz',         initials:'FW', position:'Meia',     positionKey:'meia',     club:'Bayer Leverkusen',affinity:97, popular:true },
  { id:1, name:'Bart Verbruggen',       initials:'BV', position:'Goleiro',  positionKey:'goleiro',  club:'Brighton',        affinity:91, popular:true },
  { id:20,name:'Lamine Yamal',          initials:'LY', position:'Atacante', positionKey:'atacante', club:'FC Barcelona',    affinity:96, popular:true },
  { id:11,name:'Warren Zaïre-Emery',    initials:'WZ', position:'Volante',  positionKey:'volante',  club:'Paris SG',        affinity:93, popular:true },
  { id:4, name:'Leny Yoro',             initials:'LY', position:'Zagueiro', positionKey:'zagueiro', club:'Manchester Utd',  affinity:94, popular:true },
]

export const METRICS = [
  { user:'João Silva',    club:'Arsenal FC',     interactions:8,  relevant:6, hits:5, precision:1.00, recall:0.83 },
  { user:'María García',  club:'FC Barcelona',   interactions:5,  relevant:4, hits:4, precision:0.80, recall:1.00 },
  { user:'Pierre Dubois', club:'Paris SG',       interactions:4,  relevant:3, hits:2, precision:0.40, recall:0.67 },
  { user:'Hans Müller',   club:'Bayern München', interactions:0,  relevant:0, hits:0, precision:0.00, recall:0.00 },
  { user:'Linh Nguyen',   club:'Ajax',           interactions:0,  relevant:0, hits:0, precision:0.00, recall:0.00 },
]

export const POSITIONS = ['Todos','Goleiro','Zagueiro','Lateral','Volante','Meia','Atacante']
export const POSITION_KEYS: Record<string,string> = {
  'Todos':'todos','Goleiro':'goleiro','Zagueiro':'zagueiro','Lateral':'lateral',
  'Volante':'volante','Meia':'meia','Atacante':'atacante',
}
export const INTERACTION_TYPES = ['Todos','visualizou','avaliou','favoritou']

