const axios = require('axios');

const mockLocal = {
  ABC1D23: { placa: 'ABC1D23', marca: 'FIAT', modelo: 'STRADA', versao: 'FREEDOM 1.3 FLEX', ano: 2022, combustivel: 'FLEX' },
};

function limparPlaca(placa = '') { return String(placa).replace(/[^A-Z0-9]/gi, '').toUpperCase(); }

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== '') return obj[key];
  }
  return null;
}

function extrairAno(...valores) {
  for (const valor of valores) {
    const numero = Number(valor);
    if (!Number.isNaN(numero) && numero > 1900) return numero;
    const match = String(valor || '').match(/\d{4}/);
    if (match) return Number(match[0]);
  }
  return null;
}

const MAPA_MARCAS = {
  'VW': 'VW - VOLKSWAGEN', 'VOLKSWAGEN': 'VW - VOLKSWAGEN', 'GM': 'GM - CHEVROLET', 'CHEV': 'GM - CHEVROLET', 'CHEVROLET': 'GM - CHEVROLET',
  'KIA': 'KIA MOTORS', 'KIA MOTORS': 'KIA MOTORS', 'LAND-ROVER': 'LAND ROVER', 'LANDROVER': 'LAND ROVER', 'LAND ROVER': 'LAND ROVER',
  'MERCEDES': 'MERCEDES-BENZ', 'MERCEDES BENZ': 'MERCEDES-BENZ', 'MB': 'MERCEDES-BENZ', 'MITSU': 'MITSUBISHI', 'NIS': 'NISSAN',
  'PEU': 'PEUGEOT', 'REN': 'RENAULT', 'TOYT': 'TOYOTA', 'TOY': 'TOYOTA', 'HON': 'HONDA', 'HYU': 'HYUNDAI', 'CITR': 'CITROËN',
  'CITROEN': 'CITROËN', 'SUB': 'SUBARU', 'SUZ': 'SUZUKI',
  // ── Novos mapeamentos de abreviações da Exato ──
  'LR': 'LAND ROVER',          // LR = Land Rover
  'MMC': 'MITSUBISHI',         // MMC = Mitsubishi Motors Corporation
  'I': 'FIAT',                 // "I/FIAT ..." prefixo DETRAN importado
  'N': 'NISSAN',               // prefixo DETRAN
  'R': 'RENAULT',              // prefixo DETRAN
  'E': 'VOLKSWAGEN',           // prefixo DETRAN eventual
};

// Marcas que a Exato às vezes retorna como modelo (invertido)
const MARCAS_COMO_MODELO = new Set([
  'ONIX', 'UNO', 'CELTA', 'CORSA',
  'STRADA', 'TORO', 'ARGO', 'PULSE', 'CRONOS', 'MOBI',
]);

const PREFIXOS_DETRAN = new Set(['I', 'N', 'R', 'E']);

// ─── MODELOS COMPOSTOS (duas ou mais palavras) ────────────────────────────────
const MODELOS_COMPOSTOS = [
  'LAND CRUISER PRADO',
  'TIGUAN ALLSPACE',
  'DISCOVERY SPORT',
  'GRAND CHEROKEE',
  'COROLLA CROSS',
  'COROLLA ALTIS',
  'RANGE ROVER SPORT',
  'RANGE ROVER EVOQUE',
  'RANGE ROVER VELAR',
  'RANGE ROVER',
  'YARIS CROSS',
  'DUSTER OROCH',
  'SPACE CROSS',
  'SPACE FOX',
  'POLO TRACK',
  'GOLF GTI',
  'JETTA GLI',
  'JETTA VARIANT',
  'NOVO GOL',
  'NOVO VOYAGE',
  'NEW BEETLE',
  'GRAND SIENA',
  'LAND CRUISER',
  'SANTA FE',
  'GRAND I10',
  'CRETA GRAND',
  'RANGER RAPTOR',
  'BRONCO SPORT',
  'ECLIPSE CROSS',
  'PAJERO FULL',
  'PAJERO SPORT',
  'ONIX PLUS',
  'ONIX JOY',
  'ONIX ACTIV',
  'SPIN ACTIV',
  'BOLT EUV',
  'BOLT EV',
  'BLAZER EV',
  'EQUINOX EV',
  'HR V',
  'CR V',
  'WR V',
  'ZR V',
  'T CROSS',
  'RAV 4',
  'HB20S',
  'HB20X',
  'PULSE ABARTH',
  'PALIO ADVENTURE',
  'PALIO WEEKEND',
  'SIENA EL',
  'KA PLUS',
  'KA FREESTYLE',
  'MUSTANG MACH-E',
  'MUSTANG MACH 1',
  'TRANSIT CUSTOM',
  'SANDERO STEPWAY',
  'KANGOO EXPRESS',
  'KANGOO STEPWAY',
  'MEGANE E-TECH',
  'GRAND VITARA',
  'S CROSS',
  'IONIQ 5',
  'VELOSTER N',
  'OUTLANDER SPORT',
];

