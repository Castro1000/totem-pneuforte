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
// Ponte: O que a EXATO retorna → O que a WHEEL-SIZE entende
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
  },

  'VW - VOLKSWAGEN': {
    'AMAROK': 'amarok', 'BORA': 'bora', 'CROSSFOX': 'crossfox', 'FOX': 'fox',
    'FUSCA': 'fusca', 'GOL': 'gol', 'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'GRAND': null, 'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'LOGUS': 'logus', 'NEW': 'beetle', 'NIVUS': 'nivus',
    'PARATI': 'parati', 'PASSAT': 'passat', 'POINTER': 'pointer',
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACECROSS': 'space-cross', 'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'UP': 'up', 'UP!': 'up', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },

  'VOLKSWAGEN': {
    'AMAROK': 'amarok', 'BORA': 'bora', 'CROSSFOX': 'crossfox', 'FOX': 'fox',
    'FUSCA': 'fusca', 'GOL': 'gol', 'GOLF': 'golf-gti', 'GOLF GTI': 'golf-gti',
    'JETTA': 'jetta', 'JETTA GLI': 'jetta-gli', 'JETTA VARIANT': 'jetta-variant',
    'KOMBI': 'kombi', 'LOGUS': 'logus', 'NEW': 'beetle', 'NIVUS': 'nivus',
    'PARATI': 'parati', 'PASSAT': 'passat', 'POINTER': 'pointer',
    'POLO': 'polo', 'POLO TRACK': 'polo-track', 'SAVEIRO': 'saveiro',
    'SPACECROSS': 'space-cross', 'SPACE CROSS': 'space-cross', 'SPACEFOX': 'spacefox',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'TAOS': 'taos', 'TERA': 'tera', 'TIGUAN': 'tiguan', 'TIGUAN ALLSPACE': 'tiguan-allspace',
    'TOUAREG': 'touareg', 'UP': 'up', 'UP!': 'up', 'VIRTUS': 'virtus', 'VOYAGE': 'voyage',
  },

  'HONDA': {
    'ACCORD': 'accord', 'CITY': 'city', 'CIVIC': 'civic', 'CIVIC TYPE R': 'civic-type-r',
    'CR-V': 'cr-v', 'CRV': 'cr-v', 'FIT': 'fit',
    'HR-V': 'hr-v', 'HRV': 'hr-v', 'HR V': 'hr-v',
    'ODYSSEY': 'odyssey', 'PASSPORT': 'passport', 'PILOT': 'pilot',
    'WR-V': 'wr-v', 'WRV': 'wr-v', 'ZR-V': 'zr-v', 'ZRV': 'zr-v',
  },

  'TOYOTA': {
    'CAMRY': 'camry', 'C-HR': 'c-hr', 'CHR': 'c-hr',
    'COROLLA': 'corolla', 'COROLLA ALTIS': 'corolla-altis', 'COROLLA CROSS': 'corolla-cross',
    'ETIOS': 'etios', 'ETIOS CROSS': 'etios-cross', 'FORTUNER': 'fortuner',
    'HIACE': 'hiace', 'HILUX': 'hilux', 'HILUX STOUT': 'hilux-stout',
    'LAND': 'land-cruiser', 'LAND CRUISER': 'land-cruiser', 'LAND CRUISER PRADO': 'land-cruiser-prado',
    'PRIUS': 'prius', 'RAV4': 'rav4', 'RAV 4': 'rav4', 'RAV-4': 'rav4',
    'SW4': 'sw4', 'YARIS': 'yaris', 'YARIS CROSS': 'yaris-cross',
  },

  'HYUNDAI': {
    'ACCENT': 'accent', 'AZERA': 'azera', 'CRETA': 'creta', 'CRETA GRAND': 'creta-grand',
    'ELANTRA': 'elantra', 'GRAND': 'grand-i10', 'GRAND I10': 'grand-i10',
    'H1': 'h1', 'H-1': 'h1', 'H100': 'h-100', 'H-100': 'h-100',
    'HB20': 'hb20', 'HB20S': 'hb20s', 'HB20X': 'hb20x', 'HR': 'hr',
    'I30': 'i30', 'I30CW': 'i30', 'IONIQ': 'ioniq', 'IONIQ 5': 'ioniq-5',
    'IX35': 'tucson', 'KONA': 'kona', 'PALISADE': 'palisade', 'PORTER': 'porter',
    'SANTA': 'santa-fe', 'SANTA FE': 'santa-fe',
    'SONATA': 'sonata-hybrid', 'SONATA HYBRID': 'sonata-hybrid',
    'TUCSON': 'tucson', 'VELOSTER': 'veloster', 'VELOSTER N': 'veloster-n', 'VENUE': 'venue',
  },

  'JEEP': {
    'AVENGER': 'avenger', 'CHEROKEE': 'cherokee', 'COMMANDER': 'commander',
    'COMPASS': 'compass', 'GLADIATOR': 'gladiator',
    'GRAND': 'grand-cherokee', 'GRAND CHEROKEE': 'grand-cherokee',
    'RENEGADE': 'renegade', 'WRANGLER': 'wrangler',
  },

  'NISSAN': {
    'ALTIMA': 'altima', 'FRONTIER': 'frontier', 'GT-R': 'gt-r', 'GTR': 'gt-r',
    'KAIT': 'kait', 'KICKS': 'kicks', 'LEAF': 'leaf', 'MARCH': 'march',
    'MURANO': 'murano', 'PATHFINDER': 'pathfinder', 'SENTRA': 'sentra',
    'TIIDA': 'tiida', 'VERSA': 'versa',
    'X-TRAIL': 'x-trail', 'XTRAIL': 'x-trail', 'X TRAIL': 'x-trail',
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
  },

  'MITSUBISHI': {
    'ASX': 'asx', 'ECLIPSE CROSS': 'eclipse-cross', 'GALANT': 'galant',
    'L200': 'l200', 'L 200': 'l200', 'LANCER': 'lancer', 'OUTLANDER': 'outlander',
    'PAJERO': 'pajero', 'PAJERO FULL': 'pajero-full', 'PAJERO SPORT': 'pajero-sport',
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

};

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────
function normalizarModelo(modelo) {
  return (modelo || '').toLowerCase().trim()
    .replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
}

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/);
  return match ? match[1] : tireFull.split(' ')[0];
}

