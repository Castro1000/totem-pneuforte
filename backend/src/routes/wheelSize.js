const express = require('express');
const router = express.Router();
const wheelSizeService = require('../services/wheelSizeService');

// ─── TAXONOMIA WHEEL-SIZE (usado pelo seletor da Consulta Avançada) ─────────
// Toda essa cadeia usa os slugs da própria Wheel-Size de ponta a ponta —
// nenhuma tradução de vocabulário entre APIs diferentes, então não há como
// o passo de seleção gerar ambiguidade.

router.get('/marcas', async (req, res) => {
  try {
    const marcas = await wheelSizeService.buscarMakes();
    res.json(marcas);
  } catch (error) {
    console.error('[WHEEL-SIZE] Erro ao buscar marcas:', error.message);
    res.status(502).json({ erro: 'Erro ao consultar marcas na Wheel-Size' });
  }
});

router.get('/marcas/:marca/modelos', async (req, res) => {
  try {
    const modelos = await wheelSizeService.buscarModels(req.params.marca);
    res.json(modelos);
  } catch (error) {
    console.error('[WHEEL-SIZE] Erro ao buscar modelos:', error.message);
    res.status(502).json({ erro: 'Erro ao consultar modelos na Wheel-Size' });
  }
});

router.get('/marcas/:marca/modelos/:modelo/anos', async (req, res) => {
  try {
    const anos = await wheelSizeService.buscarYears(req.params.marca, req.params.modelo);
    res.json(anos);
  } catch (error) {
    console.error('[WHEEL-SIZE] Erro ao buscar anos:', error.message);
    res.status(502).json({ erro: 'Erro ao consultar anos na Wheel-Size' });
  }
});

router.get('/marcas/:marca/modelos/:modelo/anos/:ano/versoes', async (req, res) => {
  try {
    const versoes = await wheelSizeService.listarVersoesParaSelecao(
      req.params.marca, req.params.modelo, req.params.ano
    );
    res.json(versoes);
  } catch (error) {
    console.error('[WHEEL-SIZE] Erro ao buscar versões:', error.message);
    res.status(502).json({ erro: 'Erro ao consultar versões na Wheel-Size' });
  }
});

// ─── POST /api/wheel-size/buscar ──────────────────────────────────────────────
// Usado pela Consulta Avançada com `trimSlug` (seleção exata, sem ambiguidade)
// e também pode ser usado com marca/modelo/ano/versao em texto livre.
router.post('/buscar', async (req, res) => {
  try {
    const { marca, modelo, ano, versao, trimSlug, marcaSlug, modeloSlug } = req.body;

    if (trimSlug) {
      if (!marcaSlug || !modeloSlug || !ano) {
        return res.status(400).json({ erro: 'marcaSlug, modeloSlug e ano são obrigatórios com trimSlug' });
      }
      const resultado = await wheelSizeService.resolverMedidaPorTrimExato({ marcaSlug, modeloSlug, ano, trimSlug });
      if (!resultado.encontrado) return res.status(404).json({ erro: 'Versão não encontrada', pneus: [] });

      if (resultado.confianca === 'alta') {
        wheelSizeService.gravarCacheAltaConfianca({
          marca, modelo, ano, versao: versao || null, pneus: resultado.pneus
        }).catch(err => console.error('[CACHE-WS route]', err.message));
        return res.json({ encontrado: true, confianca: 'alta', fonte: 'wheel-size', veiculo: { marca, modelo, ano, versao }, pneus: resultado.pneus });
      }
      return res.json({ encontrado: true, confianca: 'baixa', fonte: 'wheel-size', veiculo: { marca, modelo, ano, versao }, candidatos: resultado.candidatos });
    }

    if (!marca || !modelo || !ano) {
      return res.status(400).json({ erro: 'Marca, modelo e ano são obrigatórios' });
    }

    const resultado = await wheelSizeService.resolverMedidaComConfianca({ marca, modelo, ano, versao });
    if (!resultado.encontrado) return res.status(404).json({ erro: 'Veículo não encontrado na Wheel-Size', pneus: [] });

    if (resultado.confianca === 'alta') {
      wheelSizeService.gravarCacheAltaConfianca({ marca, modelo, ano, versao, pneus: resultado.pneus })
        .catch(err => console.error('[CACHE-WS route]', err.message));
      return res.json({ encontrado: true, confianca: 'alta', fonte: 'wheel-size', veiculo: { marca, modelo, ano, versao }, pneus: resultado.pneus });
    }

    return res.json({ encontrado: true, confianca: 'baixa', fonte: 'wheel-size', veiculo: { marca, modelo, ano, versao }, candidatos: resultado.candidatos });

  } catch (error) {
    console.error('[WHEEL-SIZE ROUTE] ERRO:', error.message);
    if (error.response?.status === 429) {
      return res.status(429).json({ erro: 'Limite da API wheel-size atingido. Tente novamente amanhã.' });
    }
    return res.status(500).json({ erro: 'Erro ao consultar API wheel-size' });
  }
});

module.exports = router;
