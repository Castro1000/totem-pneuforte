const { buscarMedidasPorVeiculo } = require('./vehicleMeasureService');

/**
 * Busca pneus compatíveis no banco local, tratando o resultado e adicionando
 * metadados de produtos. Nunca escolhe uma medida sozinha quando há mais de
 * uma candidata — repassa a confiança calculada pelo vehicleMeasureService.
 */
async function buscarPneusCompativeis({ marca, modelo, versao, ano }) {
  // Lógica de Limpeza da Versão: extrai apenas a palavra-chave que identifica
  // a versão no banco de dados (os registros manuais são cadastrados assim).
  let versaoLimpa = versao;
  if (versao) {
    const v = versao.toUpperCase();
    if (v.includes('EXCLUSIVE')) versaoLimpa = 'EXCLUSIVE';
    else if (v.includes('UNIQUE')) versaoLimpa = 'UNIQUE';
    else if (v.includes('ADVANCE')) versaoLimpa = 'ADVANCE';
    else if (v.includes('SENSE')) versaoLimpa = 'SENSE';
    else if (v.includes('V-DRIVE')) versaoLimpa = 'V-DRIVE';
  }

  console.log(`[TIRE_SERVICE] Buscando no banco local: Marca=${marca}, Modelo=${modelo}, Versao=${versaoLimpa}, Ano=${ano}`);

  const resultado = await buscarMedidasPorVeiculo({ marca, modelo, versao: versaoLimpa, ano });

  if (!resultado.encontrado) return { encontrado: false };

  if (resultado.confianca === 'baixa') {
    return { encontrado: true, confianca: 'baixa', candidatos: resultado.candidatos };
  }

  const pneus = resultado.medidas.map((item, index) => ({
    id: index + 1,
    medida: item.medida,
    tipo: item.tipo,
    prioridade: item.prioridade,
    observacao: item.observacao,
    fonte: 'banco',
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

  return { encontrado: true, confianca: 'alta', pneus };
}

module.exports = {
  buscarPneusCompativeis
};
