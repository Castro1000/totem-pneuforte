const db = require('../config/db');

async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  console.log("--- BUSCA DEPURADA: MÚLTIPLOS ONIX ---");

  if (!marca || !modelo || !ano) return [];

  try {
    // Buscamos qualquer ONIX que tenha a medida preenchida e esteja ativo
    // Removemos o LIMIT 1 para que o sistema possa listar as opções disponíveis
    const sql = `
      SELECT 
        v.id AS veiculo_id, 
        v.marca, 
        v.modelo, 
        v.versao, 
        vm.id AS veiculo_medida_id, 
        vm.medida, 
        vm.tipo, 
        vm.prioridade, 
        vm.observacao
      FROM veiculos v
      INNER JOIN veiculo_medidas vm ON v.id = vm.veiculo_id
      WHERE (TRIM(v.marca) IN ('CHEVROLET', 'GM - CHEVROLET'))
        AND TRIM(UPPER(v.modelo)) = TRIM(UPPER(?))
        AND ? BETWEEN v.ano_inicio AND v.ano_fim
        AND v.ativo = 1 
        AND vm.ativo = 1
        AND vm.medida IS NOT NULL 
        AND vm.medida != ''
      ORDER BY vm.prioridade ASC
    `;

    const [rows] = await db.execute(sql, [modelo, ano]);
    
    console.log("TOTAL DE REGISTROS ENCONTRADOS:", rows.length);

    return rows.map((row) => ({
      id: row.veiculo_medida_id,
      veiculo_id: row.veiculo_id,
      marca: row.marca,
      modelo: row.modelo,
      versao: row.versao,
      medida: row.medida,
      tipo: row.tipo,
      prioridade: row.prioridade,
      observacao: row.observacao,
      match_tipo: 'busca_aberta'
    }));

  } catch (error) {
    console.error("ERRO CRÍTICO NA BUSCA:", error);
    return [];
  }
}

module.exports = { buscarMedidasPorVeiculo };