const axios = require('axios');
const db = require('../config/db');

const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const WHEEL_SIZE_MAKES_URL = 'https://api.wheel-size.com/v2/makes/';
const WHEEL_SIZE_MODELS_URL = 'https://api.wheel-size.com/v2/models/';
const WHEEL_SIZE_YEARS_URL = 'https://api.wheel-size.com/v2/years/';
const REGION = 'ladm';

function wheelSizeKey() {
  const key = process.env.WHEEL_SIZE_KEY;
  if (!key) throw new Error('WHEEL_SIZE_KEY não configurada no .env');
  return key;
}

// ─── MAPEAMENTO DE MARCAS (Exato/DETRAN → slug Wheel-Size) ──────────────────
// Usado só no fluxo de Consulta por Placa. A Consulta Avançada usa os slugs
// da própria Wheel-Size direto, sem precisar deste mapa.
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
    'STRADA': 'strada', 'STRADA/': 'strada', 'TITANO': 'titano', 'TIPO': 'tipo',
    'TORO': 'toro', 'UNO': 'uno',
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
    'D-MAX': 'd-max', 'EPICA': 'epica', 'GROOVE': 'groove',
    'N300': 'n300', 'N400': 'n400', 'OPTRA': 'optra', 'ORLANDO': 'orlando',
    'SAIL': 'sail', 'SAIL LIFE': 'sail-life',
    'SPARK EUV': 'spark-euv', 'SPARK GT ACTIV': 'spark-gt-activ', 'VIVANT': 'vivant',
  },
  'VW - VOLKSWAGEN': {
    'AMAROK': 'amarok', 'ATLAS': 'atlas', 'BORA': 'bora', 'CRAFTER': 'crafter',
    'CROSSFOX': 'crossfox', 'CROSS UP': 'cross-up', 'CROSS UP!': 'cross-up',
    'FOX': 'fox', 'FUSCA': 'fusca',
    'GOL': 'gol', 'NOVO GOL': 'gol', 'NOVO': 'gol',
    'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'GRAND': null, 'ID.4': 'id4', 'ID4': 'id4',
    'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'LOGUS': 'logus', 'NEW': 'beetle', 'NIVUS': 'nivus',
    'PARATI': 'parati', 'PASSAT': null, 'POINTER': 'pointer',
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACECROSS': 'space-cross', 'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox',
    'SURAN': 'suran',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TERAMONT': 'teramont',
    'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'TRANSPORTER': 'transporter',
    'UP': 'up', 'UP!': 'up', 'VENTO': 'vento', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },
  'VOLKSWAGEN': {
    'AMAROK': 'amarok', 'ATLAS': 'atlas', 'BORA': 'bora', 'CRAFTER': 'crafter',
    'CROSSFOX': 'crossfox', 'CROSS UP': 'cross-up', 'CROSS UP!': 'cross-up',
    'FOX': 'fox', 'FUSCA': 'fusca',
    'GOL': 'gol', 'NOVO GOL': 'gol', 'NOVO': 'gol',
    'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'ID.4': 'id4', 'ID4': 'id4',
    'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'LOGUS': 'logus', 'NEW': 'beetle', 'NIVUS': 'nivus',
    'PARATI': 'parati', 'PASSAT': null, 'POINTER': 'pointer',
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACECROSS': 'space-cross', 'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox',
    'SURAN': 'suran',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TERAMONT': 'teramont',
    'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'TRANSPORTER': 'transporter',
    'UP': 'up', 'UP!': 'up', 'VENTO': 'vento', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },
  'HONDA': {
    'ACCORD': 'accord', 'CITY': 'city', 'CIVIC': 'civic', 'CIVIC TYPE R': 'civic-type-r',
    'CR-V': 'cr-v', 'CRV': 'cr-v', 'FIT': 'fit',
    'HR-V': 'hr-v', 'HRV': 'hr-v', 'HR V': 'hr-v',
    'ODYSSEY': 'odyssey', 'PASSPORT': null, 'PILOT': 'pilot',
    'WR-V': 'wr-v', 'WRV': 'wr-v', 'ZR-V': 'zr-v', 'ZRV': 'zr-v',
    'RIDGELINE': 'ridgeline',
  },
  'TOYOTA': {
    'CAMRY': 'camry', 'C-HR': 'c-hr', 'CHR': 'c-hr',
    'COROLLA': 'corolla', 'COROLLA ALTIS': 'corolla-altis', 'COROLLA CROSS': 'corolla-cross',
    'ETIOS': 'etios', 'ETIOS CROSS': 'etios-cross', 'FORTUNER': 'fortuner',
    'HIACE': 'hiace', 'HILUX': 'hilux', 'HILUX STOUT': 'hilux-stout',
    'LAND': 'land-cruiser', 'LAND CRUISER': 'land-cruiser', 'LAND CRUISER PRADO': 'land-cruiser-prado',
    'PRIUS': 'prius', 'RAV4': 'rav4', 'RAV 4': 'rav4', 'RAV-4': 'rav4',
    'SW4': 'sw4', 'YARIS': 'yaris', 'YARIS CROSS': 'yaris-cross',
    '4RUNNER': '4runner', '86': '86', 'AGYA': 'agya', 'AVANZA': 'avanza',
    'FJ CRUISER': 'fj-cruiser', 'GR COROLLA': 'gr-corolla',
    'GR YARIS': 'gr-yaris', 'GR86': 'gr86', 'INNOVA': 'innova',
    'PRIUS C': 'prius-c', 'RAIZE': 'raize', 'RUSH': 'rush',
    'TUNDRA': 'tundra', 'URBAN CRUISER': 'urban-cruiser',
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
    'COMMANDER': 'commander',
    'COMPASS': 'compass', 'GLADIATOR': 'gladiator',
    'GRAND': 'grand-cherokee', 'GRAND CHEROKEE': 'grand-cherokee',
    'RENEGADE': 'renegade', 'WRANGLER': 'wrangler',
  },
  'NISSAN': {
    'ALTIMA': 'altima', 'FRONTIER': 'frontier', 'GT-R': 'gt-r', 'GTR': 'gt-r',
    'KAIT': 'kait', 'KICKS': 'kicks', 'KICKS PLAY': 'kicks-play',
    'LEAF': 'leaf', 'MARCH': 'march', 'MURANO': 'murano',
    'NAVARA': 'navara', 'NOTE': 'note',
    'NP300': 'np300', 'NP300 FRONTIER': 'np300-frontier',
    'NV350': 'nv350', 'NV350 URVAN': 'nv350-urvan',
    'PATHFINDER': 'pathfinder', 'PATROL': 'patrol',
    'QASHQAI': 'qashqai', 'SENTRA': 'sentra', 'TIIDA': 'tiida',
    'TSURU': 'tsuru', 'URVAN': 'urvan', 'V-DRIVE': 'v-drive', 'V16': 'v16',
    'VERSA': 'versa',
    'X-TRAIL': 'x-trail', 'XTRAIL': 'x-trail', 'X TRAIL': 'x-trail',
    'X-TRAIL X-TREME': 'x-trail-x-treme',
  },
  'FORD': {
    'BRONCO': 'bronco', 'BRONCO SPORT': 'bronco-sport', 'COURIER': 'courier',
    'E-TRANSIT': 'e-transit', 'ECOSPORT': 'ecosport', 'EDGE': 'edge',
    'EXPEDITION': 'expedition', 'EXPLORER': 'explorer',
    'F-100': 'f-150', 'F-1000': 'ranger', 'F-150': 'f-150', 'F-250': 'f-250',
    'FIESTA': 'fiesta', 'FOCUS': 'focus', 'FUSION': 'fusion',
    'KA': 'ka', 'KA+': 'ka-plus', 'KA PLUS': 'ka-plus', 'KA FREESTYLE': 'ka-freestyle',
    'KUGA': 'kuga', 'MAVERICK': 'maverick', 'MONDEO': 'mondeo', 'MUSTANG': 'mustang',
    'MUSTANG MACH 1': 'mustang-mach-1', 'MUSTANG MACH-E': 'mustang-mach-e',
    'RANGER': 'ranger', 'TERRITORY': 'territory', 'TRANSIT': 'transit', 'TRANSIT CUSTOM': 'transit-custom',
  },
  'RENAULT': {
    'BOREAL': 'boreal', 'CAPTUR': 'captur', 'DUSTER': 'duster', 'DUSTER OROCH': 'duster-oroch',
    'FLUENCE': 'fluence', 'KANGOO': 'kangoo', 'KANGOO EXPRESS': 'kangoo-express',
    'KANGOO STEPWAY': 'kangoo-stepway', 'KARDIAN': 'kardian', 'KOLEOS': 'koleos',
    'KWID': 'kwid', 'LOGAN': 'logan', 'MASTER': 'master',
    'MEGANE': 'megane-e-tech', 'MEGANE E-TECH': 'megane-e-tech',
    'OROCH': 'oroch', 'SANDERO': 'sandero', 'SANDERO STEPWAY': 'sandero-stepway',
    'STEPWAY': 'stepway', 'SYMBOL': 'symbol', 'TRAFIC': 'trafic', 'ZOE': 'zoe',
    'ALASKAN': 'alaskan', 'KANGOO VAN': 'kangoo-van', 'SCALA': 'scala', 'TWIZY': 'twizy',
  },
  'MITSUBISHI': {
    'ASX': 'asx', 'ECLIPSE CROSS': 'eclipse-cross', 'GALANT': 'galant',
    'L200': 'l200', 'L 200': 'l200', 'LANCER': 'lancer', 'OUTLANDER': 'outlander',
    'PAJERO': 'pajero', 'PAJERO FULL': 'pajero-full', 'PAJERO SPORT': 'pajero-sport',
  },
  'RAM': {
    'RAMPAGE': 'rampage',
    '1000': '1000', '1500': '1500', '1500 TRX': '1500-trx',
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
    '107': '107', '206': '206', '207': '207', '208': '208',
    '307': '307', '308': '308', '406': '406', '407': '407', '408': '408', '508': '508',
    '2008': '2008', '3008': '3008', '5008': '5008',
    'BOXER': 'boxer', 'EXPERT': 'expert', 'PARTNER': 'partner',
  },
  'SUBARU': {
    'ASCENT': 'ascent', 'BRZ': 'brz', 'CROSSTREK': 'crosstrek', 'FORESTER': 'forester',
    'IMPREZA': 'impreza', 'LEGACY': 'legacy', 'OUTBACK': 'outback', 'WRX': 'wrx', 'XV': 'xv',
  },
  'SUZUKI': {
    'BALENO': 'baleno', 'CIAZ': 'ciaz', 'GRAND VITARA': 'grand-vitara', 'IGNIS': 'ignis',
    'JIMNY': 'jimny', 'S-CROSS': 's-cross', 'SCROSS': 's-cross', 'SWIFT': 'swift', 'VITARA': 'vitara',
  },
  'CITROËN': {
    'AIRCROSS': 'aircross', 'BASALT': 'basalt', 'BERLINGO': 'berlingo',
    'BERLINGO MULTISPACE': 'berlingo-multispace',
    'C-ELYSEE': 'c-elysee', 'C ELYSEE': 'c-elysee',
    'C3': 'c3', 'C3 AIRCROSS': 'c3-aircross', 'C4': 'c4', 'C4 CACTUS': 'c4-cactus',
    'C5 AIRCROSS': 'c5-aircross', 'JUMPER': 'jumper', 'JUMPY': 'jumpy', 'SPACETOURER': 'spacetourer',
  },
  'CITROEN': {
    'AIRCROSS': 'aircross', 'BASALT': 'basalt', 'BERLINGO': 'berlingo',
    'BERLINGO MULTISPACE': 'berlingo-multispace',
    'C-ELYSEE': 'c-elysee', 'C ELYSEE': 'c-elysee',
    'C3': 'c3', 'C3 AIRCROSS': 'c3-aircross', 'C4': 'c4', 'C4 CACTUS': 'c4-cactus',
    'C5 AIRCROSS': 'c5-aircross', 'JUMPER': 'jumper', 'JUMPY': 'jumpy', 'SPACETOURER': 'spacetourer',
  },
  'BYD': {
    'ATTO': null, 'D1': 'd1', 'DOLPHIN': 'dolphin', 'DOLPHIN MINI': 'dolphin-mini',
    'DOLPHIN PLUS': 'dolphin-plus', 'ET3': null, 'HAN': 'han', 'KING': 'king',
    'SEAL': 'seal', 'SHARK': 'shark', 'SONG': 'song-plus', 'SONG PLUS': 'song-plus',
    'SONG PRO': 'song-pro', 'TAN': 'tan', 'TANG': 'tang',
    'YUAN': 'yuan-plus', 'YUAN PLUS': 'yuan-plus', 'YUAN PRO': 'yuan-pro',
  },
};

