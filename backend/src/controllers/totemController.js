const db = require('../config/db');
const axios = require('axios');
const { buscarVeiculoPorPlaca } = require('../services/plateProvider');
const { buscarPneusCompativeis } = require('../services/tireService');

const WHEEL_SIZE_KEY = process.env.WHEEL_SIZE_KEY || '3c20bfc74ecd98718e60dfbc5648e757';
const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const REGION = 'ladm';

// ─── MAPEAMENTO DE MARCAS ─────────────────────────────────────────────────────
const MARCA_MAP = {
  'AUDI': 'audi',
  'BMW': 'bmw',
  'BYD': 'byd',
  'CHEVROLET': 'chevrolet',
  'GM - CHEVROLET': 'chevrolet',
  'CITROËN': 'citroen',
  'CITROEN': 'citroen',
  'DODGE': 'dodge',
  'FIAT': 'fiat',
  'FORD': 'ford',
  'HONDA': 'honda',
  'HYUNDAI': 'hyundai',
  'JEEP': 'jeep',
  'KIA': 'kia',
  'KIA MOTORS': 'kia',
  'LAND ROVER': 'land-rover',
  'MERCEDES-BENZ': 'mercedes-benz',
  'MERCEDES BENZ': 'mercedes-benz',
  'MITSUBISHI': 'mitsubishi',
  'NISSAN': 'nissan',
  'PEUGEOT': 'peugeot',
  'RAM': 'ram',
  'RENAULT': 'renault',
  'SUBARU': 'subaru',
  'SUZUKI': 'suzuki',
  'TOYOTA': 'toyota',
  'VW - VOLKSWAGEN': 'volkswagen',
  'VOLKSWAGEN': 'volkswagen',
  'VW': 'volkswagen',
  'GWM': 'haval',
  'HAVAL': 'haval',
  'CAOA CHERY': 'chery',
  'CHERY': 'chery',
  'VOLVO': 'volvo',
  'JAGUAR': 'jaguar',
  'PORSCHE': 'porsche',
  'MINI': 'mini',
  'LEXUS': 'lexus',
  'INFINITI': 'infiniti',
  'MASERATI': 'maserati',
  'ALFA ROMEO': 'alfa-romeo',
};

