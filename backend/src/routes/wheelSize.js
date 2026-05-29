const express = require('express');
const router = express.Router();
const axios = require('axios');

const WHEEL_SIZE_KEY = process.env.WHEEL_SIZE_KEY || '3c20bfc74ecd98718e60dfbc5648e757';
const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const REGION = 'ladm';

// ─── MAPEAMENTO DE MARCAS ─────────────────────────────────────────────────────
const MARCA_MAP = {
  'AUDI': 'audi', 'BMW': 'bmw', 'BYD': 'byd',
  'CHEVROLET': 'chevrolet', 'GM - CHEVROLET': 'chevrolet',
  'CITROËN': 'citroen', 'CITROEN': 'citroen',
  'DODGE': 'dodge', 'FIAT': 'fiat', 'FORD': 'ford',
  'HONDA': 'honda', 'HYUNDAI': 'hyundai', 'JEEP': 'jeep',
  'KIA': 'kia', 'KIA MOTORS': 'kia',
  'LAND ROVER': 'land-rover',
  'MERCEDES-BENZ': 'mercedes-benz', 'MERCEDES BENZ': 'mercedes-benz',
  'MITSUBISHI': 'mitsubishi', 'NISSAN': 'nissan',
  'PEUGEOT': 'peugeot', 'RAM': 'ram', 'RENAULT': 'renault',
  'SUBARU': 'subaru', 'SUZUKI': 'suzuki', 'TOYOTA': 'toyota',
  'VW - VOLKSWAGEN': 'volkswagen', 'VOLKSWAGEN': 'volkswagen', 'VW': 'volkswagen',
  'GWM': 'haval', 'HAVAL': 'haval',
  'CAOA CHERY': 'chery', 'CHERY': 'chery',
  'VOLVO': 'volvo', 'JAGUAR': 'jaguar', 'PORSCHE': 'porsche',
  'MINI': 'mini', 'LEXUS': 'lexus', 'INFINITI': 'infiniti',
  'MASERATI': 'maserati', 'ALFA ROMEO': 'alfa-romeo',
};

// ─── MAPEAMENTO DE MODELOS BMW ────────────────────────────────────────────────
const BMW_MODELO_MAP = {
  '116I': '1-series', '116IA': '1-series', '118I': '1-series', '118IA': '1-series',
  '120I': '1-series', '120IA': '1-series', '125I': '1-series', '128I': '1-series',
  '130I': '1-series', '130IA': '1-series', '135I': '1-series', '135IA': '1-series', 'M140I': '1-series',
  '218I': '2-series', '220I': '2-series', '225I': '2-series', '228I': '2-series',
  '230I': '2-series', 'M235I': '2-series', 'M240I': '2-series',
  '316': '3-series', '316I': '3-series', '318I': '3-series', '318IA': '3-series',
  '318IS': '3-series', '318TI': '3-series', '320I': '3-series', '320IA': '3-series',
  '323I': '3-series', '323IA': '3-series', '323CI': '3-series',
  '325I': '3-series', '325IA': '3-series', '325CI': '3-series',
  '328I': '3-series', '328IA': '3-series', '328CI': '3-series',
  '330I': '3-series', '330IA': '3-series', '330CI': '3-series',
  '335I': '3-series', '335IA': '3-series', '340I': '3-series', 'M3': 'm3', 'M340I': '3-series',
  '420I': '4-series', '428I': '4-series', '430I': '4-series',
  '435I': '4-series', '435IA': '4-series', '440I': '4-series', 'M4': 'm4', 'M440I': '4-series',
  '520I': '5-series', '523I': '5-series', '525I': '5-series', '528I': '5-series',
  '530I': '5-series', '535I': '5-series', '540I': '5-series',
  '545I': '5-series', '545IA': '5-series', '550I': '5-series', '550IA': '5-series',
  'M5': 'm5', 'M550I': '5-series',
  '630I': '6-series', '640I': '6-series', '645CI': '6-series', '645IA': '6-series',
  '650CI': '6-series', '650I': '6-series', '650IA': '6-series', 'M6': 'm6',
  '730I': '7-series', '730IA': '7-series', '735I': '7-series',
  '740I': '7-series', '740IA': '7-series', '740IL': '7-series', '740ILA': '7-series',
  '745I': '7-series', '745IA': '7-series', '745LE': '7-series',
  '750I': '7-series', '750IA': '7-series', '750IL': '7-series', '750ILA': '7-series',
  '760IL': '7-series', 'M760LI': '7-series',
  '840CI': '8-series', '840CIA': '8-series', '850CI': '8-series',
  '850CSI': '8-series', '850I': '8-series', 'M8': 'm8', 'M850I': '8-series',
  'X1': 'x1', 'X2': 'x2', 'X3': 'x3', 'X4': 'x4', 'X5': 'x5', 'X6': 'x6', 'X7': 'x7',
  'Z3': 'z3', 'Z4': 'z4', 'Z8': 'z8',
  'I3': 'i3', 'I4': 'i4', 'I5': 'i5', 'I7': 'i7', 'I8': 'i8',
  'IX': 'ix', 'IX1': 'ix1', 'IX2': 'ix2', 'IX3': 'ix3',
  'M1': 'm1', 'M2': 'm2',
};

