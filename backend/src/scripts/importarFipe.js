require('dotenv').config();
const db = require('../config/db');
const fs = require('fs');
const path = require('path');

const API_FIPE = 'https://parallelum.com.br/fipe/api/v1/carros';
const FIPE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJhMGQzMWUyMy0wNmNmLTRhMDYtYjBkNy1iOGQ3YThlMTAyZTYiLCJlbWFpbCI6Iml2YW5laWNhc3RybzJAZ21haWwuY29tIiwic3RyaXBlU3Vic2NyaXB0aW9uSWQiOiJzdWJfMVRVVkFDQ1N2SXMwOHRJRWRxU0RIak1ZIiwiaWF0IjoxNzc4MTcyNzY2fQ.Lg0GRkO24onvNuFucvBCJsLg-KkTZAaOZQLCPB_gvkA';
const CHECKPOINT_FILE = path.join(__dirname, 'checkpoint.json');

const MARCAS_PERMITIDAS = [
  'Fiat', 'Jeep', 'VW - VolksWagen', 'GM - Chevrolet',
  'BYD', 'Hyundai', 'Honda', 'Toyota', 'Renault',
  'Ford', 'Nissan', 'Mitsubishi', 'Kia Motors',
  'Mercedes-Benz', 'BMW', 'Audi', 'Land Rover',
  'Subaru', 'Suzuki', 'Peugeot', 'Citroën'
];

function lerCheckpoint() {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'));
      console.log(`📍 Checkpoint: marca "${data.marcaNome}", modelo index ${data.modeloIndex}`);
      return data;
    }
  } catch {}
  return null;
}

function salvarCheckpoint(data) {
  try { fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2)); } catch {}
}

