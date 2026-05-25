const express = require('express');
const cors = require('cors');
const totemRoutes = require('./routes/totemRoutes');
const fipeRoutes = require('./routes/fipe');
const wheelSizeRoutes = require('./routes/wheelSize');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ ok: true });
});

app.use('/api/totem', totemRoutes);
app.use('/api/fipe', fipeRoutes);
app.use('/api/wheel-size', wheelSizeRoutes);

module.exports = app;