// ─── MAPEAMENTO DE MODELOS BMW ────────────────────────────────────────────────
const BMW_MODELO_MAP = {
  // Série 1
  '116I': '1-series', '116IA': '1-series',
  '118I': '1-series', '118IA': '1-series',
  '120I': '1-series', '120IA': '1-series',
  '125I': '1-series', '128I': '1-series',
  '130I': '1-series', '130IA': '1-series',
  '135I': '1-series', '135IA': '1-series',
  'M140I': '1-series',
  // Série 2
  '218I': '2-series', '220I': '2-series',
  '225I': '2-series', '228I': '2-series',
  '230I': '2-series', 'M235I': '2-series', 'M240I': '2-series',
  // Série 3
  '316': '3-series', '316I': '3-series',
  '318I': '3-series', '318IA': '3-series',
  '318IS': '3-series', '318TI': '3-series',
  '320I': '3-series', '320IA': '3-series',
  '323I': '3-series', '323IA': '3-series',
  '323CI': '3-series', '325I': '3-series', '325IA': '3-series',
  '325CI': '3-series', '328I': '3-series', '328IA': '3-series',
  '328CI': '3-series', '330I': '3-series', '330IA': '3-series',
  '330CI': '3-series', '335I': '3-series', '335IA': '3-series',
  '340I': '3-series', 'M3': 'm3', 'M340I': '3-series',
  // Série 4
  '420I': '4-series', '428I': '4-series',
  '430I': '4-series', '435I': '4-series', '435IA': '4-series',
  '440I': '4-series', 'M4': 'm4', 'M440I': '4-series',
  // Série 5
  '520I': '5-series', '523I': '5-series',
  '525I': '5-series', '528I': '5-series',
  '530I': '5-series', '535I': '5-series',
  '540I': '5-series', '545I': '5-series', '545IA': '5-series',
  '550I': '5-series', '550IA': '5-series',
  'M5': 'm5', 'M550I': '5-series',
  // Série 6
  '630I': '6-series', '640I': '6-series',
  '645CI': '6-series', '645IA': '6-series',
  '650CI': '6-series', '650I': '6-series', '650IA': '6-series',
  'M6': 'm6',
  // Série 7
  '730I': '7-series', '730IA': '7-series',
  '735I': '7-series', '740I': '7-series', '740IA': '7-series',
  '740IL': '7-series', '740ILA': '7-series',
  '745I': '7-series', '745IA': '7-series', '745LE': '7-series',
  '750I': '7-series', '750IA': '7-series',
  '750IL': '7-series', '750ILA': '7-series',
  '760IL': '7-series', 'M760LI': '7-series',
  // Série 8
  '840CI': '8-series', '840CIA': '8-series',
  '850CI': '8-series', '850CSI': '8-series', '850I': '8-series',
  'M8': 'm8', 'M850I': '8-series',
  // SUVs
  'X1': 'x1', 'X2': 'x2', 'X3': 'x3',
  'X4': 'x4', 'X5': 'x5', 'X6': 'x6', 'X7': 'x7',
  // Esportivos
  'Z3': 'z3', 'Z4': 'z4', 'Z8': 'z8',
  // Elétricos
  'I3': 'i3', 'I4': 'i4', 'I5': 'i5',
  'I7': 'i7', 'I8': 'i8',
  'IX': 'ix', 'IX1': 'ix1', 'IX2': 'ix2', 'IX3': 'ix3',
  // M series
  'M1': 'm1', 'M2': 'm2', 'M235I': 'm2',
};

// ─── MAPEAMENTO DE MODELOS GWM/HAVAL ─────────────────────────────────────────
const GWM_MODELO_MAP = {
  'H6': 'h6', 'HAVAL H6': 'h6',
  'H5': 'h5', 'HAVAL H5': 'h5',
  'H9': 'h9', 'HAVAL H9': 'h9',
  'JOLION': 'jolion', 'HAVAL JOLION': 'jolion',
  'DARGO': 'dargo', 'HAVAL DARGO': 'dargo',
  'H6 GT': 'h6gt', 'HAVAL H6 GT': 'h6gt',
  'HAVAL': 'h6', // fallback
};

