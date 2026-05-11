import { useEffect, useMemo, useState } from 'react';
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
  return String(texto)
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

function tratarModeloFipe(nomeModelo = '') {
  const texto = String(nomeModelo).trim().replace(/\s+/g, ' ');

  if (!texto) {
    return {
      modeloBase: '',
      versao: 'VERSÃO NÃO INFORMADA'
    };
  }

  const partes = texto.split(' ');
  const modeloBase = partes[0] || texto;
  const versao = partes.slice(1).join(' ') || 'VERSÃO ÚNICA';

  return {
    modeloBase,
    versao
  };
}

function tratarAnoFipe(nomeAno = '') {
  const texto = String(nomeAno).trim();

  if (!texto) {
    return {
      anoNumero: '',
      combustivel: ''
    };
  }

  const partes = texto.split(' ');
  const anoNumero = partes[0] || texto;
  const combustivel = partes.slice(1).join(' ') || '';

  return {
    anoNumero,
    combustivel
  };
}

function montarModelosBase(modelosFipe = []) {
  const mapa = new Map();

  modelosFipe.forEach((item) => {
    const tratado = tratarModeloFipe(item.nome);
    const chave = normalizarTexto(tratado.modeloBase);

    if (!chave) return;

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        codigo: chave,
        nome: tratado.modeloBase,
        modelosOriginais: []
      });
    }

    mapa.get(chave).modelosOriginais.push({
      ...item,
      modeloBase: tratado.modeloBase,
      versao: tratado.versao
    });
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
  const [popupAberto, setPopupAberto] = useState(false);
  const [etapa, setEtapa] = useState('marca');
  const [busca, setBusca] = useState('');

  const [marcas, setMarcas] = useState([]);
  const [modelosFipe, setModelosFipe] = useState([]);
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
    } catch {
      //
    }
  }

  async function carregarMarcas() {
    try {
      setLoading(true);
      setErroApi('');

      const response = await fetch(`${API_FIPE}/marcas`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Erro ao carregar marcas');
      }

      setMarcas(data || []);
    } catch {
      setErroApi('Não foi possível carregar as marcas. Verifique a internet.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarModelos(codigoMarca) {
    try {
      setLoading(true);
      setErroApi('');

      const response = await fetch(`${API_FIPE}/marcas/${codigoMarca}/modelos`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error('Erro ao carregar modelos');
      }

      const listaModelos = data?.modelos || [];

      setModelosFipe(listaModelos);
      setModelosBase(montarModelosBase(listaModelos));
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

      for (const item of modelosRelacionados) {
        const response = await fetch(
          `${API_FIPE}/marcas/${marca.codigo}/modelos/${item.codigo}/anos`
        );

        if (!response.ok) continue;

        const listaAnos = await response.json();

        (listaAnos || []).forEach((anoItem) => {
          const anoTratado = tratarAnoFipe(anoItem.nome);
          const chave = normalizarTexto(anoTratado.anoNumero);

          if (!chave) return;

          if (!mapaAnos.has(chave)) {
            mapaAnos.set(chave, {
              codigo: chave,
              nome: anoTratado.anoNumero,
              anosOriginais: []
            });
          }

          mapaAnos.get(chave).anosOriginais.push({
            ...anoItem,
            codigoModelo: item.codigo,
            nomeModeloCompleto: item.nome,
            modeloBase: item.modeloBase,
            versao: item.versao
          });
        });
      }

      const listaFinal = Array.from(mapaAnos.values()).sort(
        (a, b) => Number(b.nome) - Number(a.nome)
      );

      setAnos(listaFinal);
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
      const listaVersoes = anosOriginais.map((item, index) => ({
        codigo: `${item.codigoModelo}-${item.codigo}-${index}`,
        codigoModelo: item.codigoModelo,
        codigoAno: item.codigo,
        nome: item.versao || item.nomeModeloCompleto,
        modeloCompleto: item.nomeModeloCompleto
      }));

      setVersoes(listaVersoes);
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

      if (!response.ok) {
        throw new Error('Erro ao consultar veículo');
      }

      setResultadoFipe(data);
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

      const veiculoTratado = tratarVeiculoFipe({
        marca,
        modelo,
        ano,
        versao,
        resultadoFipe
      });

      const response = await fetch(`${API_BACKEND}/buscar-medida-veiculo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(veiculoTratado)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Nenhuma medida encontrada para este veículo');
      }

      setResultadoMedidas(data);
    } catch (error) {
      setErroMedida(error.message || 'Erro ao buscar medida ideal');
    } finally {
      setLoadingMedida(false);
    }
  }

  useEffect(() => {
    carregarMarcas();
  }, []);

  const tituloPopup = {
    marca: 'ESCOLHA A MARCA DO SEU CARRO',
    modelo: 'ESCOLHA O MODELO DO SEU CARRO',
    ano: 'ESCOLHA O ANO DO SEU CARRO',
    versao: 'ESCOLHA A VERSÃO DO SEU CARRO'
  };

  const placeholderPopup = {
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

    return opcoes.filter((item) =>
      String(item.nome).toUpperCase().includes(texto)
    );
  }, [busca, opcoes]);

  const veiculoCompleto = marca && modelo && ano && versao && resultadoFipe;

  const veiculoTratado = veiculoCompleto
    ? tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe })
    : null;

  const medidaPrincipal = resultadoMedidas?.pneus?.[0] || null;
  const outrasMedidas = resultadoMedidas?.pneus?.slice(1) || [];

  function abrirPopup() {
    tocarClique();
    setPopupAberto(true);
    setEtapa('marca');
    setBusca('');
    setErroApi('');
  }

  function fecharPopup() {
    tocarClique();
    setPopupAberto(false);
    setBusca('');
  }

  async function escolher(item) {
    tocarClique();

    if (etapa === 'marca') {
      setMarca(item);
      setModelo(null);
      setAno(null);
      setVersao(null);
      setResultadoFipe(null);
      setResultadoMedidas(null);
      setModelosFipe([]);
      setModelosBase([]);
      setAnos([]);
      setVersoes([]);
      setBusca('');
      setEtapa('modelo');
      await carregarModelos(item.codigo);
      return;
    }

    if (etapa === 'modelo') {
      setModelo(item);
      setAno(null);
      setVersao(null);
      setResultadoFipe(null);
      setResultadoMedidas(null);
      setAnos([]);
      setVersoes([]);
      setBusca('');
      setEtapa('ano');
      await carregarAnosPorModeloBase(item);
      return;
    }

    if (etapa === 'ano') {
      setAno(item);
      setVersao(null);
      setResultadoFipe(null);
      setResultadoMedidas(null);
      setVersoes([]);
      setBusca('');
      setEtapa('versao');
      await carregarVersoesPorAno(item);
      return;
    }

    if (etapa === 'versao') {
      setVersao(item);
      setBusca('');
      setPopupAberto(false);
      await carregarResultadoFinal(item);
    }
  }

  function digitar(valor) {
    tocarClique();
    setBusca((prev) => `${prev}${valor}`.toUpperCase());
  }

  function apagar() {
    tocarClique();
    setBusca((prev) => prev.slice(0, -1));
  }

  function limparBusca() {
    tocarClique();
    setBusca('');
  }

  function refazerConsulta() {
    tocarClique();
    setPopupAberto(true);
    setEtapa('marca');
    setBusca('');
    setMarca(null);
    setModelo(null);
    setAno(null);
    setVersao(null);
    setResultadoFipe(null);
    setResultadoMedidas(null);
    setModelosFipe([]);
    setModelosBase([]);
    setAnos([]);
    setVersoes([]);
    setErroApi('');
    setErroMedida('');
  }

  const teclas = etapa === 'ano' ? NUMEROS : LETRAS;

  return (
    <div className="consulta-avancada-page">
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />

      <div className="consulta-avancada-fundo"></div>
      <div className="consulta-avancada-logo-fundo"></div>

      <button className="btn-voltar flutuante" onClick={voltarInicio}>
        Início
      </button>

      <main className="consulta-avancada-centro">
        <section className="consulta-avancada-painel">
          <div className="consulta-avancada-topo-amarelo">
            <div className="consulta-avancada-mini">CONSULTA AVANÇADA</div>
            <h1>ENCONTRE A MEDIDA CERTA DO SEU PNEU</h1>
          </div>

          <div className="consulta-avancada-conteudo">
            <p className="consulta-avancada-descricao">
              Informe os dados do seu veículo para encontrarmos a medida ideal.
            </p>

            {!veiculoCompleto ? (
              <button className="btn-escolher-marca" onClick={abrirPopup}>
                TOQUE PARA ESCOLHER A MARCA DO SEU CARRO
              </button>
            ) : (
              <div className="consulta-veiculo-final">
                <h2>VEÍCULO SELECIONADO</h2>

                <p><strong>Marca:</strong> {veiculoTratado.marca}</p>
                <p><strong>Modelo:</strong> {veiculoTratado.modelo}</p>
                <p>
                  <strong>Ano:</strong> {veiculoTratado.ano}
                  {veiculoTratado.combustivel ? ` - ${veiculoTratado.combustivel}` : ''}
                </p>
                <p><strong>Versão:</strong> {veiculoTratado.versao}</p>

                {veiculoTratado.codigo_fipe && (
                  <p><strong>Código FIPE:</strong> {veiculoTratado.codigo_fipe}</p>
                )}

                {!resultadoMedidas && (
                  <button
                    className="btn-escolher-marca"
                    onClick={buscarMedidaIdeal}
                    disabled={loadingMedida}
                  >
                    {loadingMedida ? 'BUSCANDO MEDIDA...' : 'BUSCAR MEDIDA IDEAL'}
                  </button>
                )}

                {erroMedida && (
                  <div className="consulta-medida-erro">
                    {erroMedida}
                  </div>
                )}

                {medidaPrincipal && (
                  <div className="consulta-medida-card">
                    <span>MEDIDA IDEAL</span>
                    <h3>{medidaPrincipal.medida}</h3>
                    <p>{medidaPrincipal.observacao || 'Medida recomendada para este veículo.'}</p>
                  </div>
                )}

                {outrasMedidas.length > 0 && (
                  <div className="consulta-outras-medidas">
                    <h4>OUTRAS MEDIDAS COMPATÍVEIS</h4>

                    {outrasMedidas.map((item) => (
                      <div key={item.id} className="consulta-outra-medida-item">
                        <strong>{item.medida}</strong>
                        <small>{item.observacao || item.tipo}</small>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  className="btn-escolher-marca"
                  onClick={refazerConsulta}
                  style={{ marginTop: '16px' }}
                >
                  REFAZER CONSULTA
                </button>
              </div>
            )}

            <div className="consulta-avancada-footer">
              <img src="/mascote.png" alt="Mascote Pneu Forte" className="consulta-avancada-mascote" />
              <img src="/logo.png" alt="Pneu Forte" className="consulta-avancada-logo" />
            </div>
          </div>
        </section>
      </main>

      {popupAberto && (
        <div className="popup-avancada-overlay">
          <section className="popup-avancada">
            <button className="popup-fechar-x" onClick={fecharPopup}>
              ×
            </button>

            <div className="popup-avancada-topo">
              <h2>{tituloPopup[etapa]}</h2>
              <p>
                {loading
                  ? 'Carregando dados...'
                  : 'Digite no teclado abaixo e toque em uma opção para continuar.'}
              </p>
            </div>

            <input
              className="popup-avancada-input"
              value={busca}
              placeholder={placeholderPopup[etapa]}
              readOnly
            />

            <div className={`popup-avancada-resultados ${!busca ? 'vazio' : ''}`}>
              {loading ? (
                <div className="sem-resultado-popup">Carregando...</div>
              ) : erroApi ? (
                <div className="sem-resultado-popup">{erroApi}</div>
              ) : !busca ? (
                <div className="sem-resultado-popup">Digite para pesquisar</div>
              ) : opcoesFiltradas.length > 0 ? (
                opcoesFiltradas.map((item) => (
                  <button key={item.codigo} onClick={() => escolher(item)}>
                    {item.nome}
                  </button>
                ))
              ) : (
                <div className="sem-resultado-popup">Nenhum resultado encontrado</div>
              )}
            </div>

            <div className="popup-avancada-teclado">
              {teclas.map((tecla) => (
                <button key={tecla} onClick={() => digitar(tecla)}>
                  {tecla}
                </button>
              ))}
            </div>

            <div className="popup-avancada-acoes">
              <button onClick={apagar}>APAGAR</button>
              <button onClick={limparBusca}>LIMPAR</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}