// Modelos conhecidos — primeira palavra é suficiente para identificar
const MODELOS_CONHECIDOS = new Set([
  'RENEGADE', 'COMPASS', 'COMMANDER', 'WRANGLER', 'GLADIATOR',
  'TORO', 'ARGO', 'CRONOS', 'PULSE', 'FASTBACK', 'STRADA', 'MOBI',
  'PALIO', 'SIENA', 'UNO', 'PUNTO', 'DOBLO', 'DUCATO', 'BRAVO',
  'ONIX', 'TRACKER', 'MONTANA', 'CRUZE', 'COBALT', 'SPIN', 'CELTA',
  'CLASSIC', 'CORSA', 'ZAFIRA', 'BLAZER', 'CAMARO', 'S10',
  'GOL', 'POLO', 'NIVUS', 'VIRTUS', 'SAVEIRO', 'AMAROK', 'TIGUAN',
  'TAOS', 'JETTA', 'FOX', 'CROSSFOX', 'SPACEFOX', 'PARATI', 'VOYAGE',
  'CIVIC', 'CITY', 'FIT', 'ACCORD',
  'COROLLA', 'HILUX', 'YARIS', 'ETIOS', 'FORTUNER', 'CAMRY',
  'HB20', 'CRETA', 'TUCSON', 'ELANTRA', 'AZERA',
  'KICKS', 'FRONTIER', 'VERSA', 'MARCH', 'SENTRA',
  'SANDERO', 'DUSTER', 'LOGAN', 'CAPTUR', 'KWID', 'KARDIAN',
  'RAMPAGE', 'RAM',
  'ASX', 'LANCER', 'OUTLANDER', 'PAJERO', 'L200',
]);

function normalizarMarca(marca) {
  if (!marca) return marca;
  const upper = marca.toUpperCase().trim();
  return MAPA_MARCAS[upper] || marca;
}