// ─── MAPEAMENTO DE MODELOS ESPECIAIS (com hífen ou nomes compostos) ───────────
const MODELO_ESPECIAL_MAP = {
  'HONDA': {
    'HR-V': 'hr-v', 'HRV': 'hr-v', 'HR V': 'hr-v',
    'CR-V': 'cr-v', 'CRV': 'cr-v', 'CR V': 'cr-v',
    'CR-Z': 'cr-z', 'CRZ': 'cr-z',
    'CR-X': 'cr-x', 'CRX': 'cr-x',
    'WR-V': 'wr-v', 'WRV': 'wr-v', 'WR V': 'wr-v',
    'ZR-V': 'zr-v', 'ZRV': 'zr-v',
    'FIT': 'fit', 'CIVIC': 'civic', 'CITY': 'city',
    'ACCORD': 'accord', 'PILOT': 'pilot',
    'PASSPORT': 'passport', 'RIDGELINE': 'ridgeline',
  },
  'TOYOTA': {
    'RAV4': 'rav4', 'RAV 4': 'rav4', 'RAV-4': 'rav4',
    'C-HR': 'c-hr', 'CHR': 'c-hr', 'C HR': 'c-hr',
    'LAND CRUISER': 'land-cruiser',
    'LAND CRUISER PRADO': 'land-cruiser-prado',
    'HILUX': 'hilux', 'COROLLA': 'corolla',
    'CAMRY': 'camry', 'YARIS': 'yaris',
    'PRIUS': 'prius', 'SW4': 'sw4',
    'FORTUNER': 'fortuner',
  },
  'MITSUBISHI': {
    'L200': 'l200', 'L 200': 'l200',
    'ASX': 'asx', 'ECLIPSE CROSS': 'eclipse-cross',
    'OUTLANDER': 'outlander', 'PAJERO': 'pajero',
    'PAJERO SPORT': 'pajero-sport',
    'PAJERO FULL': 'pajero-full',
    'GALANT': 'galant', 'LANCER': 'lancer',
  },
  'LAND ROVER': {
    'RANGE ROVER': 'range-rover',
    'RANGE ROVER EVOQUE': 'range-rover-evoque',
    'RANGE ROVER SPORT': 'range-rover-sport',
    'RANGE ROVER VELAR': 'range-rover-velar',
    'DISCOVERY': 'discovery',
    'DISCOVERY SPORT': 'discovery-sport',
    'DEFENDER': 'defender',
    'FREELANDER': 'freelander',
  },
  'MERCEDES-BENZ': {
    'A': 'a-class', 'A200': 'a-class', 'A250': 'a-class',
    'B': 'b-class', 'B200': 'b-class',
    'C': 'c-class', 'C180': 'c-class', 'C200': 'c-class', 'C250': 'c-class', 'C300': 'c-class',
    'E': 'e-class', 'E200': 'e-class', 'E250': 'e-class', 'E300': 'e-class', 'E350': 'e-class',
    'S': 's-class', 'S400': 's-class', 'S500': 's-class',
    'CLA': 'cla', 'CLA200': 'cla', 'CLA250': 'cla',
    'CLS': 'cls', 'GLA': 'gla', 'GLB': 'glb',
    'GLC': 'glc', 'GLE': 'gle', 'GLS': 'gls',
    'AMG GT': 'amg-gt', 'EQC': 'eqc', 'EQS': 'eqs',
    'ML': 'ml-class', 'G': 'g-class', 'G63': 'g-class',
  },
  'VOLKSWAGEN': {
    'GOL': 'gol', 'POLO': 'polo', 'VIRTUS': 'virtus',
    'VOYAGE': 'voyage', 'JETTA': 'jetta',
    'PASSAT': 'passat', 'TIGUAN': 'tiguan',
    'T-CROSS': 't-cross', 'TCROSS': 't-cross', 'T CROSS': 't-cross',
    'T-ROC': 't-roc', 'TROC': 't-roc',
    'TOUAREG': 'touareg', 'AMAROK': 'amarok',
    'SAVEIRO': 'saveiro', 'CADDY': 'caddy',
    'GOLF': 'golf', 'TAOS': 'taos',
  },
  'FIAT': {
    'ARGO': 'argo', 'CRONOS': 'cronos',
    'TORO': 'toro', 'PULSE': 'pulse',
    'FASTBACK': 'fastback', 'DOBLO': 'doblo',
    'MOBI': 'mobi', 'UNO': 'uno',
    'PALIO': 'palio', 'SIENA': 'siena',
    'GRAND SIENA': 'grand-siena', 'GRAND': 'grand-siena',
    'STRADA': 'strada', 'DUCATO': 'ducato',
    'FREEMONT': 'freemont', 'BRAVO': 'bravo',
    'PUNTO': 'punto', 'LINEA': 'linea',
    'TITANO': 'titano', '500': '500',
    'TIPO': 'tipo', 'SCUDO': 'scudo',
  },
  'FORD': {
    'KA': 'ka', 'KA+': 'ka-plus', 'KA PLUS': 'ka-plus',
    'FIESTA': 'fiesta', 'FOCUS': 'focus',
    'FUSION': 'fusion', 'ECOSPORT': 'ecosport',
    'EDGE': 'edge', 'TERRITORY': 'territory',
    'RANGER': 'ranger', 'MAVERICK': 'maverick',
    'F-150': 'f-150', 'F-250': 'f-250',
    'TRANSIT': 'transit', 'BRONCO': 'bronco',
    'MUSTANG': 'mustang', 'EXPLORER': 'explorer',
    'EXPEDITION': 'expedition',
  },
  'CHEVROLET': {
    'ONIX': 'onix', 'ONIX PLUS': 'onix',
    'TRACKER': 'tracker', 'CRUZE': 'cruze',
    'EQUINOX': 'equinox', 'BLAZER': 'blazer',
    'MONTANA': 'montana', 'S10': 's10',
    'SPIN': 'spin', 'COBALT': 'cobalt',
    'PRISMA': 'prisma', 'AGILE': 'agile',
    'CAPTIVA': 'captiva', 'TRAILBLAZER': 'trailblazer',
    'TRAX': 'trax', 'BOLT': 'bolt',
    'SILVERADO': 'silverado',
  },
  'HYUNDAI': {
    'HB20': 'hb20', 'HB20S': 'hb20s',
    'CRETA': 'creta', 'TUCSON': 'tucson',
    'SANTA FE': 'santa-fe', 'IONIQ': 'ioniq',
    'IONIQ 5': 'ioniq-5', 'IONIQ 6': 'ioniq-6',
    'ELANTRA': 'elantra', 'SONATA': 'sonata',
    'VELOSTER': 'veloster', 'AZERA': 'azera',
    'I30': 'i30', 'IX35': 'ix35',
  },
  'NISSAN': {
    'VERSA': 'versa', 'MARCH': 'march',
    'SENTRA': 'sentra', 'ALTIMA': 'altima',
    'KICKS': 'kicks', 'FRONTIER': 'frontier',
    'PATHFINDER': 'pathfinder', 'MURANO': 'murano',
    'LEAF': 'leaf', 'X-TRAIL': 'x-trail',
    'XTRAIL': 'x-trail', 'X TRAIL': 'x-trail',
    'TIIDA': 'tiida',
  },
  'RENAULT': {
    'KWID': 'kwid', 'SANDERO': 'sandero',
    'LOGAN': 'logan', 'DUSTER': 'duster',
    'CAPTUR': 'captur', 'KARDIAN': 'kardian',
    'OROCH': 'oroch', 'MASTER': 'master',
    'CLIO': 'clio', 'MEGANE': 'megane',
    'FLUENCE': 'fluence', 'SCENIC': 'scenic',
    'KOLEOS': 'koleos', 'ZOE': 'zoe',
  },
  'PEUGEOT': {
    '208': '208', '308': '308', '408': '408',
    '2008': '2008', '3008': '3008', '5008': '5008',
    '107': '107', '206': '206', '207': '207',
    '307': '307', '406': '406', '407': '407',
    '508': '508', 'EXPERT': 'expert',
    'PARTNER': 'partner', 'BOXER': 'boxer',
  },
  'JEEP': {
    'RENEGADE': 'renegade', 'COMPASS': 'compass',
    'COMMANDER': 'commander', 'WRANGLER': 'wrangler',
    'GLADIATOR': 'gladiator', 'CHEROKEE': 'cherokee',
    'GRAND CHEROKEE': 'grand-cherokee',
  },
  'KIA': {
    'SPORTAGE': 'sportage', 'SORENTO': 'sorento',
    'STINGER': 'stinger', 'CARNIVAL': 'carnival',
    'TELLURIDE': 'telluride', 'EV6': 'ev6',
    'CERATO': 'cerato', 'OPTIMA': 'optima',
    'CADENZA': 'cadenza', 'PICANTO': 'picanto',
    'SOUL': 'soul', 'NIRO': 'niro',
    'RIO': 'rio', 'SELTOS': 'seltos',
  },
  'SUBARU': {
    'IMPREZA': 'impreza', 'LEGACY': 'legacy',
    'OUTBACK': 'outback', 'FORESTER': 'forester',
    'XV': 'xv', 'CROSSTREK': 'crosstrek',
    'WRX': 'wrx', 'BRZ': 'brz',
    'ASCENT': 'ascent',
  },
  'SUZUKI': {
    'JIMNY': 'jimny', 'SWIFT': 'swift',
    'VITARA': 'vitara', 'S-CROSS': 's-cross',
    'SCROSS': 's-cross', 'BALENO': 'baleno',
    'GRAND VITARA': 'grand-vitara',
    'IGNIS': 'ignis', 'CIAZ': 'ciaz',
  },
};

