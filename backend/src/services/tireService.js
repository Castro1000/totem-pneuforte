const { buscarMedidasPorVeiculo } = require('./vehicleMeasureService');

/**
 * Busca pneus compatíveis tratando o resultado e adicionando metadados de produtos
 */
async function buscarPneusCompativeis({ codigo_fipe, marca, modelo, versao, ano }) {
  
  // 1. Lógica de Limpeza da Versão:
  // Extraímos apenas a palavra-chave que identifica a versão no seu banco de dados
  let versaoLimpa = versao;
  if (versao) {
    const v = versao.toUpperCase();
    if (v.includes('EXCLUSIVE')) versaoLimpa = 'EXCLUSIVE';
    else if (v.includes('UNIQUE')) versaoLimpa = 'UNIQUE';
    else if (v.includes('ADVANCE')) versaoLimpa = 'ADVANCE';
    else if (v.includes('SENSE')) versaoLimpa = 'SENSE';
    else if (v.includes('V-DRIVE')) versaoLimpa = 'V-DRIVE';
  }

  // LOG PARA DEPURAÇÃO: Ajuda a ver no painel do Render o que exatamente está sendo pesquisado
  console.log(`[DEBUG_TIRE_SERVICE] Iniciando busca: Marca=${marca}, Modelo=${modelo}, Versao=${versaoLimpa}, Ano=${ano}`);

  const medidas = await buscarMedidasPorVeiculo({
    codigo_fipe,
    marca,
    modelo,
    versao: versaoLimpa, // Passamos a versão limpa para o service de banco
    ano
  });

  // LOG PARA DEPURAÇÃO: Verifica se o banco retornou algo
  console.log(`[DEBUG_TIRE_SERVICE] Medidas encontradas no banco: ${medidas ? medidas.length : 'NULO'}`);

  if (!medidas || medidas.length === 0) {
    return [];
  }

  return medidas.map((item, index) => ({
    id: index + 1,
    medida: item.medida,
    tipo: item.tipo,
    prioridade: item.prioridade,
    observacao: item.observacao,
    produtos: [
      {
        marca: 'DUNLOP',
        modelo: `Linha ${item.medida}`,
        descricao: item.tipo === 'ideal'
          ? 'Medida ideal para seu veículo'
          : 'Opção compatível para seu veículo'
      },
      {
        marca: 'XBRI',
        modelo: `Linha ${item.medida}`,
        descricao: 'Boa aderência e economia'
      }
    ]
  }));
}

module.exports = {
  buscarPneusCompativeis
};