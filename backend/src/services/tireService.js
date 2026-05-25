const { buscarMedidasPorVeiculo } = require('./vehicleMeasureService');

/**
 * Busca pneus compatíveis tratando o resultado e adicionando metadados de produtos
 */
async function buscarPneusCompativeis({ codigo_fipe, marca, modelo, versao, ano }) {
  // LOG PARA DEPURAÇÃO: Ajuda a ver no painel do Render o que exatamente está sendo pesquisado
  console.log(`[DEBUG_TIRE_SERVICE] Iniciando busca: Marca=${marca}, Modelo=${modelo}, Ano=${ano}`);

  const medidas = await buscarMedidasPorVeiculo({
    codigo_fipe,
    marca,
    modelo,
    versao,
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
        marca: 'PIRELLI',
        modelo: `Linha ${item.medida}`,
        descricao: item.tipo === 'ideal'
          ? 'Medida ideal para seu veículo'
          : 'Opção compatível para seu veículo'
      },
      {
        marca: 'GOODYEAR',
        modelo: `Linha ${item.medida}`,
        descricao: 'Boa aderência e economia'
      }
    ]
  }));
}

module.exports = {
  buscarPneusCompativeis
};