// ─── MAPEAMENTO DE MODELOS GWM/HAVAL ─────────────────────────────────────────
const GWM_MODELO_MAP = {
  'H6': 'h6', 'HAVAL H6': 'h6', 'H5': 'h5', 'HAVAL H5': 'h5',
  'H9': 'h9', 'HAVAL H9': 'h9', 'JOLION': 'jolion', 'HAVAL JOLION': 'jolion',
  'DARGO': 'dargo', 'HAVAL DARGO': 'dargo', 'H6 GT': 'h6gt', 'HAVAL H6 GT': 'h6gt',
  'HAVAL': 'h6',
};

// ─── MAPEAMENTO DE MODELOS ESPECIAIS ─────────────────────────────────────────
const MODELO_ESPECIAL_MAP = {
  'FIAT': {
    '500': '500', '500E': '500e', 'ARGO': 'argo', 'BRAVO': 'bravo',
    'CRONOS': 'cronos', 'DOBLO': 'doblo', 'DUCATO': 'ducato',
    'DUCATO-8': 'ducato', 'DUCATO-10': 'ducato', 'DUCATO-15': 'ducato',
    'E-SCUDO': 'scudo', 'FASTBACK': 'fastback', 'FIORINO': 'fiorino',
    'FREEMONT': 'freemont', 'GRAND': 'grand-siena', 'GRAND SIENA': 'grand-siena',
    'IDEA': 'idea', 'LINEA': 'linea', 'MAREA': 'marea', 'MOBI': 'mobi',
    'PALIO': 'palio', 'PALIO ADVENTURE': 'palio-adventure', 'PALIO WEEKEND': 'palio-weekend',
    'PULSE': 'pulse', 'PULSE ABARTH': 'pulse-abarth', 'PUNTO': 'punto',
    'SCUDO': 'scudo', 'SIENA': 'siena', 'SIENA EL': 'siena-el', 'STILO': 'stilo',
    'STRADA': 'strada', 'TITANO': 'titano', 'TORO': 'toro', 'UNO': 'uno',
    '600': '600', '600E': '600e', 'MILLE': 'mille',
  },
  'CHEVROLET': {
    'AGILE': 'agile', 'ASTRA': 'astra', 'BLAZER': 'blazer', 'BLAZER EV': 'blazer-ev',
    'BOLT': 'bolt', 'BOLT EV': 'bolt', 'BOLT EUV': 'bolt-euv', 'CAMARO': 'camaro',
    'CAPTIVA': 'captiva', 'CAPTIVA SPORT': 'captiva-sport', 'CELTA': 'celta',
    'CLASSIC': 'classic', 'COBALT': 'cobalt', 'CORSA': 'corsa', 'CORSA CLASSIC': 'corsa-classic',
    'CRUZE': 'cruze', 'CRUZE RS': 'cruze-rs', 'EQUINOX': 'equinox', 'EQUINOX EV': 'equinox-ev',
    'JOY': 'joy', 'JOY PLUS': 'joy-plus', 'KADETT': 'kadett', 'MERIVA': 'meriva',
    'MONTANA': 'montana', 'MONZA': 'monza', 'OMEGA': 'omega',
    'ONIX': 'onix', 'ONIX ACTIV': 'onix-activ', 'ONIX JOY': 'onix-joy', 'ONIX PLUS': 'onix-plus',
    'PRISMA': 'prisma', 'PRISMA JOY': 'prisma-joy', 'S10': 's10',
    'SILVERADO': 'silverado', 'SONIC': 'sonic', 'SPARK': 'spark',
    'SPARK GT': 'spark-gt', 'SPARK LIFE': 'spark-life',
    'SPIN': 'spin', 'SPIN ACTIV': 'spin-activ', 'SUBURBAN': 'suburban',
    'TAHOE': 'tahoe', 'TIGRA': 'tigra', 'TRACKER': 'tracker',
    'TRAILBLAZER': 'trailblazer', 'TRAVERSE': 'traverse', 'VECTRA': 'vectra', 'ZAFIRA': 'zafira',
    'AVEO': 'aveo', 'AVEO FAMILY': 'aveo-family', 'COLORADO': 'colorado',
    'D-MAX': 'd-max', 'GROOVE': 'groove', 'ORLANDO': 'orlando', 'VIVANT': 'vivant',
  },
  'VW - VOLKSWAGEN': {
    'AMAROK': 'amarok', 'ATLAS': 'atlas', 'BORA': 'bora',
    'CROSSFOX': 'crossfox', 'FOX': 'fox', 'FUSCA': 'fusca',
    'GOL': 'gol', 'NOVO GOL': 'gol', 'NOVO': 'gol',
    'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'NIVUS': 'nivus', 'PARATI': 'parati', 'PASSAT': null,
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox', 'SURAN': 'suran',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TERAMONT': 'teramont',
    'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'UP': 'up', 'UP!': 'up',
    'VENTO': 'vento', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },
  'VOLKSWAGEN': {
    'AMAROK': 'amarok', 'ATLAS': 'atlas', 'BORA': 'bora',
    'CROSSFOX': 'crossfox', 'FOX': 'fox', 'FUSCA': 'fusca',
    'GOL': 'gol', 'NOVO GOL': 'gol', 'NOVO': 'gol',
    'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'NIVUS': 'nivus', 'PARATI': 'parati', 'PASSAT': null,
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox', 'SURAN': 'suran',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TERAMONT': 'teramont',
    'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'UP': 'up', 'UP!': 'up',
    'VENTO': 'vento', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },
  'HONDA': {
    'ACCORD': 'accord', 'CITY': 'city', 'CIVIC': 'civic', 'CIVIC TYPE R': 'civic-type-r',
    'CR-V': 'cr-v', 'CRV': 'cr-v', 'FIT': 'fit',
    'HR-V': 'hr-v', 'HRV': 'hr-v', 'HR V': 'hr-v',
    'ODYSSEY': 'odyssey', 'PASSPORT': null, 'PILOT': 'pilot',
    'RIDGELINE': 'ridgeline', 'WR-V': 'wr-v', 'WRV': 'wr-v', 'ZR-V': 'zr-v', 'ZRV': 'zr-v',
  },
  'TOYOTA': {
    'CAMRY': 'camry', 'C-HR': 'c-hr', 'CHR': 'c-hr',
    'COROLLA': 'corolla', 'COROLLA ALTIS': 'corolla-altis', 'COROLLA CROSS': 'corolla-cross',
    'ETIOS': 'etios', 'ETIOS CROSS': 'etios-cross', 'FORTUNER': 'fortuner',
    'HIACE': 'hiace', 'HILUX': 'hilux', 'HILUX STOUT': 'hilux-stout',
    'LAND CRUISER': 'land-cruiser', 'LAND CRUISER PRADO': 'land-cruiser-prado',
    'PRIUS': 'prius', 'RAV4': 'rav4', 'RAV 4': 'rav4', 'RAV-4': 'rav4',
    'SW4': 'sw4', 'YARIS': 'yaris', 'YARIS CROSS': 'yaris-cross',
    '4RUNNER': '4runner', 'AGYA': 'agya', 'AVANZA': 'avanza',
    'FJ CRUISER': 'fj-cruiser', 'RAIZE': 'raize', 'RUSH': 'rush', 'TUNDRA': 'tundra',
  },
  'HYUNDAI': {
    'ACCENT': 'accent', 'AZERA': 'azera', 'CRETA': 'creta', 'CRETA GRAND': 'creta-grand',
    'ELANTRA': 'elantra', 'GRAND': 'grand-i10', 'GRAND I10': 'grand-i10',
    'H1': 'h1', 'H-1': 'h1', 'H100': 'h-100', 'H-100': 'h-100',
    'HB20': 'hb20', 'HB20S': 'hb20s', 'HB20X': 'hb20x', 'HR': 'hr',
    'I20': 'i20', 'I25': 'i25', 'I45': 'i45',
    'IONIQ': 'ioniq', 'IONIQ 5': 'ioniq-5',
    'IX35': 'tucson', 'KONA': 'kona', 'PALISADE': 'palisade', 'PORTER': 'porter',
    'SANTA': 'santa-fe', 'SANTA FE': 'santa-fe',
    'SONATA': 'sonata-hybrid', 'SONATA HYBRID': 'sonata-hybrid',
    'STARIA': 'staria', 'H350': 'h350', 'MIGHTY': 'mighty',
    'TUCSON': 'tucson', 'VELOSTER': 'veloster', 'VELOSTER N': 'veloster-n', 'VENUE': 'venue',
  },
  'JEEP': {
    'AVENGER': 'avenger', 'CHEROKEE': null,
    'COMMANDER': 'commander', 'COMPASS': 'compass', 'GLADIATOR': 'gladiator',
    'GRAND': 'grand-cherokee', 'GRAND CHEROKEE': 'grand-cherokee',
    'RENEGADE': 'renegade', 'WRANGLER': 'wrangler',
  },
  'NISSAN': {
    'ALTIMA': 'altima', 'FRONTIER': 'frontier', 'GT-R': 'gt-r', 'GTR': 'gt-r',
    'KAIT': 'kait', 'KICKS': 'kicks', 'KICKS PLAY': 'kicks-play',
    'LEAF': 'leaf', 'MARCH': 'march', 'MURANO': 'murano',
    'NAVARA': 'navara', 'PATHFINDER': 'pathfinder', 'PATROL': 'patrol',
    'QASHQAI': 'qashqai', 'SENTRA': 'sentra', 'TIIDA': 'tiida',
    'VERSA': 'versa', 'X-TRAIL': 'x-trail', 'XTRAIL': 'x-trail', 'X TRAIL': 'x-trail',
  },
  'FORD': {
    'BRONCO': 'bronco', 'BRONCO SPORT': 'bronco-sport', 'COURIER': 'courier',
    'ECOSPORT': 'ecosport', 'EDGE': 'edge', 'EXPLORER': 'explorer',
    'F-150': 'f-150', 'F-250': 'f-250', 'FIESTA': 'fiesta', 'FOCUS': 'focus',
    'FUSION': 'fusion', 'KA': 'ka', 'KA PLUS': 'ka-plus', 'KA FREESTYLE': 'ka-freestyle',
    'KUGA': 'kuga', 'MAVERICK': 'maverick', 'MUSTANG': 'mustang',
    'MUSTANG MACH-E': 'mustang-mach-e', 'RANGER': 'ranger',
    'TERRITORY': 'territory', 'TRANSIT': 'transit', 'TRANSIT CUSTOM': 'transit-custom',
  },
  'RENAULT': {
    'ALASKAN': 'alaskan', 'BOREAL': 'boreal', 'CAPTUR': 'captur',
    'DUSTER': 'duster', 'DUSTER OROCH': 'duster-oroch',
    'KANGOO': 'kangoo', 'KANGOO EXPRESS': 'kangoo-express',
    'KANGOO STEPWAY': 'kangoo-stepway', 'KANGOO VAN': 'kangoo-van',
    'KARDIAN': 'kardian', 'KOLEOS': 'koleos', 'KWID': 'kwid',
    'LOGAN': 'logan', 'MASTER': 'master', 'MEGANE E-TECH': 'megane-e-tech',
    'OROCH': 'oroch', 'SANDERO': 'sandero', 'SANDERO STEPWAY': 'sandero-stepway',
    'STEPWAY': 'stepway', 'SYMBOL': 'symbol', 'TRAFIC': 'trafic', 'ZOE': 'zoe',
  },
  'MITSUBISHI': {
    'ASX': 'asx', 'ECLIPSE CROSS': 'eclipse-cross', 'GALANT': 'galant',
    'L200': 'l200', 'L 200': 'l200', 'LANCER': 'lancer', 'OUTLANDER': 'outlander',
    'PAJERO': 'pajero', 'PAJERO FULL': 'pajero-full', 'PAJERO SPORT': 'pajero-sport',
  },
  'RAM': {
    'RAMPAGE': 'rampage', '1000': '1000', '1500': '1500', '1500 TRX': '1500-trx',
    '2500': '2500', '3500': '3500', '700': '700',
    'DAKOTA': 'dakota', 'V1000': 'v1000',
    'V700 CITY': 'v700-city', 'V700 RAPID': 'v700-rapid',
  },
  'LAND ROVER': {
    'DEFENDER': 'defender', 'DISCOVERY': 'discovery', 'DISCOVERY SPORT': 'discovery-sport',
    'FREELANDER': 'freelander', 'RANGE ROVER': 'range-rover',
    'RANGE ROVER EVOQUE': 'range-rover-evoque', 'RANGE ROVER SPORT': 'range-rover-sport',
    'RANGE ROVER VELAR': 'range-rover-velar',
  },
  'MERCEDES-BENZ': {
    'A': 'a-class', 'A200': 'a-class', 'A250': 'a-class',
    'B': 'b-class', 'B200': 'b-class',
    'C': 'c-class', 'C180': 'c-class', 'C200': 'c-class', 'C250': 'c-class', 'C300': 'c-class',
    'CLA': 'cla', 'CLA200': 'cla', 'CLA250': 'cla', 'CLS': 'cls',
    'E': 'e-class', 'E200': 'e-class', 'E250': 'e-class', 'E300': 'e-class', 'E350': 'e-class',
    'EQC': 'eqc', 'EQS': 'eqs', 'G': 'g-class', 'G63': 'g-class',
    'GLA': 'gla', 'GLB': 'glb', 'GLC': 'glc', 'GLE': 'gle', 'GLS': 'gls',
    'ML': 'ml-class', 'S': 's-class', 'S400': 's-class', 'S500': 's-class', 'AMG GT': 'amg-gt',
  },
  'KIA': {
    'CADENZA': 'cadenza', 'CARNIVAL': 'carnival', 'CERATO': 'cerato', 'EV6': 'ev6',
    'NIRO': 'niro', 'OPTIMA': 'optima', 'PICANTO': 'picanto', 'RIO': 'rio',
    'SELTOS': 'seltos', 'SORENTO': 'sorento', 'SOUL': 'soul',
    'SPORTAGE': 'sportage', 'STINGER': 'stinger', 'TELLURIDE': 'telluride',
  },
  'PEUGEOT': {
    '206': '206', '207': '207', '208': '208', '307': '307', '308': '308',
    '408': '408', '508': '508', '2008': '2008', '3008': '3008', '5008': '5008',
    'BOXER': 'boxer', 'EXPERT': 'expert', 'PARTNER': 'partner',
  },
  'SUBARU': {
    'BRZ': 'brz', 'CROSSTREK': 'crosstrek', 'FORESTER': 'forester',
    'IMPREZA': 'impreza', 'LEGACY': 'legacy', 'OUTBACK': 'outback', 'WRX': 'wrx', 'XV': 'xv',
  },
  'SUZUKI': {
    'BALENO': 'baleno', 'GRAND VITARA': 'grand-vitara', 'IGNIS': 'ignis',
    'JIMNY': 'jimny', 'S-CROSS': 's-cross', 'SWIFT': 'swift', 'VITARA': 'vitara',
  },

  // ── BYD ──────────────────────────────────────────────────────────────────
  'BYD': {
    'ATTO': null,
    'D1': 'd1',
    'DOLPHIN': 'dolphin',
    'DOLPHIN MINI': 'dolphin-mini',
    'DOLPHIN PLUS': 'dolphin-plus',
    'ET3': null,
    'HAN': 'han',
    'KING': 'king',
    'SEAL': 'seal',
    'SHARK': 'shark',
    'SONG': 'song-plus',
    'SONG PLUS': 'song-plus',
    'SONG PRO': 'song-pro',
    'TAN': 'tan',
    'TANG': 'tang',
    'YUAN': 'yuan-plus',
    'YUAN PLUS': 'yuan-plus',
    'YUAN PRO': 'yuan-pro',
  },
};