function resolverModeloSlug(marcaSlug, marcaNome, modelo) {
  const modeloUpper = (modelo || '').trim().toUpperCase();
  const marcaUpper = (marcaNome || '').trim().toUpperCase();
  if (marcaSlug === 'bmw') return BMW_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  if (marcaSlug === 'haval') return GWM_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  if (MODELO_ESPECIAL_MAP[marcaUpper] && MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper] !== undefined) {
    return MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper]; // pode ser null
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
    if (!marcaSlug) {
      return res.status(404).json({ erro: `Marca "${marca}" não mapeada`, pneus: [] });
    }

    const modeloSlug = resolverModeloSlug(marcaSlug, marca, modelo);

    // Modelo antigo/inexistente na API
    if (!modeloSlug) {
      return res.status(404).json({ erro: `Modelo "${modelo}" não existe na API wheel-size`, pneus: [] });
    }

    console.log(`[WHEEL-SIZE ROUTE] Consultando: make=${marcaSlug} model=${modeloSlug} year=${ano}`);

    const response = await axios.get(WHEEL_SIZE_URL, {
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY },
      timeout: 10000
    });

    const data = response.data?.data || [];
    if (!data.length) {
      return res.status(404).json({ erro: 'Veículo não encontrado na API', pneus: [] });
    }

    // 1. Conta quantas versões têm cada medida OE (mais frequente = mais comum no Brasil)
    const contagemOE = new Map();
    const contagemAlt = new Map();

    data.forEach(item => {
      (item.wheels || []).forEach(wheel => {
        const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
        if (!medida) return;
        if (wheel.is_stock) {
          contagemOE.set(medida, (contagemOE.get(medida) || 0) + 1);
        } else {
          contagemAlt.set(medida, (contagemAlt.get(medida) || 0) + 1);
        }
      });
    });

    // 2. Ordena por frequência (mais versões com aquela medida = mais comum)
    const medidasOE = Array.from(contagemOE.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([medida]) => medida);

    const medidasAlt = Array.from(contagemAlt.entries())
      .filter(([medida]) => !contagemOE.has(medida))
      .sort((a, b) => b[1] - a[1])
      .map(([medida]) => medida);

    // 3. Fallback: se não achou OE, usa alternativas
    const todasMedidas = medidasOE.length > 0 ? medidasOE : medidasAlt;

    if (todasMedidas.length === 0) {
      return res.status(404).json({ erro: 'Nenhuma medida encontrada', pneus: [] });
    }

    // 4. Limita a 3
    const medidasUnicas = todasMedidas.slice(0, 3);

    // 5. Monta resposta
    const pneus = medidasUnicas.map((medida, i) => ({
      id: i + 1,
      medida,
      tipo: 'original',
      prioridade: i === 0 ? 1 : 2,
      observacao: 'Medida original de fábrica (OE)',
      fonte: 'wheel-size'
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
