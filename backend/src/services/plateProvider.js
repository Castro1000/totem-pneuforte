const axios = require('axios');

const mockLocal = {
  ABC1D23: { placa: 'ABC1D23', marca: 'FIAT', modelo: 'STRADA', versao: 'FREEDOM 1.3 FLEX', ano: 2022, combustivel: 'FLEX' },
  BRA2E19: { placa: 'BRA2E19', marca: 'VOLKSWAGEN', modelo: 'GOL', versao: 'TRENDLINE 1.0', ano: 2020, combustivel: 'FLEX' },
  CAR3F45: { placa: 'CAR3F45', marca: 'CHEVROLET', modelo: 'ONIX', versao: 'LT 1.0 TURBO', ano: 2021, combustivel: 'FLEX' },
  TOT4G67: { placa: 'TOT4G67', marca: 'TOYOTA', modelo: 'HILUX', versao: 'SRX 2.8 DIESEL 4X4', ano: 2023, combustivel: 'DIESEL' },
  PNE5H89: { placa: 'PNE5H89', marca: 'HONDA', modelo: 'CIVIC', versao: 'EXL 1.5 TURBO CVT', ano: 2019, combustivel: 'FLEX' },
  FOR6J12: { placa: 'FOR6J12', marca: 'FORD', modelo: 'RANGER', versao: 'STORM 3.2 DIESEL 4X4', ano: 2022, combustivel: 'DIESEL' },
  HYU7K34: { placa: 'HYU7K34', marca: 'HYUNDAI', modelo: 'HB20', versao: 'VISION 1.0 FLEX', ano: 2021, combustivel: 'FLEX' },
  REN8L56: { placa: 'REN8L56', marca: 'RENAULT', modelo: 'KWID', versao: 'ZEN 1.0 FLEX', ano: 2020, combustivel: 'FLEX' },
  JEE9M78: { placa: 'JEE9M78', marca: 'JEEP', modelo: 'COMPASS', versao: 'LIMITED 2.0 DIESEL 4X4', ano: 2023, combustivel: 'DIESEL' },
  BMW0N90: { placa: 'BMW0N90', marca: 'BMW', modelo: '320I', versao: 'SPORT GP 2.0 TURBO', ano: 2022, combustivel: 'GASOLINA' }
};

function limparPlaca(placa = '') {
  return String(placa).replace(/[^A-Z0-9]/gi, '').toUpperCase();
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return obj[key];
    }
  }
  return null;
}

