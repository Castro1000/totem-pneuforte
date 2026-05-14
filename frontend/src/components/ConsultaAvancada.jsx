import { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/consultaAvancada.css';

const LETRAS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z'
];

const NUMEROS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const API_FIPE = 'https://parallelum.com.br/fipe/api/v1/carros';
const API_BACKEND = `${import.meta.env.VITE_API_URL}/api/totem`;

function normalizarTexto(texto = '') {
  return String(texto).trim().replace(/\s+/g, ' ').toUpperCase();
}

function tratarModeloFipe(nomeModelo = '') {
  const texto = String(nomeModelo).trim().replace(/\s+/g, ' ');
  if (!texto) return { modeloBase: '', versao: 'VERSÃO NÃO INFORMADA' };
  const partes = texto.split(' ');
  return { modeloBase: partes[0] || texto, versao: partes.slice(1).join(' ') || 'VERSÃO ÚNICA' };
}

function tratarAnoFipe(nomeAno = '') {
  const texto = String(nomeAno).trim();
  if (!texto) return { anoNumero: '', combustivel: '' };
  const partes = texto.split(' ');
  return { anoNumero: partes[0] || texto, combustivel: partes.slice(1).join(' ') || '' };
}

function montarModelosBase(modelosFipe = []) {
  const mapa = new Map();
  modelosFipe.forEach((item) => {
    const tratado = tratarModeloFipe(item.nome);
    const chave = normalizarTexto(tratado.modeloBase);
    if (!chave) return;
    if (!mapa.has(chave)) {
      mapa.set(chave, { codigo: chave, nome: tratado.modeloBase, modelosOriginais: [] });
    }
    mapa.get(chave).modelosOriginais.push({ ...item, modeloBase: tratado.modeloBase, versao: tratado.versao });
  });
  return Array.from(mapa.values()).sort((a, b) => a.nome.localeCompare(b.nome));
}

function tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe }) {
  const anoTratado = tratarAnoFipe(ano?.nome);
  return {
    marca: marca?.nome || resultadoFipe?.Marca || '',
    modelo: modelo?.nome || '',
    versao: versao?.nome || '',
    ano: Number(anoTratado.anoNumero || resultadoFipe?.AnoModelo || 0),
    combustivel: anoTratado.combustivel || resultadoFipe?.Combustivel || '',
    codigo_fipe: resultadoFipe?.CodigoFipe || versao?.codigo_fipe || ''
  };
}

