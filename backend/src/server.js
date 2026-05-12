if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const app = require('./app');
const db = require('./config/db');

const PORT = process.env.PORT || 3001;

async function aquecer() {
  try {
    await db.execute('SELECT 1');
    console.log('Conexão com o banco aquecida.');
  } catch (err) {
    console.warn('Aviso: não foi possível aquecer o banco:', err.message);
  }
}

app.listen(PORT, async () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  await aquecer();
});