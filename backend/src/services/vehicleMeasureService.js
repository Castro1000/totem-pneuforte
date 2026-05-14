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

  // Primeira palavra do modelo — ex: "NIVUS CL TSI" → "NIVUS"
  const modeloPrimeiraPalavra = modeloNormalizado.split(' ')[0];

  
  const orderBase = `
    ORDER BY
      CASE 
        WHEN vm.tipo = 'ideal' THEN 0 
        WHEN vm.tipo = 'original' THEN 1
        WHEN vm.tipo = 'opcional' THEN 2
        ELSE 3 
      END,
      vm.prioridade ASC
    LIMIT 5
  `;

  // CORREÇÃO CRÍTICA DA MATEMÁTICA: Multiplica o ano decimal por 1000 para bater com o inteiro enviado pelo Totem
  // Substitua a condicaoAno por esta, que é mais segura para ambos os formatos:
  const condicaoAno = `
    (? BETWEEN v.ano_inicio AND v.ano_fim 
    OR ? BETWEEN ROUND(v.ano_inicio * 1000) AND ROUND(v.ano_fim * 1000)
    OR ? = v.ano_inicio)
  `;

// E nos parâmetros das queries, repita o anoNumero 3 vezes para suprir os "?"
  // 1. Por código FIPE (mais preciso)
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

  // 2. Por marca + modelo (flexível) + versão (flexível) + ano
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
        -- Mudança aqui: usamos LIKE para o modelo também, prevenindo erros de prefixo
        AND (UPPER(v.modelo) LIKE CONCAT('%', UPPER(?), '%') OR UPPER(?) LIKE CONCAT('%', UPPER(v.modelo), '%'))
        AND (
          UPPER(v.versao) LIKE UPPER(?) 
          OR UPPER(?) LIKE CONCAT('%', UPPER(v.versao), '%')
          OR REPLACE(UPPER(v.versao), ' ', '') LIKE CONCAT('%', REPLACE(UPPER(?), ' ', ''), '%')
        )
        AND ${condicaoAno}
        AND v.ativo = 1
        AND vm.ativo = 1
      ${orderBase}
      `,
      [
        marcaNormalizada,
        modeloNormalizado, modeloNormalizado, // Para o LIKE duplo do modelo
        `%${versaoNormalizada}%`,
        versaoNormalizada,
        versaoNormalizada,
        anoNumero
      ]
    );

    if (rows.length) return rows;
  }
  // 3. Por marca + modelo exato + ano
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
      AND ${condicaoAno}
      AND v.ativo = 1
      AND vm.ativo = 1
    ${orderBase}
    `,
    [marcaNormalizada, modeloNormalizado, anoNumero]
  );

  if (rows.length) return rows;

  // 4. Fallback — primeira palavra do modelo
  if (modeloPrimeiraPalavra && modeloPrimeiraPalavra !== modeloNormalizado) {
    const rowsParcial = await executarBusca(
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
        'modelo_parcial' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE UPPER(v.marca) = UPPER(?)
        AND UPPER(v.modelo) = UPPER(?)
        AND ${condicaoAno}
        AND v.ativo = 1
        AND vm.ativo = 1
      ${orderBase}
      `,
      [marcaNormalizada, modeloPrimeiraPalavra, anoNumero]
    );

    if (rowsParcial.length) return rowsParcial;
  }

  // 5. Fallback — modelo com espaço no lugar de hífen
  const tokens = modeloNormalizado.split(' ');
  if (tokens.length >= 2) {
    const modeloComHifen = tokens.slice(0, 2).join('-');
    if (modeloComHifen !== modeloNormalizado) {
      const rowsHifen = await executarBusca(
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
          'modelo_hifen' AS match_tipo
        FROM veiculos v
        INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
        WHERE UPPER(v.marca) = UPPER(?)
          AND UPPER(v.modelo) = UPPER(?)
          AND ${condicaoAno}
          AND v.ativo = 1
          AND vm.ativo = 1
        ${orderBase}
        `,
        [marcaNormalizada, modeloComHifen, anoNumero]
      );

      if (rowsHifen.length) return rowsHifen;
    }
  }

  return [];
}

module.exports = {
  buscarMedidasPorVeiculo
};