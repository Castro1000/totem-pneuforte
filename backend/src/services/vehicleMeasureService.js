const db = require('../config/db');

async function buscarMedidasPorVeiculo({ codigo_fipe, marca, modelo, versao, ano }) {
  console.log("--- BUSCA DINÂMICA: FILTRANDO POR MARCA, MODELO, ANO E VERSÃO ---");
  console.log(`Recebido -> Marca: ${marca} | Modelo: ${modelo} | Versão: ${versao} | Ano: ${ano}`);

  if (!marca || !modelo || !ano) return [];

  try {
    // Iniciamos a query base
    let sql = `
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
      WHERE TRIM(UPPER(v.marca)) = TRIM(UPPER(?))
        AND TRIM(UPPER(v.modelo)) = TRIM(UPPER(?))
        AND ? BETWEEN v.ano_inicio AND v.ano_fim
        AND v.ativo = 1 
        AND vm.ativo = 1
        AND vm.medida IS NOT NULL 
        AND vm.medida != ''
    `;

    const params = [marca, modelo, ano];

    // Se a versão for enviada, adicionamos o filtro LIKE para maior precisão
    if (versao && versao.trim() !== '') {
      sql += ` AND TRIM(UPPER(v.versao)) LIKE TRIM(UPPER(?))`;
      params.push(`%${versao}%`);
    }

    sql += ` ORDER BY vm.prioridade ASC`;

    // Executa a busca
    const [rows] = await db.execute(sql, params);
    
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
      match_tipo: 'busca_dinamica'
    }));

  } catch (error) {
    console.error("ERRO CRÍTICO NA BUSCA:", error);
    return [];
  }
}

module.exports = { buscarMedidasPorVeiculo };