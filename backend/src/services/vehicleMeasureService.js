const db = require('../config/db');

async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  console.log("--- BUSCA DINÂMICA: FILTRANDO POR MARCA, MODELO, ANO E VERSÃO ---");
  console.log(`Recebido -> Marca: ${marca} | Modelo: ${modelo} | Versão: ${versao} | Ano: ${ano}`);

  if (!marca || !modelo || !ano) return [];

  try {
    const baseSQL = `
      SELECT 
        v.id AS veiculo_id, 
        v.marca, v.modelo, v.versao, 
        vm.id AS veiculo_medida_id, 
        vm.medida, vm.tipo, vm.prioridade, vm.observacao
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON v.id = vm.veiculo_id
      WHERE TRIM(UPPER(v.marca)) = TRIM(UPPER(?))
        AND TRIM(UPPER(v.modelo)) = TRIM(UPPER(?))
        AND ? BETWEEN v.ano_inicio AND v.ano_fim
        AND v.ativo = 1 
        AND vm.ativo = 1
        AND vm.medida IS NOT NULL 
        AND vm.medida != ''
    `;

    const orderSQL = ` ORDER BY 
      CASE 
        WHEN v.versao LIKE '%EXCLUSIVE%' THEN 1
        WHEN v.versao LIKE '%UNIQUE%' THEN 2
        WHEN v.versao LIKE '%ADVANCE%' THEN 3
        WHEN v.versao LIKE '%SENSE%' THEN 4
        ELSE 5
      END ASC,
      vm.prioridade ASC`;

    // ── TENTATIVA 1: com versão ──────────────────────────────────────────────
    if (versao && versao.trim() !== '') {
      const sql1 = baseSQL + ` AND TRIM(UPPER(v.versao)) LIKE TRIM(UPPER(?))` + orderSQL;
      const [rows1] = await db.execute(sql1, [marca, modelo, ano, `%${versao}%`]);
      console.log("TOTAL DE REGISTROS ENCONTRADOS (com versão):", rows1.length);
      if (rows1.length > 0) return formatarResultados(rows1);
    }

    // ── TENTATIVA 2: sem versão (versao=null ou qualquer versão) ─────────────
    const sql2 = baseSQL + orderSQL;
    const [rows2] = await db.execute(sql2, [marca, modelo, ano]);
    console.log("TOTAL DE REGISTROS ENCONTRADOS (sem versão):", rows2.length);
    if (rows2.length > 0) return formatarResultados(rows2);

    return [];

  } catch (error) {
    console.error("ERRO CRÍTICO NA BUSCA:", error);
    return [];
  }
}

function formatarResultados(rows) {
  // Deduplica por medida
  const mapa = new Map();
  for (const row of rows) {
    if (!mapa.has(row.medida)) mapa.set(row.medida, row);
  }
  return Array.from(mapa.values()).map(row => ({
    id: row.veiculo_medida_id,
    veiculo_id: row.veiculo_id,
    marca: row.marca,
    modelo: row.modelo,
    versao: row.versao,
    medida: row.medida,
    tipo: row.tipo,
    prioridade: row.prioridade,
    observacao: row.observacao,
    match_tipo: 'busca_dinamica'
  }));
}

module.exports = { buscarMedidasPorVeiculo };