// ─── PRIORIDADE POR VERSÃO ────────────────────────────────────────────────────
// Mesma lógica do totemController — garante medida correta por trim level
const PRIORIDADE_VERSAO = {
  's10':       { 'HC': '265/60R18', 'LTZ': '265/60R18' },
  'renegade':  { 'LONGITUDE': '225/55R18', 'LONG': '225/55R18' },
  'compass':   { 'LONGITUDE': '225/55R18', 'LONG': '225/55R18', 'S': '235/50R18' },
  'commander': { 'OVERLAND': '225/55R18', 'LIMITED': '225/55R18' },
  'hilux':     { 'SRX': '265/60R18' },
  'sw4':       { 'SRX': '265/60R18' },
};

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────
function normalizarModelo(modelo) {
  return (modelo || '').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  // Captura formato normal "205/65R17" e com espaço "205/65 R17"
  const match = tireFull.match(/^(\d+\/\d+\s*[A-Z]\d+)/);
  if (match) return match[1].replace(' ', '');
  return tireFull.split(' ')[0];
}

function resolverModeloSlug(marcaSlug, marcaNome, modelo) {
  const modeloUpper = (modelo || '').trim().toUpperCase();
  const marcaUpper = (marcaNome || '').trim().toUpperCase();
  if (marcaSlug === 'bmw') return BMW_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  if (marcaSlug === 'haval') return GWM_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  if (MODELO_ESPECIAL_MAP[marcaUpper] && MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper] !== undefined) {
    return MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper];
  }
  return normalizarModelo(modelo);
}