// ─── FUNÇÕES AUXILIARES ───────────────────────────────────────────────────────
function normalizarModelo(modelo) {
  return (modelo || '').toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/);
  return match ? match[1] : tireFull.split(' ')[0];
}

function resolverModeloSlug(marcaSlug, marcaNome, modelo) {
  const modeloUpper = (modelo || '').trim().toUpperCase();
  const marcaUpper = (marcaNome || '').trim().toUpperCase();

  if (marcaSlug === 'bmw') {
    return BMW_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  }

  if (marcaSlug === 'haval') {
    return GWM_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
  }

  if (MODELO_ESPECIAL_MAP[marcaUpper] && MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper]) {
    return MODELO_ESPECIAL_MAP[marcaUpper][modeloUpper];
  }

  return normalizarModelo(modelo);
}

// ─── BUSCA NA WHEEL-SIZE API ──────────────────────────────────────────────────
async function buscarMedidasWheelSize({ marca, modelo, ano, versao }) {
  try {
    const marcaUpper = (marca || '').trim().toUpperCase();
    const marcaSlug = MARCA_MAP[marcaUpper];

    if (!marcaSlug) {
      console.log(`[WHEEL-SIZE] Marca não mapeada: ${marca}`);
      return null;
    }

    const modeloSlug = resolverModeloSlug(marcaSlug, marca, modelo);

    console.log(`[WHEEL-SIZE] Consultando: make=${marcaSlug} model=${modeloSlug} year=${ano} versao=${versao}`);

    const response = await axios.get(WHEEL_SIZE_URL, {
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY },
      timeout: 8000
    });

    const data = response.data?.data || [];

    if (!data.length) {
      console.log(`[WHEEL-SIZE] Nenhum dado para ${marcaSlug} ${modeloSlug} ${ano}`);
      return null;
    }

    const versaoUpper = (versao || '').toUpperCase();
    const medidasOE = new Set();
    const medidasAlternativas = new Set();

    // TENTATIVA 1 — match pela versão
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
            if (medida) {
              if (wheel.is_stock) medidasOE.add(medida);
              else medidasAlternativas.add(medida);
            }
          }
        }
      }
    }

    // TENTATIVA 2 — fallback: pega todas as medidas OE do modelo
    if (!encontrouVersao || medidasOE.size === 0) {
      for (const item of data) {
        for (const wheel of (item.wheels || [])) {
          const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
          if (medida) {
            if (wheel.is_stock) medidasOE.add(medida);
            else medidasAlternativas.add(medida);
          }
        }
      }
    }

    if (medidasOE.size === 0 && medidasAlternativas.size === 0) {
      console.log(`[WHEEL-SIZE] Nenhuma medida extraída para ${marcaSlug} ${modeloSlug} ${ano}`);
      return null;
    }

    const pneus = [];
    let idx = 1;
    for (const medida of medidasOE) {
      pneus.push({ id: idx++, medida, tipo: 'original', prioridade: 1, observacao: 'Medida original de fábrica (OE)', fonte: 'wheel-size' });
    }
    for (const medida of medidasAlternativas) {
      if (!medidasOE.has(medida)) {
        pneus.push({ id: idx++, medida, tipo: 'alternativa', prioridade: 2, observacao: 'Medida alternativa compatível', fonte: 'wheel-size' });
      }
    }

    console.log(`[WHEEL-SIZE] ${pneus.length} medidas encontradas para ${marcaSlug} ${modeloSlug} ${ano}`);
    return pneus;

  } catch (error) {
    if (error.response?.status === 429) {
      console.warn('[WHEEL-SIZE] Limite diário atingido (429)');
    } else {
      console.error('[WHEEL-SIZE] Erro:', error.message);
    }
    return null;
  }
}

