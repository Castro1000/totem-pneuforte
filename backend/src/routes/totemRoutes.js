const express = require('express');
const router = express.Router();
const { buscarPorPlaca, buscarMedidaVeiculo } = require('../controllers/totemController');

// 🔵 JÁ EXISTENTE (NÃO MEXER)
router.post('/buscar-por-placa', buscarPorPlaca);

// 🟢 NOVA ROTA (CONSULTA POR MARCA/MODELO/ANO)
router.post('/buscar-medida-veiculo', buscarMedidaVeiculo);

module.exports = router;