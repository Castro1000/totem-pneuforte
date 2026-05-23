const mysql = require('mysql2/promise');
const { normalizeText } = require('./backend/src/utils/normalize'); // Ajuste o caminho se necessário
const fs = require('fs');

async function auditarMedidas() {
  // Configuração de conexão (use os mesmos dados do seu config/db.js)
  const connection = await mysql.createConnection({
    host: 'nozomi.proxy.rlwy.net',
    port: 42400,
    user: 'root',
    password: 'oQEzinsSMVOzfsWCYUcKyYfOiIXVkGDh',
    database: 'totem_pneuforte'
  });

  console.log('--- Iniciando Auditoria de Medidas ---');

  // Busca todos os veículos e suas medidas
  const [rows] = await connection.execute(`
    SELECT v.marca, v.modelo, vm.medida, vm.tipo
    FROM veiculos v
    JOIN veiculo_medidas vm ON vm.veiculo_id = v.id
  `);

  const mapa = {};

  rows.forEach(row => {
    const chave = `${normalizeText(row.marca)}|${normalizeText(row.modelo)}`;
    if (!mapa[chave]) {
      mapa[chave] = new Set();
    }
    mapa[chave].add(row.medida);
  });

  const divergencias = [];

  for (const chave in mapa) {
    if (mapa[chave].size > 1) {
      divergencias.push({
        veiculo: chave,
        medidas_encontradas: Array.from(mapa[chave])
      });
    }
  }

  // Salva o resultado em um arquivo para você analisar
  fs.writeFileSync('divergencias.json', JSON.stringify(divergencias, null, 2));
  
  console.log(`Auditoria concluída! ${divergencias.length} modelos possuem medidas conflitantes.`);
  console.log('Verifique o arquivo "divergencias.json" para ver os detalhes.');

  await connection.end();
}

auditarMedidas().catch(console.error);