const express = require('express');
const router = express.Router();
const axios = require('axios');

const WHEEL_SIZE_KEY = process.env.WHEEL_SIZE_KEY || '3c20bfc74ecd98718e60dfbc5648e757';
const WHEEL_SIZE_URL = 'https://api.wheel-size.com/v2/search/by_model/';
const REGION = 'ladm';

// Mapeamento de marcas do banco para slug da API
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
  'GWM': 'haval',
  'HAVAL': 'haval',
};

// Mapeamento especial de modelos BMW
const BMW_MODELO_MAP = {
  '116IA': '1-series', '118I': '1-series', '118IA': '1-series',
  '120I': '1-series', '120IA': '1-series', '125I': '1-series',
  '130I': '1-series', '130IA': '1-series', '135IA': '1-series',
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
  '730I': '7-series', '740I': '7-series', '745IA': '7-series',
  '750I': '7-series', '760IL': '7-series',
  '840CI': '8-series', '850I': '8-series', 'M8': 'm8',
  'X1': 'x1', 'X2': 'x2', 'X3': 'x3', 'X4': 'x4',
  'X5': 'x5', 'X6': 'x6', 'X7': 'x7',
  'Z3': 'z3', 'Z4': 'z4',
  'I3': 'i3', 'I4': 'i4', 'I5': 'i5', 'I7': 'i7', 'I8': 'i8', 'IX': 'ix',
  'IX1': 'ix1', 'IX2': 'ix2', 'IX3': 'ix3',
  'M2': 'm2', 'M1': 'm1',
};

// GWM/HAVAL: modelo no banco é "HAVAL H6" ou similar
const GWM_MODELO_MAP = {
  'HAVAL H6': 'h6',
  'HAVAL JOLION': 'jolion',
  'HAVAL H5': 'h5',
  'HAVAL H9': 'h9',
  'HAVAL DARGO': 'dargo',
  'H6': 'h6',
  'JOLION': 'jolion',
};

function normalizarModelo(modelo) {
  return modelo
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '');
}

function extrairMedida(tireFull) {
  if (!tireFull) return null;
  const match = tireFull.match(/^(\d+\/\d+[A-Z]?\d+)/);
  return match ? match[1] : tireFull.split(' ')[0];
}

// POST /api/wheel-size/buscar
// Body: { marca, modelo, ano, versao }
router.post('/buscar', async (req, res) => {
  try {
    const { marca, modelo, ano, versao } = req.body;

    if (!marca || !modelo || !ano) {
      return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });
    }

    const marcaUpper = marca.trim().toUpperCase();
    const marcaSlug = MARCA_MAP[marcaUpper];

    if (!marcaSlug) {
      return res.status(404).json({
        erro: `Marca "${marca}" não mapeada na API wheel-size`,
        pneus: []
      });
    }

    // Define o slug do modelo
    let modeloSlug;
    if (marcaSlug === 'bmw') {
      const modeloUpper = modelo.trim().toUpperCase();
      modeloSlug = BMW_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
    } else if (marcaSlug === 'haval') {
      const modeloUpper = modelo.trim().toUpperCase();
      modeloSlug = GWM_MODELO_MAP[modeloUpper] || normalizarModelo(modelo);
    } else {
      modeloSlug = normalizarModelo(modelo);
    }

    console.log(`[WHEEL-SIZE] Consultando: make=${marcaSlug} model=${modeloSlug} year=${ano}`);

    const response = await axios.get(WHEEL_SIZE_URL, {
      params: {
        make: marcaSlug,
        model: modeloSlug,
        year: ano,
        region: REGION,
        user_key: WHEEL_SIZE_KEY
      },
      timeout: 10000
    });

    const data = response.data?.data || [];

    if (!data.length) {
      return res.status(404).json({
        erro: 'Veículo não encontrado na API wheel-size',
        pneus: []
      });
    }

    // Coleta todas as medidas OE (is_stock: true)
    const medidasOE = new Set();
    const medidasAlternativas = new Set();
    const versaoUpper = (versao || '').toUpperCase();

    // Tenta primeiro match pela versão
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

    // Se não encontrou pela versão, pega todas as medidas OE
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
      return res.status(404).json({
        erro: 'Nenhuma medida encontrada para este veículo',
        pneus: []
      });
    }

    // Monta resposta
    const pneus = [];
    let idx = 1;

    for (const medida of medidasOE) {
      pneus.push({
        id: idx++,
        medida,
        tipo: 'original',
        prioridade: 1,
        observacao: 'Medida original de fábrica (OE)',
        fonte: 'wheel-size'
      });
    }

    for (const medida of medidasAlternativas) {
      if (!medidasOE.has(medida)) {
        pneus.push({
          id: idx++,
          medida,
          tipo: 'alternativa',
          prioridade: 2,
          observacao: 'Medida alternativa compatível',
          fonte: 'wheel-size'
        });
      }
    }

    console.log(`[WHEEL-SIZE] Retornando ${pneus.length} medidas para ${marcaSlug} ${modeloSlug} ${ano}`);

    return res.json({
      encontrado: true,
      fonte: 'wheel-size',
      veiculo: { marca, modelo, ano, versao },
      pneus
    });

  } catch (error) {
    console.error('[WHEEL-SIZE] ERRO:', error.message);

    if (error.response?.status === 429) {
      return res.status(429).json({ erro: 'Limite da API wheel-size atingido. Tente novamente amanhã.' });
    }

    return res.status(500).json({ erro: 'Erro ao consultar API wheel-size' });
  }
});

module.exports = router;
