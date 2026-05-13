const db = require('../config/db');
const { buscarVeiculoPorPlaca } = require('../services/plateProvider');
const { buscarPneusCompativeis } = require('../services/tireService');

function limparTexto(valor) {
  return String(valor || '').trim().toUpperCase();
}

function anoValido(ano) {
  const n = Number(ano);
  return !isNaN(n) && n >= 1900 && n <= 2050;
}

async function salvarVeiculoConsultado({
  codigo_fipe,
  marca,
  modelo,
  versao,
  ano,
  combustivel
}) {
  const anoNumero = Number(ano);

  // Rejeita anos inválidos — evita salvar 32000, 0, null, etc.
  if (!marca || !modelo || !anoValido(anoNumero)) {
    return null;
  }

  const marcaLimpa = limparTexto(marca);
  const modeloLimpo = limparTexto(modelo);
  const versaoLimpa = limparTexto(versao || 'VERSÃO NÃO INFORMADA');
  const combustivelLimpo = combustivel ? limparTexto(combustivel) : null;

  let veiculoExistente = [];

  if (codigo_fipe) {
    const [rows] = await db.execute(
      `
      SELECT id
      FROM veiculos
      WHERE codigo_fipe = ?
        AND ? BETWEEN ano_inicio AND ano_fim
      LIMIT 1
      `,
      [codigo_fipe, anoNumero]
    );

    veiculoExistente = rows;
  }

  if (!veiculoExistente.length) {
    const [rows] = await db.execute(
      `
      SELECT id
      FROM veiculos
      WHERE UPPER(marca) = UPPER(?)
        AND UPPER(modelo) = UPPER(?)
        AND UPPER(versao) = UPPER(?)
        AND ? BETWEEN ano_inicio AND ano_fim
      LIMIT 1
      `,
      [marcaLimpa, modeloLimpo, versaoLimpa, anoNumero]
    );

    veiculoExistente = rows;
  }

  if (veiculoExistente.length) {
    return veiculoExistente[0].id;
  }

  const [result] = await db.execute(
    `
    INSERT INTO veiculos
    (codigo_fipe, marca, modelo, versao, ano_inicio, ano_fim, combustivel, ativo)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `,
    [
      codigo_fipe || null,
      marcaLimpa,
      modeloLimpo,
      versaoLimpa,
      anoNumero,
      anoNumero,
      combustivelLimpo
    ]
  );

  return result.insertId;
}

async function registrarConsultaTotem({
  origem,
  placa,
  marca,
  modelo,
  versao,
  ano,
  combustivel,
  codigo_fipe,
  veiculo_id,
  medida_recomendada,
  status,
  observacao,
  req
}) {
  try {
    await db.execute(
      `
      INSERT INTO consultas_toten
      (
        origem,
        placa,
        codigo_fipe,
        marca,
        modelo,
        versao,
        ano,
        combustivel,
        veiculo_id,
        medida_recomendada,
        status,
        observacao,
        ip_origem,
        user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        origem,
        placa || null,
        codigo_fipe || null,
        marca || null,
        modelo || null,
        versao || null,
        ano || null,
        combustivel || null,
        veiculo_id || null,
        medida_recomendada || null,
        status || 'encontrado',
        observacao || null,
        req?.ip || null,
        req?.headers?.['user-agent'] || null
      ]
    );
  } catch (error) {
    console.error('ERRO AO REGISTRAR HISTÓRICO:', error.message || error);
  }
}

// Salva veículo e registra log em background — não bloqueia a resposta
function salvarERegistrarEmBackground({ veiculo, pneus, placa, origem, req }) {
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
          ? `Consulta por ${origem} com medida encontrada`
          : 'Veículo salvo, mas sem medida cadastrada',
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
        .then(() => registrarConsultaTotem({
          origem: 'placa',
          placa,
          status: 'nao_encontrado',
          observacao: 'Veículo não encontrado pela placa',
          req
        }))
        .catch(() => {});

      return res.status(404).json({ erro: 'Veículo não encontrado' });
    }

    const pneus = await buscarPneusCompativeis({
      codigo_fipe: veiculo.codigo_fipe,
      marca: veiculo.marca,
      modelo: veiculo.modelo,
      versao: veiculo.versao,
      ano: veiculo.ano
    });

    // Responde imediatamente — save e log vão para background
    res.json({ veiculo, pneus });

    salvarERegistrarEmBackground({ veiculo, pneus, placa, origem: 'placa', req });

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
    const {
      codigo_fipe,
      marca,
      modelo,
      versao,
      ano,
      combustivel
    } = req.body;

    if (!marca || !modelo || !ano) {
      return res.status(400).json({
        erro: 'Marca, modelo e ano são obrigatórios'
      });
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
            observacao: 'Veículo salvo, mas sem medida cadastrada',
            req
          });
        })
        .catch(() => {});

      return res.status(404).json({
        erro: 'Veículo salvo, mas ainda não possui medida cadastrada',
        veiculo_salvo: true,
        veiculo,
        pneus: []
      });
    }

    // Responde imediatamente
    res.json({
      encontrado: true,
      veiculo_salvo: true,
      veiculo,
      pneus
    });

    salvarERegistrarEmBackground({ veiculo, pneus, placa: null, origem: 'modelo', req });

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

    return res.status(500).json({
      erro: 'Erro ao buscar medida do veículo'
    });
  }
}

module.exports = {
  buscarPorPlaca,
  buscarMedidaVeiculo
};
