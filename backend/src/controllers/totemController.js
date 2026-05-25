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

function normalizarModelo(modelo) { return modelo.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''); }
function extrairMedida(tireFull) { if (!tireFull) return null; const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/); return match ? match[1] : tireFull.split(' ')[0]; }

async function buscarMedidasWheelSize({ marca, modelo, ano, versao }) {
  try {
    const marcaSlug = MARCA_MAP[(marca || '').trim().toUpperCase()];
    if (!marcaSlug) return null;
    
    // LIMPEZA: Remove a marca do modelo caso a API envie "FIAT/TORO"
    let modeloLimpo = modelo.replace(/FIAT\//i, '').replace(/VW\//i, '').split(' ')[0];
    let modeloSlug = normalizarModelo(modeloLimpo);

    const response = await axios.get(WHEEL_SIZE_URL, { 
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY }, 
      timeout: 8000 
    });
    
    const data = response.data?.data || [];
    if (!data.length) return null;

    const medidasOE = new Set(), versaoUpper = (versao || '').toUpperCase();
    const semVersao = !versao || versao === 'undefined';

    for (const item of data) {
      const trimUpper = (item.trim || '').toUpperCase();
      const levels = (item.trim_levels || []).map(l => l.toUpperCase());
      const bate = semVersao ? true : (levels.some(l => versaoUpper.includes(l)) || versaoUpper.includes(trimUpper));

      if (bate) {
        for (const wheel of (item.wheels || [])) {
          const medida = extrairMedida(wheel.front?.tire_full || wheel.front?.tire);
          if (medida && wheel.is_stock) medidasOE.add(medida);
        }
        if (medidasOE.size > 0) break; 
      }
    }
    const pneus = []; let idx = 1;
    medidasOE.forEach(m => pneus.push({ id: idx++, medida: m, tipo: 'original', prioridade: 1, fonte: 'wheel-size' }));
    return pneus.length > 0 ? pneus : null;
  } catch (error) { return null; }
}

async function registrarConsultaTotem({ origem, placa, marca, modelo, versao, ano, status, observacao, req }) {
  try {
    await db.execute(`INSERT INTO consultas_toten (origem, placa, marca, modelo, versao, ano, status, observacao, ip_origem) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [origem, placa || null, marca || null, modelo || null, versao || null, ano || null, status, observacao, req?.ip]);
  } catch (err) { console.error(err); }
}

async function buscarPorPlaca(req, res) {
  try {
    const { placa } = req.body;
    if (!placa) return res.status(400).json({ erro: 'Placa obrigatória' });
    const veiculo = await buscarVeiculoPorPlaca(placa);
    if (!veiculo) return res.status(404).json({ erro: 'Veículo não encontrado' });

    // A versão aqui recebe o texto bruto da Exato (BrandModel)
    let pneus = await buscarMedidasWheelSize({ 
      marca: veiculo.marca, 
      modelo: veiculo.modelo, 
      ano: veiculo.ano, 
      versao: veiculo.modelo 
    });
    
    let fonte = pneus ? 'wheel-size' : 'banco';
    if (!pneus) pneus = await buscarPneusCompativeis({ ...veiculo });

    await registrarConsultaTotem({ origem: 'placa', placa, marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano, status: 'encontrado', observacao: `Fonte: ${fonte}`, req });
    res.json({ veiculo, pneus: pneus || [], fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados' });
  } catch (error) { return res.status(500).json({ erro: 'Erro interno' }); }
}

async function buscarMedidaVeiculo(req, res) {
  try {
    const { marca, modelo, versao, ano } = req.body;
    let pneus = await buscarMedidasWheelSize({ marca, modelo, ano, versao });
    let fonte = 'wheel-size';
    if (!pneus) {
      pneus = await buscarPneusCompativeis({ marca, modelo, versao, ano });
      fonte = 'banco';
    }
    res.json({ encontrados: true, pneus, fonte: fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados' });
  } catch (error) { return res.status(500).json({ erro: 'Erro' }); }
}

module.exports = { buscarPorPlaca, buscarMedidaVeiculo };