const axios = require('axios');

const mockLocal = {
  ABC1D23: { placa: 'ABC1D23', marca: 'FIAT', modelo: 'STRADA', versao: 'FREEDOM 1.3 FLEX', ano: 2022, combustivel: 'FLEX' },
  // ... (mantenha os outros mocks como estão)
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
};

const PREFIXOS_DETRAN = new Set(['I', 'N', 'R', 'E']);

function normalizarMarca(marca) {
  if (!marca) return marca;
  const upper = marca.toUpperCase().trim();
  return MAPA_MARCAS[upper] || marca;
}

// ─────────────────────────────────────────────────────────────────────────────
// separarMarcaModelo (CORRIGIDA: Extrai Marca, Modelo e Versão)
// ─────────────────────────────────────────────────────────────────────────────
function separarMarcaModelo(brandModel = '') {
  const texto = String(brandModel || '').toUpperCase().trim();
  if (!texto) return { marca: null, modelo: null, versao: null };

  let marca = null, modelo = null, versao = null;

  if (texto.includes('/')) {
    const barraIdx = texto.indexOf('/');
    const antes = texto.slice(0, barraIdx).trim();
    const depois = texto.slice(barraIdx + 1).trim();

    if (PREFIXOS_DETRAN.has(antes)) {
      const tokens = depois.split(' ');
      marca = tokens[0]?.trim();
      modelo = tokens[1]?.trim();
      versao = tokens.slice(2).join(' '); // Captura o restante como versão
    } else {
      marca = antes;
      const tokens = depois.split(' ');
      modelo = tokens[0]?.trim();
      versao = tokens.slice(1).join(' '); // Captura o restante como versão
    }
  } else {
    const tokens = texto.split(' ');
    marca = tokens[0];
    modelo = tokens[1];
    versao = tokens.slice(2).join(' '); // Captura o restante como versão
  }

  return { marca, modelo, versao };
}

function montarRespostaPadrao(result, placaLimpa) {
  const brandModel = pick(result, ['BrandModel', 'brandModel', 'MarcaModelo']);
  const { marca, modelo, versao } = separarMarcaModelo(brandModel);
  const ano = extrairAno(pick(result, ['ModelYear', 'modelYear', 'AnoModelo']), pick(result, ['ManufactureYear', 'manufactureYear', 'AnoFabricacao']));

  return {
    placa: pick(result, ['LicensePlate', 'licensePlate']) || placaLimpa,
    marca: normalizarMarca(marca) || null,
    modelo: modelo || null,
    versao: versao || null, // Versão agora é enviada!
    ano
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
    return veiculo;
  } catch (error) {
    return mockLocal[placaLimpa] || null;
  }
}

module.exports = { buscarVeiculoPorPlaca };