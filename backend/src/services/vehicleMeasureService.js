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

  const orderBase = `
    ORDER BY
      CASE WHEN vm.tipo = 'ideal' THEN 0 ELSE 1 END,
      vm.prioridade ASC
    LIMIT 5
  `;

  if (codigo_fipe) {
    const rows = await executarBusca(
      `
      SELECT
        v.id AS veiculo_id,
        v.codigo_fipe,
        v.marca,
        v.modelo,
        v.versao,
        vm.id AS veiculo_medida_id,
        vm.medida,
        vm.tipo,
        vm.prioridade,
        vm.observacao,
        'codigo_fipe' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE v.codigo_fipe = ?
        AND v.ativo = 1
        AND vm.ativo = 1
      ${orderBase}
      `,
      [codigo_fipe]
    );

    if (rows.length) return rows;
  }

  if (versaoNormalizada) {
    const rows = await executarBusca(
      `
      SELECT
        v.id AS veiculo_id,
        v.codigo_fipe,
        v.marca,
        v.modelo,
        v.versao,
        vm.id AS veiculo_medida_id,
        vm.medida,
        vm.tipo,
        vm.prioridade,
        vm.observacao,
        'versao' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE UPPER(v.marca) = UPPER(?)
        AND UPPER(v.modelo) = UPPER(?)
        AND (
          UPPER(v.versao) LIKE UPPER(?)
          OR UPPER(?) LIKE CONCAT('%', UPPER(v.versao), '%')
        )
        AND ? BETWEEN v.ano_inicio AND v.ano_fim
        AND v.ativo = 1
        AND vm.ativo = 1
      ${orderBase}
      `,
      [
        marcaNormalizada,
        modeloNormalizado,
        `%${versaoNormalizada}%`,
        versaoNormalizada,
        anoNumero
      ]
    );

    if (rows.length) return rows;
  }

  const rows = await executarBusca(
    `
    SELECT
      v.id AS veiculo_id,
      v.codigo_fipe,
      v.marca,
      v.modelo,
      v.versao,
      vm.id AS veiculo_medida_id,
      vm.medida,
      vm.tipo,
      vm.prioridade,
      vm.observacao,
      'modelo_ano' AS match_tipo
    FROM veiculos v
    INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
    WHERE UPPER(v.marca) = UPPER(?)
      AND UPPER(v.modelo) = UPPER(?)
      AND ? BETWEEN v.ano_inicio AND v.ano_fim
      AND v.ativo = 1
      AND vm.ativo = 1
    ${orderBase}
    `,
    [marcaNormalizada, modeloNormalizado, anoNumero]
  );

  return rows;
}

module.exports = {
  buscarMedidasPorVeiculo
};