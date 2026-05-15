// routes/fipe.js
const express = require('express');
const router = express.Router();
const axios = require('axios');

const FIPE_BASE = 'https://parallelum.com.br/fipe/api/v1/carros';

router.get('/marcas', async (req, res) => {
  const { data } = await axios.get(`${FIPE_BASE}/marcas`);
  res.json(data);
});

router.get('/marcas/:marca/modelos', async (req, res) => {
  const { data } = await axios.get(`${FIPE_BASE}/marcas/${req.params.marca}/modelos`);
  res.json(data);
});

router.get('/marcas/:marca/modelos/:modelo/anos', async (req, res) => {
  const { data } = await axios.get(`${FIPE_BASE}/marcas/${req.params.marca}/modelos/${req.params.modelo}/anos`);
  res.json(data);
});

router.get('/marcas/:marca/modelos/:modelo/anos/:ano', async (req, res) => {
  const { data } = await axios.get(`${FIPE_BASE}/marcas/${req.params.marca}/modelos/${req.params.modelo}/anos/${req.params.ano}`);
  res.json(data);
});

module.exports = router;