function separarMarcaModelo(brandModel = '') {
  const texto = String(brandModel || '').toUpperCase().trim();
  if (!texto) return { marca: null, modelo: null, versao: null };

  let marcaRaw = null, modelo = null, versao = null;
  let resto = texto;

  if (texto.includes('/')) {
    const barraIdx = texto.indexOf('/');
    const antes = texto.slice(0, barraIdx).trim();
    const depois = texto.slice(barraIdx + 1).trim();

    if (PREFIXOS_DETRAN.has(antes)) {
      const tokens = depois.split(' ');
      marcaRaw = tokens[0]?.trim();
      resto = tokens.slice(1).join(' ').trim();
    } else {
      marcaRaw = antes;
      resto = depois;
    }
  } else {
    const tokens = texto.split(' ');
    marcaRaw = tokens[0];
    resto = tokens.slice(1).join(' ').trim();
  }

  // Verifica modelos compostos (mais longo primeiro)
  modelo = null;
  versao = null;
  for (const mc of MODELOS_COMPOSTOS) {
    if (resto === mc || resto.startsWith(mc + ' ')) {
      modelo = mc;
      versao = resto.slice(mc.length).trim();
      break;
    }
  }

  // Se não achou modelo composto, pega primeira palavra
  if (!modelo) {
    const tokens = resto.split(' ');
    modelo = tokens[0]?.trim() || null;
    versao = tokens.slice(1).join(' ').trim();
  }

  // ── Casos onde Exato gruda versão no modelo (ex: "ONIX 14AT LT", "S10 LTZ DD4A") ──
  // Se o modelo contém espaço e a primeira palavra é um modelo conhecido,
  // separa o restante como versão
  if (modelo && modelo.includes(' ')) {
    const primeiraPalavra = modelo.split(' ')[0];
    if (MODELOS_CONHECIDOS.has(primeiraPalavra)) {
      const partes = modelo.split(' ');
      versao = partes.slice(1).join(' ') + (versao ? ' ' + versao : '');
      modelo = primeiraPalavra;
    }
  }

  // ── Caso especial: Exato retornou modelo como marca (ex: marca=ONIX modelo=PLUS) ──
  if (MARCAS_COMO_MODELO.has(marcaRaw)) {
    // Ex: BrandModel = "ONIX/PLUS 10TAT PR1" → marca real é GM, modelo=ONIX PLUS
    modelo = marcaRaw + (modelo ? ' ' + modelo : '');
    marcaRaw = 'GM - CHEVROLET'; // fallback genérico
  }

  // ── Abreviações de marcas não padrão da Exato ──
  // LR/RR → Land Rover / Range Rover
  if (marcaRaw === 'LR' && modelo === 'RR') {
    marcaRaw = 'LAND ROVER';
    modelo = 'RANGE ROVER';
  }

  return {
    marca: marcaRaw || null,
    modelo: modelo || null,
    versao: versao || null,
  };
}

function montarRespostaPadrao(result, placaLimpa) {
  const brandModel = pick(result, ['BrandModel', 'brandModel', 'MarcaModelo']);
  const { marca, modelo, versao } = separarMarcaModelo(brandModel);
  const ano = extrairAno(
    pick(result, ['ModelYear', 'modelYear', 'AnoModelo']),
    pick(result, ['ManufactureYear', 'manufactureYear', 'AnoFabricacao'])
  );

  return {
    placa: pick(result, ['LicensePlate', 'licensePlate']) || placaLimpa,
    marca: normalizarMarca(marca) || null,
    modelo: modelo || null,
    versao: versao || null,
    ano,
    combustivel: pick(result, ['Fuel', 'fuel', 'Combustivel']) || null,
  };
}

async function consultarExatoComRetry(placaLimpa, tentativas = 3) {
  const url = process.env.EXATO_VEHICLES_URL;
  const token = process.env.EXATO_TOKEN;
  if (!url || !token) throw new Error('Credenciais da Exato não configuradas');

  for (let i = 1; i <= tentativas; i++) {
    try {
      const response = await axios.post(url, { token, license_plate: placaLimpa, restrictions: false }, { headers: { 'Content-Type': 'application/json' }, timeout: 8000 });
      return response.data;
    } catch (err) { console.warn(`Exato tentativa ${i}/${tentativas} falhou.`); }
  }
  throw new Error('Falha ao consultar API Exato');
}

async function buscarVeiculoPorPlaca(placa) {
  const placaLimpa = limparPlaca(placa);
  if (placaLimpa.length !== 7) throw new Error('Placa inválida');

  try {
    const data = await consultarExatoComRetry(placaLimpa);
    const result = data?.Result;
    if (!result || typeof result !== 'object') return mockLocal[placaLimpa] || null;

    const veiculo = montarRespostaPadrao(result, placaLimpa);
    console.log(`[PLACA] Veículo extraído: ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano} versao=${veiculo.versao}`);
    return veiculo;
  } catch (error) {
    return mockLocal[placaLimpa] || null;
  }
}

module.exports = { buscarVeiculoPorPlaca };
