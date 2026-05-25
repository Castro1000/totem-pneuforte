const db = require('../config/db');
const { normalizeText } = require('../utils/normalize');

/**
 * Função auxiliar para executar a query e mapear os resultados
 */
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

/**
 * Busca principal de medidas
 */
async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  // LOG DE SINALIZAÇÃO DE VERSÃO
  console.log("--- INICIANDO BUSCA DE VEÍCULO v2026.05.25 ---");
  console.log("DETETIVE_FIPE: Recebido ->", { codigo_fipe, marca, modelo, versao, ano });

  if (!marca || !modelo || !ano) return [];

  const marcaNormalizada = normalizeText(marca);
  const modeloNormalizado = normalizeText(modelo);
  const versaoNormalizada = versao ? normalizeText(versao) : '';
  const anoNumero = Number(ano);

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

  // Mantendo a estrutura original que funciona no seu banco
  const condicaoAno = `
    (? BETWEEN v.ano_inicio AND v.ano_fim 
    OR ? BETWEEN ROUND(v.ano_inicio * 1000) AND ROUND(v.ano_fim * 1000)
    OR ? = v.ano_inicio)
  `;

  // --- 1. BUSCA POR CÓDIGO FIPE ---
  if (codigo_fipe) {
    const rows = await executarBusca(
      `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
              vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'codigo_fipe' AS match_tipo
       FROM veiculos v
       INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
       WHERE v.codigo_fipe = ? AND v.ativo = 1 AND vm.ativo = 1
       ${orderBase}`,
      [codigo_fipe]
    );

    if (rows.length > 0) {
      console.log("DETETIVE_FIPE: Sucesso via FIPE!");
      return rows;
    }
  }

  // --- 2. BUSCA POR VERSÃO (FLEXÍVEL) ---
  if (versaoNormalizada) {
    const rows = await executarBusca(
      `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
              vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'versao' AS match_tipo
       FROM veiculos v
       INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
       WHERE UPPER(v.marca) = UPPER(?)
         AND (UPPER(v.modelo) LIKE CONCAT('%', UPPER(?), '%') OR UPPER(?) LIKE CONCAT('%', UPPER(v.modelo), '%'))
         AND (
           UPPER(v.versao) LIKE UPPER(?) 
           OR UPPER(?) LIKE CONCAT('%', UPPER(v.versao), '%')
           OR REPLACE(UPPER(v.versao), ' ', '') LIKE CONCAT('%', REPLACE(UPPER(?), ' ', ''), '%')
         )
         AND ${condicaoAno}
         AND v.ativo = 1 AND vm.ativo = 1
       ${orderBase}`,
      [marcaNormalizada, modeloNormalizado, modeloNormalizado, `%${versaoNormalizada}%`, versaoNormalizada, versaoNormalizada, anoNumero, anoNumero, anoNumero]
    );
    if (rows.length) return rows;
  }

  // --- 3. BUSCA POR MODELO E ANO (AJUSTADO: Bidirecional para maior tolerância) ---
  const rows = await executarBusca(
      `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
              vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'modelo_ano' AS match_tipo
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
      WHERE UPPER(v.marca) = UPPER(?) 
        AND (UPPER(?) LIKE CONCAT(UPPER(v.modelo), '%') OR UPPER(v.modelo) LIKE CONCAT(UPPER(?), '%'))
        AND ${condicaoAno} 
        AND v.ativo = 1 AND vm.ativo = 1
      ${orderBase}`,
      [marcaNormalizada, modeloNormalizado, modeloNormalizado, anoNumero, anoNumero, anoNumero]
    );
  if (rows.length) return rows;

  // --- 4. FALLBACK - MODELO PARCIAL ---
  if (modeloPrimeiraPalavra) {
    const rowsParcial = await executarBusca(
      `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
              vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'modelo_parcial' AS match_tipo
       FROM veiculos v
       INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
       WHERE UPPER(v.marca) = UPPER(?) 
         AND UPPER(v.modelo) LIKE CONCAT(UPPER(?), '%')
         AND ${condicaoAno} AND v.ativo = 1 AND vm.ativo = 1
       ${orderBase}`,
      [marcaNormalizada, modeloPrimeiraPalavra, anoNumero, anoNumero, anoNumero]
    );
    if (rowsParcial.length) return rowsParcial;
  }

  console.warn("DETETIVE_FIPE: Nenhuma medida encontrada em nenhum fallback.");
  return [];
}

module.exports = {
  buscarMedidasPorVeiculo
};