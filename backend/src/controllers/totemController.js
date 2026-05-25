const db = require('../config/db');
const axios = require('axios');
const { buscarVeiculoPorPlaca } = require('../services/plateProvider');
const { buscarPneusCompativeis } = require('../services/tireService');

const WHEEL_SIZE_KEY = process.env.WHEEL_SIZE_KEY || '3c20bfc74ecd98718e60dfbc5648e757';
const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const REGION = 'ladm';

const MARCA_MAP = {
  'AUDI': 'audi', 'BMW': 'bmw', 'BYD': 'byd', 'CHEVROLET': 'chevrolet', 'GM - CHEVROLET': 'chevrolet',
  'CITROËN': 'citroen', 'CITROEN': 'citroen', 'DODGE': 'dodge', 'FIAT': 'fiat', 'FORD': 'ford',
  'HONDA': 'honda', 'HYUNDAI': 'hyundai', 'JEEP': 'jeep', 'KIA': 'kia', 'KIA MOTORS': 'kia',
  'LAND ROVER': 'land-rover', 'MERCEDES-BENZ': 'mercedes-benz', 'MITSUBISHI': 'mitsubishi',
  'NISSAN': 'nissan', 'PEUGEOT': 'peugeot', 'RAM': 'ram', 'RENAULT': 'renault', 'SUBARU': 'subaru',
  'SUZUKI': 'suzuki', 'TOYOTA': 'toyota', 'VW - VOLKSWAGEN': 'volkswagen', 'VOLKSWAGEN': 'volkswagen',
  'GWM': 'haval', 'HAVAL': 'haval',
};

const BMW_MODELO_MAP = {
  '116IA': '1-series', '118I': '1-series', '118IA': '1-series', '120I': '1-series', '120IA': '1-series',
  '125I': '1-series', '130I': '1-series', '135IA': '1-series', '218I': '2-series', '220I': '2-series',
  '225I': '2-series', '316': '3-series', '316I': '3-series', '318I': '3-series', '318IA': '3-series',
  '320I': '3-series', '320IA': '3-series', '323I': '3-series', '325I': '3-series', '328I': '3-series',
  '330I': '3-series', '335I': '3-series', 'M3': 'm3', 'M340I': '3-series', '420I': '4-series',
  '428I': '4-series', '430I': '4-series', '435IA': '4-series', 'M4': 'm4', 'M440I': '4-series',
  '520I': '5-series', '525I': '5-series', '528I': '5-series', '530I': '5-series', '535I': '5-series',
  '540I': '5-series', '545IA': '5-series', '550IA': '5-series', 'M5': 'm5', '640I': '6-series',
  '645CI': '6-series', '650I': '6-series', 'M6': 'm6', '730I': '7-series', '740I': '7-series',
  '750I': '7-series', '760IL': '7-series', '840CI': '8-series', '850I': '8-series', 'M8': 'm8',
  'X1': 'x1', 'X2': 'x2', 'X3': 'x3', 'X4': 'x4', 'X5': 'x5', 'X6': 'x6', 'X7': 'x7', 'Z3': 'z3',
  'Z4': 'z4', 'I3': 'i3', 'I4': 'i4', 'I5': 'i5', 'I7': 'i7', 'I8': 'i8', 'IX': 'ix', 'IX1': 'ix1',
  'IX2': 'ix2', 'IX3': 'ix3', 'M2': 'm2', 'M1': 'm1',
};

function normalizarModelo(modelo) { return modelo.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''); }
function extrairMedida(tireFull) { if (!tireFull) return null; const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/); return match ? match[1] : tireFull.split(' ')[0]; }

