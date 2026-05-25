const db = require('../config/db');
const axios = require('axios');
const { buscarVeiculoPorPlaca } = require('../services/plateProvider');
const { buscarPneusCompativeis } = require('../services/tireService');

const WHEEL_SIZE_KEY = process.env.WHEEL_SIZE_KEY || '3c20bfc74ecd98718e60dfbc5648e757';
const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const REGION = 'ladm';

// Mapeamento de marcas para slug da wheel-size
const MARCA_MAP = {
  'AUDI': 'audi', 'BMW': 'bmw', 'BYD': 'byd',
  'CHEVROLET': 'chevrolet', 'GM - CHEVROLET': 'chevrolet',
  'CITROËN': 'citroen', 'CITROEN': 'citroen',
  'DODGE': 'dodge', 'FIAT': 'fiat', 'FORD': 'ford',
  'HONDA': 'honda', 'HYUNDAI': 'hyundai', 'JEEP': 'jeep',
  'KIA': 'kia', 'KIA MOTORS': 'kia',
  'LAND ROVER': 'land-rover', 'MERCEDES-BENZ': 'mercedes-benz',
  'MITSUBISHI': 'mitsubishi', 'NISSAN': 'nissan',
  'PEUGEOT': 'peugeot', 'RAM': 'ram', 'RENAULT': 'renault',
  'SUBARU': 'subaru', 'SUZUKI': 'suzuki', 'TOYOTA': 'toyota',
  'VW - VOLKSWAGEN': 'volkswagen', 'VOLKSWAGEN': 'volkswagen',
  'GWM': 'haval', 'HAVAL': 'haval',
};

const BMW_MODELO_MAP = {
  '116IA': '1-series', '118I': '1-series', '118IA': '1-series',
  '120I': '1-series', '120IA': '1-series', '125I': '1-series',
  '130I': '1-series', '135IA': '1-series',
  '218I': '2-series', '220I': '2-series', '225I': '2-series',
  '316': '3-series', '316I': '3-series', '318I': '3-series',
  '318IA': '3-series', '320I': '3-series', '320IA': '3-series',
  '323I': '3-series', '325I': '3-series', '328I': '3-series',
  '330I': '3-series', '335I': '3-series', 'M3': 'm3', 'M340I': '3-series',
  '420I': '4-series', '428I': '4-series', '430I': '4-series',
  '435IA': '4-series', 'M4': 'm4', 'M440I': '4-series',
  '520I': '5-series', '525I': '5-series', '528I': '5-series',
  '530I': '5-series', '535I': '5-series', '540I': '5-series',
  '545IA': '5-series', '550IA': '5-series', 'M5': 'm5',
  '640I': '6-series', '645CI': '6-series', '650I': '6-series', 'M6': 'm6',
  '730I': '7-series', '740I': '7-series', '750I': '7-series', '760IL': '7-series',
  '840CI': '8-series', '850I': '8-series', 'M8': 'm8',
  'X1': 'x1', 'X2': 'x2', 'X3': 'x3', 'X4': 'x4',
  'X5': 'x5', 'X6': 'x6', 'X7': 'x7',
  'Z3': 'z3', 'Z4': 'z4',
  'I3': 'i3', 'I4': 'i4', 'I5': 'i5', 'I7': 'i7', 'I8': 'i8',
  'IX': 'ix', 'IX1': 'ix1', 'IX2': 'ix2', 'IX3': 'ix3',
  'M2': 'm2', 'M1': 'm1',
};

function normalizarModelo(modelo) {
  return modelo.toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/);
  return match ? match[1] : tireFull.split(' ')[0];
}