export default function ConsultaAvancada({ voltarInicio, teclaRef }) {
  // Etapa do seletor: marca → modelo → ano → versao → null (concluído)
  const [etapa, setEtapa] = useState('marca');
  const [seletorAberto, setSeletorAberto] = useState(true); // abre direto
  const [busca, setBusca] = useState('');

  const [marcas, setMarcas] = useState([]);
  const [modelosBase, setModelosBase] = useState([]);
  const [anos, setAnos] = useState([]);
  const [versoes, setVersoes] = useState([]);

  const [marca, setMarca] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [ano, setAno] = useState(null);
  const [versao, setVersao] = useState(null);
  const [resultadoFipe, setResultadoFipe] = useState(null);

  const [loading, setLoading] = useState(false);
  const [erroApi, setErroApi] = useState('');

  // Popup 1 — veículo confirmado
  const [popupVeiculo, setPopupVeiculo] = useState(false);
  // Popup 2 — medida
  const [popupMedida, setPopupMedida] = useState(false);

  const [loadingMedida, setLoadingMedida] = useState(false);
  const [erroMedida, setErroMedida] = useState('');
  const [resultadoMedidas, setResultadoMedidas] = useState(null);

  function tocarClique() {
    const audio = teclaRef?.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch { /* silencia */ }
  }

  const carregarMarcas = useCallback(async () => {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_FIPE}/marcas`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar marcas');
      setMarcas(data || []);
    } catch {
      setErroApi('Não foi possível carregar as marcas. Verifique a internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  async function carregarModelos(codigoMarca) {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_FIPE}/marcas/${codigoMarca}/modelos`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar modelos');
      setModelosBase(montarModelosBase(data?.modelos || []));
    } catch {
      setErroApi('Não foi possível carregar os modelos desta marca.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarAnosPorModeloBase(modeloBaseSelecionado) {
    try {
      setLoading(true);
      setErroApi('');
      const modelosRelacionados = modeloBaseSelecionado?.modelosOriginais || [];
      const mapaAnos = new Map();

      const resultados = await Promise.allSettled(
        modelosRelacionados.map((item) =>
          fetch(`${API_FIPE}/marcas/${marca.codigo}/modelos/${item.codigo}/anos`)
            .then((r) => r.ok ? r.json() : [])
            .then((listaAnos) => ({ item, listaAnos }))
            .catch(() => ({ item, listaAnos: [] }))
        )
      );

      resultados.forEach((res) => {
        if (res.status !== 'fulfilled') return;
        const { item, listaAnos } = res.value;
        (listaAnos || []).forEach((anoItem) => {
          const anoTratado = tratarAnoFipe(anoItem.nome);
          const chave = normalizarTexto(anoTratado.anoNumero);
          if (!chave) return;
          if (!mapaAnos.has(chave)) {
            mapaAnos.set(chave, { codigo: chave, nome: anoTratado.anoNumero, anosOriginais: [] });
          }
          mapaAnos.get(chave).anosOriginais.push({
            ...anoItem,
            codigoModelo: item.codigo,
            nomeModeloCompleto: item.nome,
            modeloBase: item.modeloBase,
            versao: item.versao
          });
        });
      });

      setAnos(Array.from(mapaAnos.values()).sort((a, b) => Number(b.nome) - Number(a.nome)));
    } catch {
      setErroApi('Não foi possível carregar os anos deste modelo.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarVersoesPorAno(anoSelecionado) {
    try {
      setLoading(true);
      setErroApi('');
      const anosOriginais = anoSelecionado?.anosOriginais || [];
      setVersoes(anosOriginais.map((item, index) => ({
        codigo: `${item.codigoModelo}-${item.codigo}-${index}`,
        codigoModelo: item.codigoModelo,
        codigoAno: item.codigo,
        nome: item.versao || item.nomeModeloCompleto,
        modeloCompleto: item.nomeModeloCompleto
      })));
    } catch {
      setErroApi('Não foi possível carregar as versões deste veículo.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarResultadoFinal(versaoSelecionada) {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(
        `${API_FIPE}/marcas/${marca.codigo}/modelos/${versaoSelecionada.codigoModelo}/anos/${versaoSelecionada.codigoAno}`
      );
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao consultar veículo');
      setResultadoFipe(data);
      // Fecha seletor e abre popup 1
      setSeletorAberto(false);
      setPopupVeiculo(true);
    } catch {
      setErroApi('Não foi possível consultar os dados finais do veículo.');
    } finally {
      setLoading(false);
    }
  }

  async function buscarMedidaIdeal() {
    try {
      tocarClique();
      setLoadingMedida(true);
      setErroMedida('');
      setResultadoMedidas(null);

      const veiculoTratado = tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe });

      const tentarBusca = async () => {
        const response = await fetch(`${API_BACKEND}/buscar-medida-veiculo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(veiculoTratado)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || 'Nenhuma medida encontrada para este veículo');
        return data;
      };

      let data;
      let ultimoErro;
      for (let i = 0; i < 3; i++) {
        try { data = await tentarBusca(); break; }
        catch (err) {
          ultimoErro = err;
          if (i < 2) await new Promise((r) => setTimeout(r, 1000));
        }
      }
      if (!data) throw ultimoErro;
      setResultadoMedidas(data);
      setPopupVeiculo(false);
      setPopupMedida(true);
    } catch (error) {
      setErroMedida(error.message || 'Erro ao buscar medida ideal');
    } finally {
      setLoadingMedida(false);
    }
  }

  function novaConsulta() {
    tocarClique();
    setEtapa('marca');
    setSeletorAberto(true);
    setBusca('');
    setMarca(null); setModelo(null); setAno(null); setVersao(null);
    setResultadoFipe(null); setResultadoMedidas(null);
    setModelosBase([]); setAnos([]); setVersoes([]);
    setErroApi(''); setErroMedida('');
    setPopupVeiculo(false); setPopupMedida(false);
    setLoadingMedida(false);
  }

  useEffect(() => { carregarMarcas(); }, [carregarMarcas]);

  const tituloSeletor = {
    marca: 'ESCOLHA A MARCA DO SEU CARRO',
    modelo: 'ESCOLHA O MODELO DO SEU CARRO',
    ano: 'ESCOLHA O ANO DO SEU CARRO',
    versao: 'ESCOLHA A VERSÃO DO SEU CARRO'
  };

  const placeholderSeletor = {
    marca: 'DIGITE A MARCA',
    modelo: 'DIGITE O MODELO',
    ano: 'DIGITE O ANO',
    versao: 'DIGITE A VERSÃO'
  };

  const opcoes = useMemo(() => {
    if (etapa === 'marca') return marcas;
    if (etapa === 'modelo') return modelosBase;
    if (etapa === 'ano') return anos;
    if (etapa === 'versao') return versoes;
    return [];
  }, [etapa, marcas, modelosBase, anos, versoes]);

  const opcoesFiltradas = useMemo(() => {
    const texto = busca.trim().toUpperCase();
    if (!texto) return [];
    return opcoes.filter((item) => String(item.nome).toUpperCase().includes(texto));
  }, [busca, opcoes]);

  async function escolher(item) {
    tocarClique();
    if (etapa === 'marca') {
      setMarca(item); setModelo(null); setAno(null); setVersao(null);
      setResultadoFipe(null); setModelosBase([]); setAnos([]); setVersoes([]);
      setBusca(''); setEtapa('modelo');
      await carregarModelos(item.codigo);
      return;
    }
    if (etapa === 'modelo') {
      setModelo(item); setAno(null); setVersao(null);
      setResultadoFipe(null); setAnos([]); setVersoes([]);
      setBusca(''); setEtapa('ano');
      await carregarAnosPorModeloBase(item);
      return;
    }
    if (etapa === 'ano') {
      setAno(item); setVersao(null);
      setResultadoFipe(null); setVersoes([]);
      setBusca(''); setEtapa('versao');
      await carregarVersoesPorAno(item);
      return;
    }
    if (etapa === 'versao') {
      setVersao(item); setBusca('');
      await carregarResultadoFinal(item);
    }
  }

  function digitar(valor) { tocarClique(); setBusca((prev) => `${prev}${valor}`.toUpperCase()); }
  function apagar() { tocarClique(); setBusca((prev) => prev.slice(0, -1)); }
  function limparBusca() { tocarClique(); setBusca(''); }

  const veiculoTratado = marca && modelo && ano && versao && resultadoFipe
    ? tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe })
    : null;

  const medidaPrincipal = resultadoMedidas?.pneus?.[0] || null;
  const outrasMedidas = resultadoMedidas?.pneus
    ?.slice(1)
    .filter((item, index, self) =>
      item.medida !== medidaPrincipal?.medida &&
      self.findIndex((m) => m.medida === item.medida) === index
    ) || [];

  const teclas = etapa === 'ano' ? NUMEROS : LETRAS;

  return (
    <div className="app tela-placa-entrada">
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />
      <div className="bg-consulta"></div>
      <div className="bg-consulta-overlay"></div>

      <button className="btn-voltar flutuante" onClick={voltarInicio}>Início</button>

      {/* =============================================
          SELETOR — overlay igual ao loading/popup da TelaConsulta
          ============================================= */}
      {seletorAberto && (
        <div className="ca-seletor-overlay">
          <div className="ca-seletor-box">

            <div className="ca-seletor-topo">
              <h2>{tituloSeletor[etapa]}</h2>
              <p>{loading ? 'Carregando dados...' : 'Digite no teclado e toque em uma opção'}</p>
            </div>

            <input
              className="ca-seletor-input"
              value={busca}
              placeholder={placeholderSeletor[etapa]}
              readOnly
            />

            <div className={`ca-seletor-resultados ${!busca ? 'vazio' : ''}`}>
              {loading ? (
                <div className="ca-seletor-msg">Carregando...</div>
              ) : erroApi ? (
                <div className="ca-seletor-msg">{erroApi}</div>
              ) : !busca ? (
                <div className="ca-seletor-msg">Digite para pesquisar</div>
              ) : opcoesFiltradas.length > 0 ? (
                opcoesFiltradas.map((item) => (
                  <button key={item.codigo} className="ca-seletor-opcao" onClick={() => escolher(item)}>
                    {item.nome}
                  </button>
                ))
              ) : (
                <div className="ca-seletor-msg">Nenhum resultado encontrado</div>
              )}
            </div>

            <div className="ca-seletor-teclado">
              {teclas.map((tecla) => (
                <button key={tecla} className="ca-tecla" onClick={() => digitar(tecla)}>{tecla}</button>
              ))}
            </div>

            <div className="ca-seletor-acoes">
              <button className="ca-btn-apagar" onClick={apagar}>APAGAR</button>
              <button className="ca-btn-limpar" onClick={limparBusca}>LIMPAR</button>
            </div>

          </div>
        </div>
      )}

      {/* =============================================
          POPUP 1 — VEÍCULO ENCONTRADO
          ============================================= */}
      {popupVeiculo && veiculoTratado && (
        <div className="popup-overlay">
          <div className="popup-veiculo popup-animado">

            <div className="popup-badge popup-badge-verde">✓ VEÍCULO ENCONTRADO</div>

            <div className="popup-veiculo-info">
              <div className="popup-info-linha popup-marca-modelo">
                <span className="popup-marca">{veiculoTratado.marca}</span>
                <span className="popup-modelo">{veiculoTratado.modelo}</span>
              </div>
              <div className="popup-info-boxes">
                <div className="popup-info-box">
                  <small>ANO</small>
                  <strong>{veiculoTratado.ano}</strong>
                </div>
                {veiculoTratado.versao && (
                  <div className="popup-info-box popup-info-box-wide">
                    <small>VERSÃO</small>
                    <strong>{veiculoTratado.versao}</strong>
                  </div>
                )}
                {veiculoTratado.combustivel && (
                  <div className="popup-info-box">
                    <small>COMBUSTÍVEL</small>
                    <strong>{veiculoTratado.combustivel}</strong>
                  </div>
                )}
              </div>
            </div>

            <p className="popup-pergunta">Este é o seu veículo?</p>

            {erroMedida && (
              <div className="popup-sem-medida">
                <p>⚠️ {erroMedida}</p>
                <p>Consulte um de nossos atendentes!</p>
              </div>
            )}

            <div className="popup-acoes">
              <button
                className="popup-btn popup-btn-sim"
                onClick={buscarMedidaIdeal}
                disabled={loadingMedida}
              >
                {loadingMedida ? '🔍 BUSCANDO...' : '✓ SIM, É MEU CARRO'}
              </button>
              <button className="popup-btn popup-btn-nao" onClick={novaConsulta}>
                ✗ NÃO É MEU CARRO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =============================================
          POPUP 2 — MEDIDA IDEAL
          ============================================= */}
      {popupMedida && (
        <div className="popup-overlay">
          <div className="popup-medida popup-animado">

            <div className="popup-badge popup-badge-amarelo">🔍 MEDIDA IDEAL ENCONTRADA</div>

            {veiculoTratado && (
              <div className="popup-veiculo-resumo">
                {veiculoTratado.marca} {veiculoTratado.modelo} {veiculoTratado.ano}
              </div>
            )}

            {medidaPrincipal ? (
              <>
                <div className="popup-medida-numero glow-measure">
                  {medidaPrincipal.medida}
                </div>
                {medidaPrincipal.observacao && (
                  <p className="popup-medida-obs">{medidaPrincipal.observacao}</p>
                )}
                {outrasMedidas.length > 0 && (
                  <div className="popup-outras-medidas">
                    <p className="popup-outras-titulo">OUTRAS MEDIDAS COMPATÍVEIS (consulte um vendedor para confirmar)</p>
                    <div className="popup-outras-grid">
                      {outrasMedidas.map((item, i) => (
                        <div key={i} className="popup-outra-medida">{item.medida}</div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="popup-sem-medida">
                <p>⚠️ Veículo encontrado, mas ainda não temos a medida cadastrada.</p>
                <p>Consulte um de nossos atendentes!</p>
              </div>
            )}

            <div className="popup-acoes">
              <button className="popup-btn popup-btn-sim" onClick={novaConsulta}>
                🔄 NOVA CONSULTA
              </button>
              <button className="popup-btn popup-btn-nao" onClick={voltarInicio}>
                🏠 VOLTAR AO INÍCIO
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