// ─── CASOS CONHECIDOS ONDE A WHEEL-SIZE ERRA ─────────────────────────────────
// Modelos/versões em que já observamos a Wheel-Size retornar dado errado —
// pula direto pro banco local (match exato) em vez de confiar na API.
const VERSOES_FORCA_BANCO = ['M SPORT', 'M-SPORT'];
function versaoForcaBanco(versao) {
  return VERSOES_FORCA_BANCO.some(v => (versao || '').toUpperCase().includes(v));
}

// ─── FUNÇÕES AUXILIARES DE NORMALIZAÇÃO ──────────────────────────────────────
function normalizarModelo(modelo) {
  return (modelo || '').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
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

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  const match = tireFull.match(/^(\d+\/\d+\s*[A-Z]\d+)/);
  if (match) return match[1].replace(' ', '');
  return tireFull.split(' ')[0];
}

// Extrai cilindrada (ex: "1.0", "1.6") e sinal de turbo de um texto de versão
function extrairInfoMotor(texto) {
  const upper = (texto || '').toUpperCase().replace(/,/g, '.');
  const match = upper.match(/(\d\.\d)/);
  const cilindrada = match ? match[1] : null;
  const turbo = /TURBO|TSI|TFSI|TDI|\d\.\dT\b/.test(upper);
  return { cilindrada, turbo };
}

