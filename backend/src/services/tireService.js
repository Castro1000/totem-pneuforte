const { buscarMedidasPorVeiculo } = require('./vehicleMeasureService');

async function buscarPneusCompativeis({ codigo_fipe, marca, modelo, versao, ano }) {
  const medidas = await buscarMedidasPorVeiculo({
    codigo_fipe,
    marca,
    modelo,
    versao,
    ano
  });

  if (!medidas.length) {
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