const db = require('../config/db');
const { buscarVeiculoPorPlaca } = require('../services/plateProvider');
const { buscarPneusCompativeis } = require('../services/tireService');
const wheelSizeService = require('../services/wheelSizeService');

// ─── NORMALIZAÇÃO DE VERSÃO DA EXATO ─────────────────────────────────────────
function normalizarVersaoExato(versao) {
  if (!versao) return versao;
  const mapa = {
    '10': '1.0', '12': '1.2', '13': '1.3', '14': '1.4',
    '16': '1.6', '18': '1.8', '20': '2.0', '22': '2.2',
    '24': '2.4', '25': '2.5', '28': '2.8', '30': '3.0',
    '32': '3.2', '35': '3.5', '40': '4.0',
  };
  return mapa[versao.trim()] || versao;
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

// ─── BACKGROUND ──────────────────────────────────────────────────────────────
function salvarERegistrarEmBackground({ veiculo, pneus, candidatos, placa, origem, req, fonte }) {
  Promise.resolve()
    .then(async () => {
      const veiculoId = await salvarVeiculoConsultado(veiculo);
      const status = pneus?.length ? 'encontrado' : 'nao_encontrado';
      const observacao = pneus?.length
        ? `Consulta por ${origem} — medida encontrada via ${fonte || 'banco'}`
        : candidatos?.length
          ? `Consulta por ${origem} — ambíguo (${fonte || 'wheel-size'}), candidatos: ${candidatos.join(' / ')}`
          : `Consulta por ${origem} — medida não encontrada`;
      await registrarConsultaTotem({
        origem, placa: placa || null,
        codigo_fipe: veiculo.codigo_fipe, marca: veiculo.marca, modelo: veiculo.modelo,
        versao: veiculo.versao, ano: veiculo.ano, combustivel: veiculo.combustivel,
        veiculo_id: veiculoId, medida_recomendada: pneus?.[0]?.medida || null,
        status, observacao, req
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

    if (veiculo.versao) {
      const versaoNorm = normalizarVersaoExato(veiculo.versao.trim());
      if (versaoNorm !== veiculo.versao) {
        console.log(`[PLACA] Versão normalizada: "${veiculo.versao}" → "${versaoNorm}"`);
        veiculo.versao = versaoNorm;
      }
    }

    let resultado = null;
    let fonte = 'wheel-size';

    if (!wheelSizeService.versaoForcaBanco(veiculo.versao)) {
      resultado = await wheelSizeService.resolverMedidaComConfianca({
        marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano, versao: veiculo.versao
      });
      if (resultado?.encontrado && resultado.confianca === 'alta') {
        wheelSizeService.gravarCacheAltaConfianca({
          marca: veiculo.marca, modelo: veiculo.modelo, ano: veiculo.ano, versao: veiculo.versao, pneus: resultado.pneus
        }).catch(err => console.error('[CACHE buscarPorPlaca]', err.message));
      }
    }

    // Wheel-Size não achou nenhum dado (marca fora de cobertura, carro muito antigo, etc)
    // → cai pro banco local, agora só com match exato.
    if (!resultado || !resultado.encontrado) {
      const bancoResultado = await buscarPneusCompativeis({
        marca: veiculo.marca, modelo: veiculo.modelo, versao: veiculo.versao, ano: veiculo.ano
      });
      if (bancoResultado.encontrado) {
        resultado = bancoResultado;
        fonte = 'banco';
      }
    }

    if (!resultado || !resultado.encontrado) {
      res.json({ veiculo, confianca: null, pneus: [], fonte: null });
      salvarERegistrarEmBackground({ veiculo, pneus: [], placa, origem: 'placa', req, fonte: null });
      return;
    }

    const fonteLabel = fonte === 'wheel-size' ? 'Consulta Técnica Externa' : 'Dados Cadastrados';

    if (resultado.confianca === 'baixa') {
      res.json({ veiculo, confianca: 'baixa', candidatos: resultado.candidatos, pneus: [], fonte: fonteLabel });
      salvarERegistrarEmBackground({ veiculo, pneus: [], candidatos: resultado.candidatos, placa, origem: 'placa', req, fonte });
      return;
    }

    res.json({ veiculo, confianca: 'alta', pneus: resultado.pneus, fonte: fonteLabel });
    salvarERegistrarEmBackground({ veiculo, pneus: resultado.pneus, placa, origem: 'placa', req, fonte });

  } catch (error) {
    console.error('[PLACA] Erro:', error.message || error);
    if (error.message === 'Placa inválida') return res.status(400).json({ erro: 'Placa inválida' });
    return res.status(500).json({ erro: 'Erro ao consultar placa' });
  }
}

// ─── BUSCAR MEDIDA POR VEÍCULO (banco local — usado como último recurso) ────
async function buscarMedidaVeiculo(req, res) {
  try {
    const { marca, modelo, versao, ano, combustivel } = req.body;
    if (!marca || !modelo || !ano) return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });

    const veiculo = {
      marca: (marca || '').trim().toUpperCase(),
      modelo: (modelo || '').trim().toUpperCase(),
      versao: versao ? (versao || '').trim().toUpperCase() : null,
      ano: Number(ano),
      combustivel: combustivel || null
    };

    const resultado = await buscarPneusCompativeis({
      marca: veiculo.marca, modelo: veiculo.modelo, versao: veiculo.versao, ano: veiculo.ano
    });

    if (!resultado.encontrado) {
      Promise.resolve()
        .then(async () => {
          const veiculoId = await salvarVeiculoConsultado(veiculo);
          await registrarConsultaTotem({ origem: 'modelo', ...veiculo, veiculo_id: veiculoId, status: 'nao_encontrado', observacao: 'Medida não encontrada no banco local', req });
        })
        .catch(() => {});
      return res.status(404).json({ erro: 'Veículo não encontrado ou sem medida', pneus: [] });
    }

    if (resultado.confianca === 'baixa') {
      res.json({ encontrado: true, confianca: 'baixa', veiculo, candidatos: resultado.candidatos, fonte: 'Dados Cadastrados' });
      salvarERegistrarEmBackground({ veiculo, pneus: [], candidatos: resultado.candidatos, placa: null, origem: 'modelo', req, fonte: 'banco' });
      return;
    }

    res.json({ encontrado: true, confianca: 'alta', veiculo, pneus: resultado.pneus, fonte: 'Dados Cadastrados' });
    salvarERegistrarEmBackground({ veiculo, pneus: resultado.pneus, placa: null, origem: 'modelo', req, fonte: 'banco' });

  } catch (error) {
    console.error('[MEDIDA VEICULO] Erro:', error.message || error);
    Promise.resolve()
      .then(() => registrarConsultaTotem({ origem: 'modelo', marca: req.body?.marca, modelo: req.body?.modelo, versao: req.body?.versao, ano: req.body?.ano, status: 'erro', observacao: error.message || 'Erro ao buscar medida', req }))
      .catch(() => {});
    return res.status(500).json({ erro: 'Erro ao buscar medida do veículo' });
  }
}

module.exports = { buscarPorPlaca, buscarMedidaVeiculo };