function trimCombinaComMotor(trimStr, infoVersaoMotor) {
  if (!infoVersaoMotor.cilindrada) return false;
  const infoTrim = extrairInfoMotor(trimStr);
  if (!infoTrim.cilindrada || infoTrim.cilindrada !== infoVersaoMotor.cilindrada) return false;
  return infoTrim.turbo === infoVersaoMotor.turbo;
}

function trimLevelsCombinaComVersao(trimLevels, versaoUpper) {
  const palavras = versaoUpper.split(/[\s\-\/\.]+/).filter(p => p.length > 1);
  const levels = (trimLevels || []).map(l => l.toUpperCase());
  return levels.some(l => palavras.some(p => l.includes(p) || p.includes(l)));
}

// ─── CACHE EM MEMÓRIA (economiza cota diária da Wheel-Size) ─────────────────
const cache = new Map();
function getCache(chave) {
  const entrada = cache.get(chave);
  if (!entrada) return null;
  if (Date.now() > entrada.expira) { cache.delete(chave); return null; }
  return entrada.valor;
}
function setCache(chave, valor, ttlMs) {
  cache.set(chave, { valor, expira: Date.now() + ttlMs });
}

// ─── TAXONOMIA WHEEL-SIZE (marcas/modelos/anos — usado pela Consulta Avançada) ─
async function buscarMakes() {
  const chave = 'makes';
  const emCache = getCache(chave);
  if (emCache) return emCache;
  const response = await axios.get(WHEEL_SIZE_MAKES_URL, {
    params: { region: REGION, user_key: wheelSizeKey() }, timeout: 10000,
  });
  const marcas = response.data?.data || [];
  setCache(chave, marcas, 24 * 60 * 60 * 1000);
  return marcas;
}

