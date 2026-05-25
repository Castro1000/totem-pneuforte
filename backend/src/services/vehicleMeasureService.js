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
  console.log("--- INICIANDO BUSCA DE VEÍCULO BLINDADA ---");
  if (!marca || !modelo || !ano) return [];

  const marcaNormalizada = normalizeText(marca);
  const modeloNormalizado = normalizeText(modelo).trim();
  const versaoNormalizada = versao ? normalizeText(versao).trim() : '';
  const anoNumero = Number(ano);

  // Ordenação que força registros COM medida para o topo
  const orderBase = `
    ORDER BY 
      (vm.medida IS NULL OR vm.medida = '') ASC,
      CASE WHEN vm.tipo = 'ideal' THEN 0 ELSE 1 END,
      vm.prioridade ASC
    LIMIT 1
  `;

  const condicaoAno = `(? BETWEEN v.ano_inicio AND v.ano_fim OR ? = v.ano_inicio)`;

  // --- 1. BUSCA POR CÓDIGO FIPE ---
  if (codigo_fipe) {
    const rows = await executarBusca(
      `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
              vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'fipe' AS match_tipo
       FROM veiculos v
       INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
       WHERE v.codigo_fipe = ? AND v.ativo = 1 AND vm.ativo = 1 AND vm.medida IS NOT NULL AND vm.medida != ''
       ${orderBase}`, [codigo_fipe]
    );
    if (rows.length > 0) return rows;
  }

  // --- 2. BUSCA POR MODELO E ANO (O mais importante) ---
  // Removi os CONCATs complexos e simplifiquei para evitar erro de correspondência
  const rows = await executarBusca(
    `SELECT v.id AS veiculo_id, v.codigo_fipe, v.marca, v.modelo, v.versao, vm.id AS veiculo_medida_id, 
            vm.medida, vm.tipo, vm.prioridade, vm.observacao, 'modelo_ano' AS match_tipo
     FROM veiculos v
     INNER JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
     WHERE TRIM(UPPER(v.marca)) = TRIM(UPPER(?)) 
       AND TRIM(UPPER(v.modelo)) = TRIM(UPPER(?))
       AND ${condicaoAno} 
       AND v.ativo = 1 AND vm.ativo = 1
       AND vm.medida IS NOT NULL AND vm.medida != ''
     ${orderBase}`,
    [marcaNormalizada, modeloNormalizado, anoNumero, anoNumero]
  );
  if (rows.length > 0) return rows;

  console.warn("DETETIVE_FIPE: Nenhuma medida encontrada. Parâmetros:", { marca, modelo, ano });
  return [];
}

module.exports = { buscarMedidasPorVeiculo };