function limparCheckpoint() {
  try { if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE); } catch {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function tratarModelo(n = '') {
  const t = String(n).trim().replace(/\s+/g, ' '), p = t.split(' ');
  return { modelo: p[0] || t, versao: p.slice(1).join(' ') || 'VERSÃO ÚNICA' };
}

function tratarAno(n = '') {
  const t = String(n).trim(), p = t.split(' ');
  return { ano: Number(p[0]), combustivel: p.slice(1).join(' ') || null };
}

async function getJson(url, tentativa = 1) {
  try {
    const res = await fetch(url, {
      headers: {
        'X-Subscription-Token': FIPE_TOKEN,
        'Content-Type': 'application/json'
      }
    });

    if (res.status === 429) {
      const espera = 15000 * tentativa;
      console.log(`\n⛔ Rate limit. Aguardando ${espera / 1000}s...`);
      await sleep(espera);
      return getJson(url, tentativa + 1);
    }

    if (res.status >= 500) {
      if (tentativa > 3) throw new Error('Servidor indisponível');
      await sleep(5000);
      return getJson(url, tentativa + 1);
    }

    if (!res.ok) throw new Error(`Erro ${res.status}`);
    return res.json();
  } catch (error) {
    if (tentativa > 4) throw error;
    await sleep(8000);
    return getJson(url, tentativa + 1);
  }
}

async function importar() {
  console.log('='.repeat(60));
  console.log('🚀 IMPORTAÇÃO FIPE PRO — TOTEM PNEUFORTE');
  console.log('='.repeat(60));
  console.log('✅ Plano PRO — requests ilimitadas');
  console.log(`📋 ${MARCAS_PERMITIDAS.length} marcas para importar`);
  console.log('💡 Com checkpoint — continua de onde parou!');
  console.log('='.repeat(60) + '\n');

  try {
    await db.execute('SELECT 1');
    const [[dbInfo]] = await db.execute('SELECT DATABASE() as banco');
    console.log('🔍 Conectado no banco:', dbInfo.banco);
    console.log('✅ Banco conectado\n');
  } catch (error) {
    console.error('❌ Erro banco:', error.message);
    process.exit(1);
  }

  const checkpoint = lerCheckpoint();
  const cpValido = checkpoint &&
    MARCAS_PERMITIDAS.some(m => m.toUpperCase() === checkpoint.marcaNome?.toUpperCase());

  if (checkpoint && !cpValido) {
    console.log('⚠️  Checkpoint inválido — começando do zero\n');
    limparCheckpoint();
  }

  const marcas = await getJson(`${API_FIPE}/marcas`);
  const filtradas = marcas.filter(m =>
    MARCAS_PERMITIDAS.some(p => p.toUpperCase() === String(m.nome).toUpperCase().trim())
  );
  filtradas.sort((a, b) => {
    const ia = MARCAS_PERMITIDAS.findIndex(p => p.toUpperCase() === a.nome.toUpperCase());
    const ib = MARCAS_PERMITIDAS.findIndex(p => p.toUpperCase() === b.nome.toUpperCase());
    return ia - ib;
  });

  console.log(`✅ ${filtradas.length} marcas: ${filtradas.map(m => m.nome).join(', ')}\n`);

  let total = 0, ignorados = 0, erros = 0;
  const inicio = Date.now();

  let marcaStart = 0;
  if (cpValido) {
    const i = filtradas.findIndex(m => m.nome.toUpperCase() === checkpoint.marcaNome.toUpperCase());
    if (i >= 0) { marcaStart = i; console.log(`▶️  Continuando: ${filtradas[i].nome}\n`); }
  }

  for (let mi = marcaStart; mi < filtradas.length; mi++) {
    const marca = filtradas[mi];
    console.log(`\n${'='.repeat(40)}`);
    console.log(`🚗 [${mi + 1}/${filtradas.length}] MARCA: ${marca.nome}`);
    console.log('='.repeat(40));

    await sleep(500);

    let modelosData;
    try { modelosData = await getJson(`${API_FIPE}/marcas/${marca.codigo}/modelos`); }
    catch (e) { erros++; console.log(`❌ ${e.message}`); continue; }

    const modelos = modelosData.modelos || [];
    console.log(`📋 ${modelos.length} modelos`);

    let mStart = 0;
    if (cpValido && marca.nome.toUpperCase() === checkpoint.marcaNome.toUpperCase()) {
      mStart = checkpoint.modeloIndex || 0;
      if (mStart > 0) console.log(`▶️  Pulando para modelo ${mStart}`);
    }

    for (let moi = mStart; moi < modelos.length; moi++) {
      const modeloFipe = modelos[moi];
      salvarCheckpoint({
        marcaNome: marca.nome.toUpperCase(),
        marcaIndex: mi,
        modeloIndex: moi,
        modeloNome: modeloFipe.nome,
        totalInseridos: total
      });

      await sleep(400);

      let anos = [];
      try { anos = await getJson(`${API_FIPE}/marcas/${marca.codigo}/modelos/${modeloFipe.codigo}/anos`); }
      catch { erros++; continue; }

      process.stdout.write(`  [${moi + 1}/${modelos.length}] ${modeloFipe.nome} (${anos.length} anos)...`);
      let ins = 0;

      for (const anoFipe of anos) {
        await sleep(250);

        let detalhe;
        try {
          detalhe = await getJson(`${API_FIPE}/marcas/${marca.codigo}/modelos/${modeloFipe.codigo}/anos/${anoFipe.codigo}`);
        } catch { erros++; continue; }

        const mt = tratarModelo(detalhe.Modelo || modeloFipe.nome);
        const at = tratarAno(anoFipe.nome);
        if (!at.ano || at.ano < 1950) continue;

        try {
          await db.execute(
            `INSERT INTO veiculos (codigo_fipe,marca,modelo,versao,ano_inicio,ano_fim,combustivel,ativo)
             VALUES (?,?,?,?,?,?,?,1)
             ON DUPLICATE KEY UPDATE marca=VALUES(marca),modelo=VALUES(modelo),versao=VALUES(versao),
             ano_inicio=VALUES(ano_inicio),ano_fim=VALUES(ano_fim),combustivel=VALUES(combustivel),ativo=1`,
            [detalhe.CodigoFipe || null,
             String(detalhe.Marca || marca.nome).toUpperCase().trim(),
             String(mt.modelo).toUpperCase().trim(),
             String(mt.versao).toUpperCase().trim(),
             at.ano, at.ano, at.combustivel || null]
          );
          total++; ins++;
        } catch (e) {
          if (e.code === 'ER_DUP_ENTRY') ignorados++; else erros++;
        }
      }

      console.log(` ✅ ${ins} | Total: ${total}`);

      if ((moi + 1) % 100 === 0) {
        const elapsed = Math.round((Date.now() - inicio) / 60000);
        console.log(`\n📊 ${moi + 1}/${modelos.length} | ${total} inseridos | ${elapsed} min\n`);
      }
    }

    const elapsed = Math.round((Date.now() - inicio) / 60000);
    console.log(`\n✅ ${marca.nome} concluída | Total: ${total} | ${elapsed} min`);
  }

  limparCheckpoint();

  const totalMin = Math.round((Date.now() - inicio) / 60000);
  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log('='.repeat(60));
  console.log(`✅ Inseridos:  ${total}`);
  console.log(`⏭️  Ignorados:  ${ignorados}`);
  console.log(`❌ Erros:      ${erros}`);
  console.log(`⏱️  Tempo:      ${totalMin} min`);
  console.log('='.repeat(60));

  await db.end();
  process.exit(0);
}

importar().catch(e => { console.error('\n❌ ERRO FATAL:', e.message); process.exit(1); });