async function buscarModels(makeSlug) {
  const chave = `models:${makeSlug}`;
  const emCache = getCache(chave);
  if (emCache) return emCache;
  const response = await axios.get(WHEEL_SIZE_MODELS_URL, {
    params: { make: makeSlug, region: REGION, user_key: wheelSizeKey() }, timeout: 10000,
  });
  const modelos = response.data?.data || [];
  setCache(chave, modelos, 24 * 60 * 60 * 1000);
  return modelos;
}

async function buscarYears(makeSlug, modelSlug) {
  const chave = `years:${makeSlug}:${modelSlug}`;
  const emCache = getCache(chave);
  if (emCache) return emCache;
  const response = await axios.get(WHEEL_SIZE_YEARS_URL, {
    params: { make: makeSlug, model: modelSlug, region: REGION, user_key: wheelSizeKey() }, timeout: 10000,
  });
  const anos = response.data?.data || [];
  setCache(chave, anos, 24 * 60 * 60 * 1000);
  return anos;
}

// Lista os trims (versões reais) de um make+model+year, já formatados pra UI
async function listarVersoesParaSelecao(makeSlug, modelSlug, ano) {
  const rows = await buscarTrimsBrutos({ marcaSlug: makeSlug, modeloSlug: modelSlug, ano });
  return rows.map(r => ({
    slug: r.slug,
    trim: r.trim,
    trim_levels: r.trim_levels || [],
    motor: r.engine ? {
      capacidade: r.engine.capacity || null,
      combustivel: r.engine.fuel || null,
      potencia_cv: r.engine.power?.hp || null,
    } : null,
    rotulo: montarRotuloTrim(r),
  }));
}