function extrairAno(...valores) {
  for (const valor of valores) {
    const numero = Number(valor);
    if (!Number.isNaN(numero) && numero > 1900) {
      return numero;
    }
    const match = String(valor || '').match(/\d{4}/);
    if (match) return Number(match[0]);
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAPA DE MARCAS
// Converte siglas/abreviações da Exato/DETRAN para o nome exato do banco.
// ─────────────────────────────────────────────────────────────────────────────
const MAPA_MARCAS = {
  'VW':            'VW - VOLKSWAGEN',
  'VOLKSWAGEN':    'VW - VOLKSWAGEN',
  'GM':            'GM - CHEVROLET',
  'CHEV':          'GM - CHEVROLET',
  'CHEVROLET':     'GM - CHEVROLET',
  'KIA':           'KIA MOTORS',
  'KIA MOTORS':    'KIA MOTORS',
  'LAND-ROVER':    'LAND ROVER',
  'LANDROVER':     'LAND ROVER',
  'LAND ROVER':    'LAND ROVER',
  'MERCEDES':      'MERCEDES-BENZ',
  'MERCEDES BENZ': 'MERCEDES-BENZ',
  'MB':            'MERCEDES-BENZ',
  'MITSU':         'MITSUBISHI',
  'NIS':           'NISSAN',
  'PEU':           'PEUGEOT',
  'REN':           'RENAULT',
  'TOYT':          'TOYOTA',
  'TOY':           'TOYOTA',
  'HON':           'HONDA',
  'HYU':           'HYUNDAI',
  'CITR':          'CITROËN',
  'CITROEN':       'CITROËN',
  'SUB':           'SUBARU',
  'SUZ':           'SUZUKI',
};

// Prefixos de origem do DETRAN que aparecem antes da barra e devem ser descartados.
// Ex: "I/FIAT SIENA" → I = importado, não é marca.
const PREFIXOS_DETRAN = new Set(['I', 'N', 'R', 'E']);

function normalizarMarca(marca) {
  if (!marca) return marca;
  const upper = marca.toUpperCase().trim();
  return MAPA_MARCAS[upper] || marca;
}

// ─────────────────────────────────────────────────────────────────────────────
// separarMarcaModelo
// Interpreta o campo BrandModel da Exato/DETRAN nos formatos conhecidos:
//   "VW/NIVUS CL TSI"           → marca=VW,   modelo=NIVUS CL TSI
//   "I/FIAT SIENA EL 1.4 FLEX"  → marca=FIAT, modelo=SIENA EL 1.4 FLEX
//   "CHEV/ONIX PLUS 10TAT PR1"  → marca=CHEV, modelo=ONIX PLUS 10TAT PR1
//   "TOYOTA COROLLA"            → marca=TOYOTA, modelo=COROLLA
//   "MERCEDES-BENZ C200"        → marca=MERCEDES-BENZ, modelo=C200
// ─────────────────────────────────────────────────────────────────────────────
function separarMarcaModelo(brandModel = '') {
  const texto = String(brandModel || '').toUpperCase().trim();

  if (!texto) return { marca: null, modelo: null };

  // ── Caso 1: tem barra ──────────────────────────────────────────────────────
  if (texto.includes('/')) {
    const barraIdx = texto.indexOf('/');
    const antes = texto.slice(0, barraIdx).trim();
    const depois = texto.slice(barraIdx + 1).trim();

    if (PREFIXOS_DETRAN.has(antes)) {
      // Prefixo DETRAN (I, N, R, E) — descarta e extrai marca do restante
      // "I/FIAT SIENA EL 1.4 FLEX" → depois = "FIAT SIENA EL 1.4 FLEX"
      const tokens = depois.split(' ');
      return {
        marca: tokens[0]?.trim() || null,
        modelo: tokens.slice(1).join(' ').trim() || null,
      };
    }

    // Antes da barra é a sigla da marca (VW, CHEV, FIAT, etc.)
    return {
      marca: antes || null,
      modelo: depois || null,
    };
  }

  // ── Caso 2: separado só por espaço ────────────────────────────────────────
  // Tenta identificar marcas compostas: "LAND ROVER", "KIA MOTORS", etc.
  if (texto.includes(' ')) {
    const tokens = texto.split(' ');

    // Testa 2 tokens como marca composta primeiro, depois 1 token
    for (let n = Math.min(2, tokens.length - 1); n >= 1; n--) {
      const candidata = tokens.slice(0, n).join(' ');
      if (MAPA_MARCAS[candidata] || n === 1) {
        return {
          marca: candidata || null,
          modelo: tokens.slice(n).join(' ').trim() || null,
        };
      }
    }
  }

  // ── Caso 3: só uma palavra ─────────────────────────────────────────────────
  return { marca: texto, modelo: null };
}

function montarRespostaPadrao(result, placaLimpa) {
  const brandModel = pick(result, ['BrandModel', 'brandModel', 'MarcaModelo']);
  const { marca, modelo } = separarMarcaModelo(brandModel);

  const ano = extrairAno(
    pick(result, ['ModelYear', 'modelYear', 'AnoModelo']),
    pick(result, ['ManufactureYear', 'manufactureYear', 'AnoFabricacao'])
  );

  return {
    placa: pick(result, ['LicensePlate', 'licensePlate']) || placaLimpa,
    marca: normalizarMarca(marca) || null,
    modelo: modelo || null,
    ano
  };
}

// Tenta chamar a Exato até `tentativas` vezes antes de desistir
async function consultarExatoComRetry(placaLimpa, tentativas = 3) {
  const url = process.env.EXATO_VEHICLES_URL;
  const token = process.env.EXATO_TOKEN;

  if (!url || !token) {
    throw new Error('Credenciais da Exato não configuradas');
  }

  let ultimoErro = null;

  for (let i = 1; i <= tentativas; i++) {
    try {
      const response = await axios.post(
        url,
        { token, license_plate: placaLimpa, restrictions: false },
        { headers: { 'Content-Type': 'application/json' }, timeout: 8000 }
      );
      return response.data;
    } catch (err) {
      ultimoErro = err;
      console.warn(`Exato tentativa ${i}/${tentativas} falhou:`, err.message);
    }
  }

  throw ultimoErro;
}

async function buscarVeiculoPorPlaca(placa) {
  const placaLimpa = limparPlaca(placa);

  if (placaLimpa.length !== 7) {
    throw new Error('Placa inválida');
  }

  try {
    const data = await consultarExatoComRetry(placaLimpa);
    const result = data?.Result;

    if (!result || typeof result !== 'object') {
      return mockLocal[placaLimpa] || null;
    }

    const veiculo = montarRespostaPadrao(result, placaLimpa);

    if (!veiculo.marca && !veiculo.modelo) {
      return mockLocal[placaLimpa] || null;
    }

    return veiculo;
  } catch (error) {
    console.error('ERRO EXATO:', error.response?.data || error.message || error);

    if (error.message === 'Credenciais da Exato não configuradas') {
      return mockLocal[placaLimpa] || null;
    }

    return mockLocal[placaLimpa] || null;
  }
}

module.exports = { buscarVeiculoPorPlaca };