// ─── REGISTRAR CONSULTA ───────────────────────────────────────────────────────
async function registrarConsultaTotem({ origem, placa, marca, modelo, versao, ano, combustivel, codigo_fipe, veiculo_id, medida_recomendada, status, observacao, req }) {
  try {
    await db.execute(
      `INSERT INTO consultas_toten (origem, placa, codigo_fipe, marca, modelo, versao, ano, combustivel, veiculo_id, medida_recomendada, status, observacao, ip_origem, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [origem, placa || null, codigo_fipe || null, marca || null, modelo || null, versao || null,
       ano || null, combustivel || null, veiculo_id || null, medida_recomendada || null,
       status || 'encontrado', observacao || null, req?.ip || null, req?.headers?.['user-agent'] || null]
    );
  } catch (error) {
    console.error('ERRO AO REGISTRAR HISTÓRICO:', error.message || error);
  }
}

// ─── SALVAR VEÍCULO CONSULTADO ────────────────────────────────────────────────
async function salvarVeiculoConsultado({ codigo_fipe, marca, modelo, versao, ano }) {
  try {
    const anoNumero = Number(ano);
    if (!marca || !modelo || isNaN(anoNumero) || anoNumero < 1900 || anoNumero > 2050) return null;

    const marcaLimpa = (marca || '').trim().toUpperCase();
    const modeloLimpo = (modelo || '').trim().toUpperCase();
    const versaoLimpa = (versao || 'VERSÃO NÃO INFORMADA').trim().toUpperCase();

    let rows;

    if (codigo_fipe) {
      [rows] = await db.execute(
        `SELECT id FROM veiculos WHERE codigo_fipe = ? AND ? BETWEEN ano_inicio AND ano_fim LIMIT 1`,
        [codigo_fipe, anoNumero]
      );
      if (rows.length) return rows[0].id;
    }

    [rows] = await db.execute(
      `SELECT id FROM veiculos WHERE UPPER(marca) = ? AND UPPER(modelo) = ? AND UPPER(versao) = ? AND ? BETWEEN ano_inicio AND ano_fim LIMIT 1`,
      [marcaLimpa, modeloLimpo, versaoLimpa, anoNumero]
    );

    return rows.length ? rows[0].id : null;
  } catch (err) {
    console.error('[SALVAR VEICULO] Erro:', err.message);
    return null;
  }
}

// ─── BACKGROUND: salva e registra sem bloquear resposta ──────────────────────
function salvarERegistrarEmBackground({ veiculo, pneus, placa, origem, req, fonte }) {
  Promise.resolve()
    .then(async () => {
      const veiculoId = await salvarVeiculoConsultado(veiculo);
      await registrarConsultaTotem({
        origem,
        placa: placa || null,
        codigo_fipe: veiculo.codigo_fipe,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        versao: veiculo.versao,
        ano: veiculo.ano,
        combustivel: veiculo.combustivel,
        veiculo_id: veiculoId,
        medida_recomendada: pneus?.[0]?.medida || null,
        status: pneus?.length ? 'encontrado' : 'nao_encontrado',
        observacao: pneus?.length
          ? `Consulta por ${origem} — medida encontrada via ${fonte || 'banco'}`
          : `Consulta por ${origem} — medida não encontrada`,
        req
      });
    })
    .catch(err => console.error('[BACKGROUND] Erro:', err.message));
}

// ─── BUSCAR POR PLACA ─────────────────────────────────────────────────────────
async function buscarPorPlaca(req, res) {
  try {
    const { placa } = req.body;

    if (!placa) return res.status(400).json({ erro: 'Placa obrigatória' });

    const veiculo = await buscarVeiculoPorPlaca(placa);

    if (!veiculo) {
      Promise.resolve()
        .then(() => registrarConsultaTotem({ origem: 'placa', placa, status: 'nao_encontrado', observacao: 'Veículo não encontrado pela placa', req }))
        .catch(() => {});
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    // 1ª tentativa — wheel-size API
    let pneus = await buscarMedidasWheelSize({
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      versao: veiculo.versao
    });

    let fonte = 'wheel-size';

    // 2ª tentativa — banco local
    if (!pneus || pneus.length === 0) {
      console.log(`[PLACA] wheel-size não encontrou, tentando banco local para ${veiculo.modelo}...`);
      pneus = await buscarPneusCompativeis({
        codigo_fipe: veiculo.codigo_fipe,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        versao: veiculo.versao,
        ano: veiculo.ano
      });
      fonte = 'banco';
    }

    res.json({
      veiculo,
      pneus: pneus || [],
      fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados'
    });

    salvarERegistrarEmBackground({ veiculo, pneus: pneus || [], placa, origem: 'placa', req, fonte });

  } catch (error) {
    console.error('[PLACA] Erro:', error.message || error);

    if (error.message === 'Placa inválida') {
      return res.status(400).json({ erro: 'Placa inválida' });
    }

    return res.status(500).json({ erro: 'Erro ao consultar placa' });
  }
}

// ─── BUSCAR MEDIDA POR VEÍCULO (consulta avançada) ────────────────────────────
async function buscarMedidaVeiculo(req, res) {
  try {
    const { codigo_fipe, marca, modelo, versao, ano, combustivel } = req.body;

    if (!marca || !modelo || !ano) {
      return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });
    }

    const veiculo = {
      codigo_fipe: codigo_fipe || null,
      marca: (marca || '').trim().toUpperCase(),
      modelo: (modelo || '').trim().toUpperCase(),
      versao: versao ? (versao || '').trim().toUpperCase() : null,
      ano: Number(ano),
      combustivel: combustivel || null
    };

    // 1ª tentativa — banco local (consulta avançada usa banco primeiro)
    let pneus = await buscarPneusCompativeis({
      codigo_fipe: veiculo.codigo_fipe,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      versao: veiculo.versao,
      ano: veiculo.ano
    });

    let fonte = 'banco';

    // 2ª tentativa — wheel-size
    if (!pneus || pneus.length === 0) {
      pneus = await buscarMedidasWheelSize({
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        ano: veiculo.ano,
        versao: veiculo.versao
      });
      fonte = 'wheel-size';
    }

    if (!pneus || pneus.length === 0) {
      Promise.resolve()
        .then(async () => {
          const veiculoId = await salvarVeiculoConsultado(veiculo);
          await registrarConsultaTotem({
            origem: 'modelo', ...veiculo,
            veiculo_id: veiculoId,
            status: 'nao_encontrado',
            observacao: 'Medida não encontrada em nenhuma fonte',
            req
          });
        })
        .catch(() => {});

      return res.status(404).json({ erro: 'Veículo não encontrado ou sem medida', pneus: [] });
    }

    res.json({
      encontrado: true,
      veiculo,
      pneus,
      fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados'
    });

    salvarERegistrarEmBackground({ veiculo, pneus, placa: null, origem: 'modelo', req, fonte });

  } catch (error) {
    console.error('[MEDIDA VEICULO] Erro:', error.message || error);

    Promise.resolve()
      .then(() => registrarConsultaTotem({
        origem: 'modelo',
        marca: req.body?.marca,
        modelo: req.body?.modelo,
        versao: req.body?.versao,
        ano: req.body?.ano,
        status: 'erro',
        observacao: error.message || 'Erro ao buscar medida',
        req
      }))
      .catch(() => {});

    return res.status(500).json({ erro: 'Erro ao buscar medida do veículo' });
  }
}

module.exports = { buscarPorPlaca, buscarMedidaVeiculo };