function montarRotuloTrim(r) {
  const partes = [];
  if (r.trim) partes.push(r.trim);
  if (r.engine?.power?.hp) partes.push(`${r.engine.power.hp}cv`);
  if (r.engine?.fuel) partes.push(r.engine.fuel);
  if (r.trim_levels && r.trim_levels.length) partes.push(`(${r.trim_levels.join('/')})`);
  return partes.join(' — ') || r.trim || 'Versão';
}

// ─── BUSCA BRUTA DE TRIMS (search/by_model) COM CACHE ────────────────────────
async function buscarTrimsBrutos({ marcaSlug, modeloSlug, ano }) {
  const chave = `trims:${marcaSlug}:${modeloSlug}:${ano}`;
  const emCache = getCache(chave);
  if (emCache) return emCache;
  try {
    const response = await axios.get(WHEEL_SIZE_URL, {
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: wheelSizeKey() },
      timeout: 10000,
    });
    const rows = response.data?.data || [];
    setCache(chave, rows, 12 * 60 * 60 * 1000);
    return rows;
  } catch (error) {
    if (error.response?.status === 429) console.warn('[WHEEL-SIZE] Limite diário atingido (429)');
    else console.error('[WHEEL-SIZE] Erro ao buscar trims:', error.message);
    return [];
  }
}

// ─── CÁLCULO DE MEDIDAS DISTINTAS DE UM CONJUNTO DE TRIMS ────────────────────
function medidasDistintasDeCandidatos(rows, apenasEstoque = true) {
  const frente = new Set();
  const traseira = new Set();
  let temTraseiraDiferente = false;

  for (const row of rows) {
    for (const wheel of (row.wheels || [])) {
      if (apenasEstoque && !wheel.is_stock) continue;
      const medidaFrente = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
      if (medidaFrente) frente.add(medidaFrente);
      const medidaTras = extrairMedida(wheel.rear?.tire_full || wheel.rear?.tire);
      if (medidaTras && medidaTras !== medidaFrente) {
        traseira.add(medidaTras);
        temTraseiraDiferente = true;
      }
    }
  }

  return { frente: [...frente], traseira: [...traseira], temTraseiraDiferente };
}

