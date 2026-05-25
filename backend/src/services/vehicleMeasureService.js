const db = require('../config/db');

async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  console.log("--- BUSCA DEPURADA V4: COMPATIBILIDADE DE MARCA ---");
  console.log("Recebido -> Marca:", marca, "| Modelo:", modelo, "| Ano:", ano);

  if (!marca || !modelo || !ano) return [];

  try {
    // Esta query trata a marca de forma flexível: aceita GM ou CHEVROLET
    // usando um IN para buscar qualquer uma das variações existentes.
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
      LIMIT 1
    `;

    const [rows] = await db.execute(sql, [modelo, ano]);
    
    console.log("RESULTADO DA BUSCA:", rows);

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
      match_tipo: 'busca_blindada'
    }));

  } catch (error) {
    console.error("ERRO CRÍTICO NA BUSCA:", error);
    return [];
  }
}

module.exports = { buscarMedidasPorVeiculo };