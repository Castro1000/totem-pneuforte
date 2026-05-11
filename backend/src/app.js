const express = require('express');
const cors = require('cors');
const totemRoutes = require('./routes/totemRoutes');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/totem', totemRoutes);

module.exports = app;