function montarPneusConfirmados({ rows, frenteMedida, traseiraMedida, imagemCarro }) {
  let infoFrente = null;
  let infoTras = null;

  busca:
  for (const row of rows) {
    for (const wheel of (row.wheels || [])) {
      const mF = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
      if (mF === frenteMedida && !infoFrente) {
        infoFrente = {
          pressao_bar: wheel.front?.tire_pressure?.bar || null,
          pressao_psi: wheel.front?.tire_pressure?.psi || null,
          indice_velocidade: wheel.front?.speed_index || null,
        };
      }
      if (traseiraMedida) {
        const mT = extrairMedida(wheel.rear?.tire_full || wheel.rear?.tire);
        if (mT === traseiraMedida && !infoTras) {
          infoTras = {
            pressao_bar: wheel.rear?.tire_pressure?.bar || null,
            pressao_psi: wheel.rear?.tire_pressure?.psi || null,
            indice_velocidade: wheel.rear?.speed_index || null,
          };
        }
      }
      if (infoFrente && (!traseiraMedida || infoTras)) break busca;
    }
  }

  const pneus = [{
    id: 1, medida: frenteMedida, tipo: 'original', prioridade: 1,
    observacao: traseiraMedida ? 'Medida original de fábrica (OE) — Dianteiro' : 'Medida original de fábrica (OE)',
    fonte: 'wheel-size',
    pressao_bar: infoFrente?.pressao_bar ?? null,
    pressao_psi: infoFrente?.pressao_psi ?? null,
    indice_velocidade: infoFrente?.indice_velocidade ?? null,
    imagem_carro: imagemCarro,
  }];

  if (traseiraMedida) {
    pneus.push({
      id: 2, medida: traseiraMedida, tipo: 'original', prioridade: 2,
      observacao: 'Medida original de fábrica (OE) — Traseiro',
      fonte: 'wheel-size',
      pressao_bar: infoTras?.pressao_bar ?? null,
      pressao_psi: infoTras?.pressao_psi ?? null,
      indice_velocidade: infoTras?.indice_velocidade ?? null,
      imagem_carro: null,
    });
  }

  return pneus;
}

// ─── NÚCLEO: RESOLVE UM CONJUNTO DE TRIMS EM ALTA OU BAIXA CONFIANÇA ─────────
// Regra central: só afirma UMA medida quando o conjunto final de candidatos
// aponta pra exatamente uma medida distinta. Caso contrário, nunca "chuta" —
// devolve todas as candidatas com confiança baixa.
function resolverDeCandidatos(rowsOriginais, versao) {
  if (!rowsOriginais || rowsOriginais.length === 0) return { encontrado: false };

  let rows = rowsOriginais;
  let { frente, traseira, temTraseiraDiferente } = medidasDistintasDeCandidatos(rows);

  // Nenhum wheel marcado como estoque (raro) — usa qualquer wheel disponível
  if (frente.length === 0) {
    const semFiltro = medidasDistintasDeCandidatos(rows, false);
    frente = semFiltro.frente; traseira = semFiltro.traseira; temTraseiraDiferente = semFiltro.temTraseiraDiferente;
  }

  // Restringe por motor/cilindrada (o que de fato determina o aro na maioria dos casos)
  if (frente.length > 1 && versao) {
    const infoMotor = extrairInfoMotor(versao);
    if (infoMotor.cilindrada) {
      const porMotor = rows.filter(r => trimCombinaComMotor(r.trim, infoMotor));
      if (porMotor.length > 0) {
        rows = porMotor;
        const recalculo = medidasDistintasDeCandidatos(rows);
        frente = recalculo.frente; traseira = recalculo.traseira; temTraseiraDiferente = recalculo.temTraseiraDiferente;
      }
    }
  }

  // Refina por acabamento comercial (trim_levels) — só como critério secundário
  if (frente.length > 1 && versao) {
    const versaoUpper = versao.toUpperCase();
    const porBadge = rows.filter(r => trimLevelsCombinaComVersao(r.trim_levels, versaoUpper));
    if (porBadge.length > 0) {
      rows = porBadge;
      const recalculo = medidasDistintasDeCandidatos(rows);
      frente = recalculo.frente; traseira = recalculo.traseira; temTraseiraDiferente = recalculo.temTraseiraDiferente;
    }
  }

  const imagemCarro = rowsOriginais[0]?.generation?.bodies?.[0]?.image || null;

  if (frente.length === 1 && (!temTraseiraDiferente || traseira.length <= 1)) {
    const pneus = montarPneusConfirmados({
      rows, frenteMedida: frente[0], traseiraMedida: traseira[0] || null, imagemCarro,
    });
    return { encontrado: true, confianca: 'alta', pneus };
  }

  const candidatos = [...new Set([...frente, ...traseira])];
  return { encontrado: true, confianca: 'baixa', candidatos, imagemCarro };
}