// ─── POST /api/wheel-size/buscar ──────────────────────────────────────────────
router.post('/buscar', async (req, res) => {
  try {
    const { marca, modelo, ano, versao } = req.body;
    if (!marca || !modelo || !ano) {
      return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });
    }

    const marcaSlug = MARCA_MAP[marca.trim().toUpperCase()];
    if (!marcaSlug) return res.status(404).json({ erro: `Marca "${marca}" não mapeada`, pneus: [] });

    const modeloSlug = resolverModeloSlug(marcaSlug, marca, modelo);
    if (!modeloSlug) return res.status(404).json({ erro: `Modelo "${modelo}" não existe na API wheel-size`, pneus: [] });

    console.log(`[WHEEL-SIZE ROUTE] Consultando: make=${marcaSlug} model=${modeloSlug} year=${ano} versao=${versao || 'null'}`);

    const response = await axios.get(WHEEL_SIZE_URL, {
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY },
      timeout: 10000
    });

    const data = response.data?.data || [];
    if (!data.length) return res.status(404).json({ erro: 'Veículo não encontrado na API', pneus: [] });

    const imagemCarro = data[0]?.generation?.bodies?.[0]?.image || null;

    const contagemOE = new Map();
    const contagemAlt = new Map();

    // Tenta match pela versão/trim level
    const versaoUpper = (versao || '').toUpperCase();
    let encontrouVersao = false;

    if (versaoUpper) {
      for (const item of data) {
        const trimUpper = (item.trim || '').toUpperCase();
        const levels = (item.trim_levels || []).map(l => l.toUpperCase());
        const palavrasVersao = versaoUpper.split(' ').filter(p => p.length > 1);
        const bate = levels.some(l => palavrasVersao.some(p => l.includes(p) || p.includes(l)))
          || palavrasVersao.some(p => trimUpper.includes(p));

        if (bate) {
          encontrouVersao = true;
          for (const wheel of (item.wheels || [])) {
            const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
            if (!medida) continue;
            const extra = {
              pressao_bar: wheel.front?.tire_pressure?.bar || null,
              pressao_psi: wheel.front?.tire_pressure?.psi || null,
              indice_velocidade: wheel.front?.speed_index || null,
            };
            if (wheel.is_stock) {
              const atual = contagemOE.get(medida) || { count: 0, ...extra };
              contagemOE.set(medida, { ...atual, count: atual.count + 1 });
            } else {
              const atual = contagemAlt.get(medida) || { count: 0, ...extra };
              contagemAlt.set(medida, { ...atual, count: atual.count + 1 });
            }
          }
        }
      }
    }

    // Fallback: pega todas as versões
    if (!encontrouVersao || contagemOE.size === 0) {
      for (const item of data) {
        for (const wheel of (item.wheels || [])) {
          const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
          if (!medida) continue;
          const extra = {
            pressao_bar: wheel.front?.tire_pressure?.bar || null,
            pressao_psi: wheel.front?.tire_pressure?.psi || null,
            indice_velocidade: wheel.front?.speed_index || null,
          };
          if (wheel.is_stock) {
            const atual = contagemOE.get(medida) || { count: 0, ...extra };
            contagemOE.set(medida, { ...atual, count: atual.count + 1 });
          } else {
            const atual = contagemAlt.get(medida) || { count: 0, ...extra };
            contagemAlt.set(medida, { ...atual, count: atual.count + 1 });
          }
        }
      }
    }

    if (contagemOE.size === 0 && contagemAlt.size === 0) {
      return res.status(404).json({ erro: 'Nenhuma medida encontrada', pneus: [] });
    }

    const mapaOrdenado = contagemOE.size > 0 ? contagemOE : contagemAlt;
    let medidasOrdenadas = Array.from(mapaOrdenado.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 3);

    // ─── PRIORIDADE POR VERSÃO ────────────────────────────────────────────────
    if (versao) {
      const palavrasVersao = versaoUpper.split(/[\s\-\/\.]+/);
      const prioridades = PRIORIDADE_VERSAO[modeloSlug.toLowerCase()];
      if (prioridades) {
        for (const [palavra, medidaAlvo] of Object.entries(prioridades)) {
          if (palavrasVersao.includes(palavra.toUpperCase())) {
            console.log(`[WHEEL-SIZE ROUTE] Prioridade versão "${palavra}": ${medidaAlvo}`);
            const infoOE = contagemOE.get(medidaAlvo);
            const infoAlt = contagemAlt.get(medidaAlvo);
            const info = infoOE || infoAlt;
            if (info) {
              medidasOrdenadas = medidasOrdenadas.filter(([m]) => m !== medidaAlvo);
              medidasOrdenadas = [[medidaAlvo, info], ...medidasOrdenadas].slice(0, 3);
            }
            break;
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const pneus = medidasOrdenadas.map(([medida, info], i) => ({
      id: i + 1,
      medida,
      tipo: 'original',
      prioridade: i === 0 ? 1 : 2,
      observacao: 'Medida original de fábrica (OE)',
      fonte: 'wheel-size',
      pressao_bar: info.pressao_bar,
      pressao_psi: info.pressao_psi,
      indice_velocidade: info.indice_velocidade,
      imagem_carro: i === 0 ? imagemCarro : null,
    }));

    console.log(`[WHEEL-SIZE ROUTE] ${pneus.length} medidas para ${marcaSlug} ${modeloSlug} ${ano}`);
    return res.json({ encontrado: true, fonte: 'wheel-size', veiculo: { marca, modelo, ano, versao }, pneus });

  } catch (error) {
    console.error('[WHEEL-SIZE ROUTE] ERRO:', error.message);
    if (error.response?.status === 429) {
      return res.status(429).json({ erro: 'Limite da API wheel-size atingido. Tente novamente amanhã.' });
    }
    return res.status(500).json({ erro: 'Erro ao consultar API wheel-size' });
  }
});

module.exports = router;