// Busca medidas na wheel-size API
async function buscarMedidasWheelSize({ marca, modelo, ano, versao }) {
  try {
    const marcaUpper = (marca || '').trim().toUpperCase();
    const marcaSlug = MARCA_MAP[marcaUpper];
    if (!marcaSlug) return null;

    let modeloSlug;
    if (marcaSlug === 'bmw') {
      const modeloUpper = (modelo || '').trim().toUpperCase();
      modeloSlug = BMW_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
    } else {
      modeloSlug = normalizarModelo(modelo || '');
    }

    console.log(`[WHEEL-SIZE] Consultando: make=${marcaSlug} model=${modeloSlug} year=${ano}`);

    const response = await axios.get(WHEEL_SIZE_URL, {
      params: { make: marcaSlug, model: modeloSlug, year: ano, region: REGION, user_key: WHEEL_SIZE_KEY },
      timeout: 8000
    });

    const data = response.data?.data || [];
    if (!data.length) return null;

    const medidasOE = new Set();
    const medidasAlternativas = new Set();
    const versaoUpper = (versao || '').toUpperCase();

    // Tenta match pela versão primeiro
    let encontrouVersao = false;
    if (versaoUpper) {
      for (const item of data) {
        const levels = (item.trim_levels || []).map(l => l.toUpperCase());
        const trimUpper = (item.trim || '').toUpperCase();
        const bate = levels.some(l => versaoUpper.includes(l) || l.includes(versaoUpper.split(' ')[0]))
          || versaoUpper.includes(trimUpper) || trimUpper.includes(versaoUpper.split(' ')[0]);

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

    // Se não achou pela versão, pega todas as OE
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

    if (medidasOE.size === 0 && medidasAlternativas.size === 0) return null;

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

    console.log(`[WHEEL-SIZE] Retornando ${pneus.length} medidas para ${marcaSlug} ${modeloSlug} ${ano}`);
    return pneus;

  } catch (error) {
    console.error('[WHEEL-SIZE] Erro:', error.message);
    return null;
  }
}

function limparTexto(valor) {
  return String(valor || '').trim().toUpperCase();
}

function anoValido(ano) {
  const n = Number(ano);
  return !isNaN(n) && n >= 1900 && n <= 2050;
}

async function salvarVeiculoConsultado({ codigo_fipe, marca, modelo, versao, ano, combustivel }) {
  const anoNumero = Number(ano);
  if (!marca || !modelo || !anoValido(anoNumero)) return null;

  const marcaLimpa = limparTexto(marca);
  const modeloLimpo = limparTexto(modelo);
  const versaoLimpa = limparTexto(versao || 'VERSÃO NÃO INFORMADA');

  let veiculoExistente = [];

  if (codigo_fipe) {
    const [rows] = await db.execute(
      `SELECT id FROM veiculos WHERE codigo_fipe = ? AND ? BETWEEN ano_inicio AND ano_fim LIMIT 1`,
      [codigo_fipe, anoNumero]
    );
    veiculoExistente = rows;
  }

  if (!veiculoExistente.length) {
    const [rows] = await db.execute(
      `SELECT id FROM veiculos WHERE UPPER(marca) = UPPER(?) AND UPPER(modelo) = UPPER(?) AND UPPER(versao) = UPPER(?) AND ? BETWEEN ano_inicio AND ano_fim LIMIT 1`,
      [marcaLimpa, modeloLimpo, versaoLimpa, anoNumero]
    );
    veiculoExistente = rows;
  }

  return veiculoExistente.length ? veiculoExistente[0].id : null;
}

async function registrarConsultaTotem({ origem, placa, marca, modelo, versao, ano, combustivel, codigo_fipe, veiculo_id, medida_recomendada, status, observacao, req }) {
  try {
    await db.execute(
      `INSERT INTO consultas_toten (origem, placa, codigo_fipe, marca, modelo, versao, ano, combustivel, veiculo_id, medida_recomendada, status, observacao, ip_origem, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [origem, placa || null, codigo_fipe || null, marca || null, modelo || null, versao || null, ano || null, combustivel || null, veiculo_id || null, medida_recomendada || null, status || 'encontrado', observacao || null, req?.ip || null, req?.headers?.['user-agent'] || null]
    );
  } catch (error) {
    console.error('ERRO AO REGISTRAR HISTÓRICO:', error.message || error);
  }
}

function salvarERegistrarEmBackground({ veiculo, pneus, placa, origem, req, fonte }) {
  Promise.resolve()
    .then(async () => {
      const veiculoId = await salvarVeiculoConsultado({
        codigo_fipe: veiculo.codigo_fipe,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        versao: veiculo.versao,
        ano: veiculo.ano,
        combustivel: veiculo.combustivel
      });

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
          : 'Veículo não encontrado com medida',
        req
      });
    })
    .catch((err) => {
      console.error('ERRO NO BACKGROUND SAVE:', err.message || err);
    });
}

// ─── buscarPorPlaca ───────────────────────────────────────────────────────────

async function buscarPorPlaca(req, res) {
  try {
    const { placa } = req.body;

    if (!placa) {
      return res.status(400).json({ erro: 'Placa obrigatória' });
    }

    const veiculo = await buscarVeiculoPorPlaca(placa);

    if (!veiculo) {
      Promise.resolve()
        .then(() => registrarConsultaTotem({ origem: 'placa', placa, status: 'nao_encontrado', observacao: 'Veículo não encontrado pela placa', req }))
        .catch(() => {});
      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    let pneus = null;
    let fonte = 'banco';

    // 1ª tentativa — wheel-size API
    pneus = await buscarMedidasWheelSize({
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      ano: veiculo.ano,
      versao: veiculo.versao
    });

    if (pneus && pneus.length > 0) {
      fonte = 'wheel-size';
      console.log(`[PLACA] Medida encontrada via wheel-size para ${veiculo.marca} ${veiculo.modelo} ${veiculo.ano}`);
    } else {
      // 2ª tentativa — banco local
      console.log(`[PLACA] wheel-size não encontrou, tentando banco local...`);
      pneus = await buscarPneusCompativeis({
        codigo_fipe: veiculo.codigo_fipe,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        versao: veiculo.versao,
        ano: veiculo.ano
      });
      fonte = 'banco';
    }

    res.json({ veiculo, pneus: pneus || [], fonte });

    salvarERegistrarEmBackground({ veiculo, pneus: pneus || [], placa, origem: 'placa', req, fonte });

  } catch (error) {
    console.error('ERRO NO CONTROLLER:', error.message || error);

    if (error.message === 'Placa inválida') {
      return res.status(400).json({ erro: 'Placa inválida' });
    }

    return res.status(500).json({ erro: 'Erro ao consultar placa' });
  }
}

// ─── buscarMedidaVeiculo ──────────────────────────────────────────────────────

async function buscarMedidaVeiculo(req, res) {
  try {
    const { codigo_fipe, marca, modelo, versao, ano, combustivel } = req.body;

    if (!marca || !modelo || !ano) {
      return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });
    }

    const veiculo = {
      codigo_fipe: codigo_fipe || null,
      marca: limparTexto(marca),
      modelo: limparTexto(modelo),
      versao: versao ? limparTexto(versao) : null,
      ano: Number(ano),
      combustivel: combustivel || null
    };

    const pneus = await buscarPneusCompativeis({
      codigo_fipe: veiculo.codigo_fipe,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      versao: veiculo.versao,
      ano: veiculo.ano
    });

    if (!pneus || pneus.length === 0) {
      Promise.resolve()
        .then(async () => {
          const veiculoId = await salvarVeiculoConsultado(veiculo);
          await registrarConsultaTotem({
            origem: 'modelo',
            codigo_fipe: veiculo.codigo_fipe,
            marca: veiculo.marca,
            modelo: veiculo.modelo,
            versao: veiculo.versao,
            ano: veiculo.ano,
            combustivel: veiculo.combustivel,
            veiculo_id: veiculoId,
            status: 'nao_encontrado',
            observacao: 'Veículo não encontrado com medida, log registrado',
            req
          });
        })
        .catch(() => {});

      return res.status(404).json({ erro: 'Veículo não encontrado ou sem medida', pneus: [] });
    }

    res.json({ encontrado: true, veiculo_salvo: true, veiculo, pneus });

    salvarERegistrarEmBackground({ veiculo, pneus, placa: null, origem: 'modelo', req, fonte: 'banco' });

  } catch (error) {
    console.error('ERRO AO BUSCAR MEDIDA POR VEÍCULO:', error.message || error);

    Promise.resolve()
      .then(() => registrarConsultaTotem({
        origem: 'modelo',
        marca: req.body?.marca,
        modelo: req.body?.modelo,
        versao: req.body?.versao,
        ano: req.body?.ano,
        codigo_fipe: req.body?.codigo_fipe,
        status: 'erro',
        observacao: error.message || 'Erro ao buscar medida do veículo',
        req
      }))
      .catch(() => {});

    return res.status(500).json({ erro: 'Erro ao buscar medida do veículo' });
  }
}

module.exports = { buscarPorPlaca, buscarMedidaVeiculo };