// ─── ENTRADA 1: Consulta por Placa (marca/modelo em texto livre da Exato) ────
async function resolverMedidaComConfianca({ marca, modelo, ano, versao }) {
  const marcaUpper = (marca || '').trim().toUpperCase();
  const marcaSlug = MARCA_MAP[marcaUpper];
  if (!marcaSlug) return { encontrado: false, motivo: 'marca_nao_mapeada' };

  const modeloSlug = resolverModeloSlug(marcaSlug, marca, modelo);
  if (!modeloSlug) return { encontrado: false, motivo: 'modelo_nao_mapeado' };

  const rows = await buscarTrimsBrutos({ marcaSlug, modeloSlug, ano });
  return resolverDeCandidatos(rows, versao);
}

// ─── ENTRADA 2: Consulta Avançada (cliente já escolheu o trim exato) ────────
async function resolverMedidaPorTrimExato({ marcaSlug, modeloSlug, ano, trimSlug }) {
  const rows = await buscarTrimsBrutos({ marcaSlug, modeloSlug, ano });
  const linha = rows.find(r => r.slug === trimSlug);
  if (!linha) return { encontrado: false };
  return resolverDeCandidatos([linha], null);
}

// ─── CACHE NO BANCO LOCAL (só grava respostas de alta confiança, match exato) ─
async function gravarCacheAltaConfianca({ marca, modelo, ano, versao, pneus }) {
  try {
    if (!pneus || pneus.length === 0) return;
    if (!marca || !modelo || !ano) return;

    const marcaUp = marca.trim().toUpperCase();
    const modeloUp = modelo.trim().toUpperCase();
    const versaoUp = versao ? versao.trim().toUpperCase() : null;
    const anoNum = Number(ano);

    const [existentes] = await db.execute(
      `SELECT id FROM veiculos
       WHERE TRIM(UPPER(marca)) = ?
         AND TRIM(UPPER(modelo)) = ?
         AND TRIM(UPPER(IFNULL(versao,''))) = TRIM(UPPER(IFNULL(?,'')))
         AND ? BETWEEN ano_inicio AND ano_fim
         AND ativo = 1
       LIMIT 1`,
      [marcaUp, modeloUp, versaoUp, anoNum]
    );

    let veiculoId;
    if (existentes.length > 0) {
      veiculoId = existentes[0].id;
    } else {
      const [ins] = await db.execute(
        `INSERT INTO veiculos (marca, modelo, versao, ano_inicio, ano_fim, ativo, created_at)
         VALUES (?, ?, ?, ?, ?, 1, NOW())`,
        [marcaUp, modeloUp, versaoUp, anoNum, anoNum]
      );
      veiculoId = ins.insertId;
      console.log(`[CACHE] Novo veículo gravado ID=${veiculoId}: ${marcaUp} ${modeloUp} ${anoNum} (${versaoUp || 'sem versão'})`);
    }

    let novas = 0;
    for (const pneu of pneus) {
      if (!pneu.medida) continue;
      const [existe] = await db.execute(
        `SELECT id FROM veiculo_medidas WHERE veiculo_id = ? AND TRIM(medida) = TRIM(?) LIMIT 1`,
        [veiculoId, pneu.medida]
      );
      if (existe.length === 0) {
        await db.execute(
          `INSERT INTO veiculo_medidas (veiculo_id, medida, tipo, prioridade, observacao, ativo, created_at)
           VALUES (?, ?, ?, ?, ?, 1, NOW())`,
          [veiculoId, pneu.medida, pneu.tipo || 'original', pneu.prioridade || 1, pneu.observacao || 'Auto-gravado via wheel-size (alta confiança)']
        );
        novas++;
      }
    }

    if (novas > 0) {
      console.log(`[CACHE] ${novas} medida(s) nova(s) gravada(s) → veiculo_id=${veiculoId} (${marcaUp} ${modeloUp} ${anoNum})`);
    }
  } catch (err) {
    console.error('[CACHE] Erro ao gravar no banco:', err.message);
  }
}

module.exports = {
  MARCA_MAP,
  resolverModeloSlug,
  versaoForcaBanco,
  buscarMakes,
  buscarModels,
  buscarYears,
  listarVersoesParaSelecao,
  buscarTrimsBrutos,
  resolverMedidaComConfianca,
  resolverMedidaPorTrimExato,
  gravarCacheAltaConfianca,
};
