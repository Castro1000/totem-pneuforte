const db = require('../config/db');

// Busca no banco local. Nunca "chuta" entre versões diferentes: se a versão
// foi informada, exige bater exatamente; se não foi informada (ou não achou
// nada com ela) e restarem medidas diferentes entre si pro mesmo marca/modelo/ano,
// devolve confiança baixa com todas as candidatas em vez de escolher uma.
async function buscarMedidasPorVeiculo({ marca, modelo, versao, ano }) {
  if (!marca || !modelo || !ano) return { encontrado: false };

  try {
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

    if (versao && versao.trim() !== '') {
      sql += ` AND TRIM(UPPER(v.versao)) = TRIM(UPPER(?))`;
      params.push(versao.trim());
    }

    sql += ` ORDER BY vm.prioridade ASC`;

    const [rows] = await db.execute(sql, params);
    console.log(`[BANCO LOCAL] ${rows.length} registro(s) para ${marca} ${modelo} ${ano} (versão: ${versao || 'não informada'})`);

    if (rows.length === 0) return { encontrado: false };

    const medidasDistintas = [...new Set(rows.map((r) => r.medida))];

    if (medidasDistintas.length === 1) {
      return {
        encontrado: true,
        confianca: 'alta',
        medidas: rows.map((row) => ({
          id: row.veiculo_medida_id,
          veiculo_id: row.veiculo_id,
          marca: row.marca,
          modelo: row.modelo,
          versao: row.versao,
          medida: row.medida,
          tipo: row.tipo,
          prioridade: row.prioridade,
          observacao: row.observacao,
          match_tipo: 'banco_local',
        })),
      };
    }

    return { encontrado: true, confianca: 'baixa', candidatos: medidasDistintas };
  } catch (error) {
    console.error('ERRO CRÍTICO NA BUSCA (banco local):', error);
    return { encontrado: false };
  }
}

module.exports = { buscarMedidasPorVeiculo };