async function buscarMedidasWheelSize({ marca, modelo, ano, versao }) {
  try {
    const marcaUpper = (marca || '').trim().toUpperCase();
    const marcaSlug = MARCA_MAP[marcaUpper];
    if (!marcaSlug) return null;
    let modeloSlug = (marcaSlug === 'bmw') ? (BMW_MODELO_MAP[(modelo || '').trim().toUpperCase()] || normalizarModelo(modelo)) : normalizarModelo(modelo || '');
    const response = await axios.get(WHEEL_SIZE_URL, { params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY }, timeout: 8000 });
    const data = response.data?.data || [];
    if (!data.length) return null;
    const medidasOE = new Set(), medidasAlternativas = new Set(), versaoUpper = (versao || '').toUpperCase();
    for (const item of data) {
      const levels = (item.trim_levels || []).map(l => l.toUpperCase());
      const trimUpper = (item.trim || '').toUpperCase();
      if (levels.some(l => versaoUpper.includes(l)) || versaoUpper.includes(trimUpper)) {
        for (const wheel of (item.wheels || [])) {
          const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
          if (medida) wheel.is_stock ? medidasOE.add(medida) : medidasAlternativas.add(medida);
        }
      }
    }
    const pneus = []; let idx = 1;
    medidasOE.forEach(medida => pneus.push({ id: idx++, medida, tipo: 'original', prioridade: 1, observacao: 'Medida original de fábrica (OE)', fonte: 'wheel-size' }));
    medidasAlternativas.forEach(medida => { if (!medidasOE.has(medida)) pneus.push({ id: idx++, medida, tipo: 'alternativa', prioridade: 2, observacao: 'Medida alternativa compatível', fonte: 'wheel-size' }); });
    return pneus;
  } catch (error) { return null; }
}

function limparTexto(valor) { return String(valor || '').trim().toUpperCase(); }

async function registrarConsultaTotem({ origem, placa, marca, modelo, versao, ano, veiculo_id, medida_recomendada, status, observacao, req }) {
  try {
    await db.execute(`INSERT INTO consultas_toten (origem, placa, marca, modelo, versao, ano, veiculo_id, medida_recomendada, status, observacao, ip_origem, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [origem, placa || null, marca || null, modelo || null, versao || null, ano || null, veiculo_id || null, medida_recomendada || null, status, observacao, req?.ip, req?.headers?.['user-agent']]);
  } catch (err) { console.error('ERRO LOG:', err); }
}

async function buscarPorPlaca(req, res) {
  try {
    const { placa } = req.body;
    if (!placa) return res.status(400).json({ erro: 'Placa obrigatória' });
    const veiculo = await buscarVeiculoPorPlaca(placa);
    if (!veiculo) {
      await registrarConsultaTotem({ origem: 'placa', placa, status: 'nao_encontrado', observacao: 'Placa não encontrada', req });
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    let pneus = await buscarMedidasWheelSize({ marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano, versao: veiculo.versao });
    let fonte = 'wheel-size';

    if (!pneus || pneus.length === 0) {
      pneus = await buscarPneusCompativeis({ ...veiculo });
      fonte = 'banco';
    }

    await registrarConsultaTotem({ origem: 'placa', placa, marca: veiculo.marca, modelo: veiculo.modelo, versao: veiculo.versao, ano: veiculo.ano, medida_recomendada: pneus?.[0]?.medida, status: 'encontrado', observacao: `Fonte: ${fonte}`, req });
    res.json({ veiculo, pneus: pneus || [], fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados' });
  } catch (error) { return res.status(500).json({ erro: 'Erro ao consultar placa' }); }
}

async function buscarMedidaVeiculo(req, res) {
  try {
    const { marca, modelo, versao, ano } = req.body;
    if (!marca || !modelo || !ano) return res.status(400).json({ erro: 'Obrigatórios' });

    let pneus = await buscarMedidasWheelSize({ marca, modelo, ano, versao });
    let fonte = 'wheel-size';

    if (!pneus || pneus.length === 0) {
      pneus = await buscarPneusCompativeis({ marca, modelo, versao, ano });
      fonte = 'banco';
    }

    await registrarConsultaTotem({ origem: 'modelo', marca, modelo, versao, ano, medida_recomendada: pneus?.[0]?.medida, status: pneus?.length ? 'encontrado' : 'nao_encontrado', observacao: `Busca manual - Fonte: ${fonte}`, req });
    res.json({ encontrado: pneus && pneus.length > 0, pneus: pneus || [], fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados' });
  } catch (error) { return res.status(500).json({ erro: 'Erro' }); }
}

module.exports = { buscarPorPlaca, buscarMedidaVeiculo };