const db = require('../config/db');
const { normalizeText } = require('../utils/normalize');

async function executarBusca(sql, params) {
  const [rows] = await db.execute(sql, params);

  return rows.map((row) => ({
    id: row.veiculo_medida_id,
    veiculo_id: row.veiculo_id,
    codigo_fipe: row.codigo_fipe,
    marca: row.marca,
    modelo: row.modelo,
    versao: row.versao,
    medida: row.medida,
    tipo: row.tipo,
    prioridade: row.prioridade,
    observacao: row.observacao,
    match_tipo: row.match_tipo
  }));
}

async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  if (!marca || !modelo || !ano) return [];

  const marcaNormalizada = normalizeText(marca);
  const modeloNormalizado = normalizeText(modelo);
  const versaoNormalizada = versao ? normalizeText(versao) : '';
  const anoNumero = Number(ano);

  const modeloPrimeiraPalavra = modeloNormalizado.split(' ')[0];

  const orderBase = `
    ORDER BY
      CASE WHEN vm.tipo = 'ideal' THEN 0 ELSE 1 END,
      vm.prioridade ASC
    LIMIT 5
  `;

  // CORREÇÃO AQUI: Multiplica o decimal do banco por 1000 para virar o ano correto (ex: 2.024 vira 2024)
  const condicaoAno = `
    (? BETWEEN ROUND(v.ano_inicio * 1000) AND ROUND(v.ano_fim * 1000))
  `;

  // 1. Por código FIPE
  if (codigo_fipe) {
    const rows = await executarBusca(
      `
      SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao,
             vm.id AS veiculo_medida_id, vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'codigo_fipe' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE v.codigo_fipe = ? AND v.ativo = 1 AND vm.ativo = 1
      ${orderBase}
      `,
      [codigo_fipe]
    );
    if (rows.length) return rows;
  }

  // 2. Por marca + modelo exato + versão + ano
  if (versaoNormalizada) {
    const rows = await executarBusca(
      `
      SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao,
             vm.id AS veiculo_medida_id, vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'versao' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE UPPER(v.marca) = UPPER(?)
        AND UPPER(v.modelo) = UPPER(?)
        AND (
          UPPER(v.versao) LIKE UPPER(?)
          OR UPPER(?) LIKE CONCAT('%', UPPER(v.versao), '%')
          OR REPLACE(UPPER(v.versao), '.', '') LIKE CONCAT('%', REPLACE(UPPER(?), '.', ''), '%')
        )
        AND ${condicaoAno}
        AND v.ativo = 1 AND vm.ativo = 1
      ${orderBase}
      `,
      [marcaNormalizada, modeloNormalizado, `%${versaoNormalizada}%`, versaoNormalizada, versaoNormalizada, anoNumero]
    );
    if (rows.length) return rows;
  }

  // 3. Por marca + modelo exato + ano
  const rows = await executarBusca(
    `
    SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao,
           vm.id AS veiculo_medida_id, vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'modelo_ano' AS match_tipo
    FROM veiculos v
    INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
    WHERE UPPER(v.marca) = UPPER(?) AND UPPER(v.modelo) = UPPER(?) AND ${condicaoAno} AND v.ativo = 1 AND vm.ativo = 1
    ${orderBase}
    `,
    [marcaNormalizada, modeloNormalizado, anoNumero]
  );
  if (rows.length) return rows;

  // 4. Fallback — primeira palavra do modelo
  if (modeloPrimeiraPalavra && modeloPrimeiraPalavra !== modeloNormalizado) {
    const rowsParcial = await executarBusca(
      `
      SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao,
             vm.id AS veiculo_medida_id, vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'modelo_parcial' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE UPPER(v.marca) = UPPER(?) AND UPPER(v.modelo) = UPPER(?) AND ${condicaoAno} AND v.ativo = 1 AND vm.ativo = 1
      ${orderBase}
      `,
      [marcaNormalizada, modeloPrimeiraPalavra, anoNumero]
    );
    if (rowsParcial.length) return rowsParcial;
  }

  return [];
}

module.exports = {
  buscarMedidasPorVeiculo
};