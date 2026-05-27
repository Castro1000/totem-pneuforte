import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import '../styles/consultaAvancada.css';

const LETRAS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const NUMEROS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const API_FIPE = `${import.meta.env.VITE_API_URL}/api/fipe`;
const API_BACKEND = `${import.meta.env.VITE_API_URL}/api/totem`;
const API_WHEEL_SIZE = `${import.meta.env.VITE_API_URL}/api/wheel-size`;

function normalizarTexto(texto = '') { return String(texto).trim().replace(/\s+/g, ' ').toUpperCase(); }
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
    if (!mapa.has(chave)) mapa.set(chave, { codigo: chave, nome: tratado.modeloBase, modelosOriginais: [] });
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
  const [etapa, setEtapa] = useState('marca');
  const [seletorAberto, setSeletorAberto] = useState(true);
  const [busca, setBusca] = useState('');
  const [tipoTeclado, setTipoTeclado] = useState('ABC');
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
  const [popupVeiculo, setPopupVeiculo] = useState(false);
  const [popupMedida, setPopupMedida] = useState(false);
  const [loadingMedida, setLoadingMedida] = useState(false);
  const [erroMedida, setErroMedida] = useState('');
  const [resultadoMedidas, setResultadoMedidas] = useState(null);
  const [fonteMedida, setFonteMedida] = useState('wheel-size');

  const marcasCarregadas = useRef(false);

  function tocarClique() {
    const audio = teclaRef?.current;
    if (!audio) return;
    try { audio.pause(); audio.currentTime = 0; audio.volume = 0.35; audio.play().catch(() => {}); } catch { }
  }

  const carregarMarcas = useCallback(async () => {
    try { setLoading(true); setErroApi(''); const response = await fetch(`${API_FIPE}/marcas`); const data = await response.json(); if (!response.ok) throw new Error('Erro ao carregar marcas'); setMarcas(data || []); } catch { setErroApi('Não foi possível carregar as marcas.'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { if (!marcasCarregadas.current) { carregarMarcas(); marcasCarregadas.current = true; } }, [carregarMarcas]);

  async function carregarModelos(codigoMarca) {
    try { setLoading(true); setErroApi(''); const response = await fetch(`${API_FIPE}/marcas/${codigoMarca}/modelos`); const data = await response.json(); if (!response.ok) throw new Error('Erro ao carregar modelos'); setModelosBase(montarModelosBase(data?.modelos || [])); } catch { setErroApi('Erro ao carregar modelos.'); } finally { setLoading(false); }
  }

  async function carregarAnosPorModeloBase(modeloBaseSelecionado) {
    try { setLoading(true); setErroApi(''); const modelosRelacionados = modeloBaseSelecionado?.modelosOriginais || []; const mapaAnos = new Map();
      const resultados = await Promise.allSettled(modelosRelacionados.map((item) => fetch(`${API_FIPE}/marcas/${marca.codigo}/modelos/${item.codigo}/anos`).then((r) => r.ok ? r.json() : []).then((listaAnos) => ({ item, listaAnos })).catch(() => ({ item, listaAnos: [] }))));
      resultados.forEach((res) => { if (res.status !== 'fulfilled') return; const { item, listaAnos } = res.value; (listaAnos || []).forEach((anoItem) => { const anoTratado = tratarAnoFipe(anoItem.nome); const chave = normalizarTexto(anoTratado.anoNumero); if (!chave) return; if (!mapaAnos.has(chave)) mapaAnos.set(chave, { codigo: chave, nome: anoTratado.anoNumero, anosOriginais: [] }); mapaAnos.get(chave).anosOriginais.push({ ...anoItem, codigoModelo: item.codigo, nomeModeloCompleto: item.nome, modeloBase: item.modeloBase, versao: item.versao }); }); });
      setAnos(Array.from(mapaAnos.values()).sort((a, b) => Number(b.nome) - Number(a.nome)));
    } catch { setErroApi('Erro ao carregar anos.'); } finally { setLoading(false); }
  }

  async function carregarVersoesPorAno(anoSelecionado) {
    try { setLoading(true); setErroApi(''); const anosOriginais = anoSelecionado?.anosOriginais || []; setVersoes(anosOriginais.map((item, index) => ({ codigo: `${item.codigoModelo}-${item.codigo}-${index}`, codigoModelo: item.codigoModelo, codigoAno: item.codigo, nome: item.versao || item.nomeModeloCompleto, modeloCompleto: item.nomeModeloCompleto }))); } catch { setErroApi('Erro ao carregar versões.'); } finally { setLoading(false); }
  }

  async function carregarResultadoFinal(versaoSelecionada) {
    try { setLoading(true); setErroApi(''); const response = await fetch(`${API_FIPE}/marcas/${marca.codigo}/modelos/${versaoSelecionada.codigoModelo}/anos/${versaoSelecionada.codigoAno}`); const data = await response.json(); if (!response.ok) throw new Error('Erro'); setResultadoFipe(data); setSeletorAberto(false); setPopupVeiculo(true); } catch { setErroApi('Erro ao consultar.'); } finally { setLoading(false); }
  }

  async function buscarMedidaIdeal() {
    try { tocarClique(); setLoadingMedida(true); setErroMedida(''); setResultadoMedidas(null);
      const veiculoTratado = tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe });
      let data = null;
      try { const responseWS = await fetch(`${API_WHEEL_SIZE}/buscar`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ marca: veiculoTratado.marca, modelo: veiculoTratado.modelo, ano: veiculoTratado.ano, versao: veiculoTratado.versao }) }); const jsonWS = await responseWS.json(); if (!responseWS.ok) throw new Error(); data = jsonWS; setFonteMedida('wheel-size'); } catch { try { const response = await fetch(`${API_BACKEND}/buscar-medida-veiculo`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(veiculoTratado) }); const json = await response.json(); if (!response.ok) throw new Error(); data = json; setFonteMedida('banco'); } catch { throw new Error('Veículo não encontrado.'); } }
      setResultadoMedidas(data); setPopupVeiculo(false); setPopupMedida(true);
    } catch (error) { setErroMedida(error.message); } finally { setLoadingMedida(false); }
  }

  function novaConsulta() { tocarClique(); setEtapa('marca'); setSeletorAberto(true); setBusca(''); setMarca(null); setModelo(null); setAno(null); setVersao(null); setResultadoFipe(null); setResultadoMedidas(null); setModelosBase([]); setAnos([]); setVersoes([]); setErroApi(''); setErroMedida(''); setPopupVeiculo(false); setPopupMedida(false); setLoadingMedida(false); setFonteMedida('wheel-size'); }

  const veiculoTratado = marca && modelo && ano && versao && resultadoFipe ? tratarVeiculoFipe({ marca, modelo, ano, versao, resultadoFipe }) : null;
  const pneus = resultadoMedidas?.pneus || [];
  const medidaPrincipal = pneus[0] || null;
  const outrasMedidas = pneus.slice(1).filter((item, index, self) => self.findIndex(p => p.medida === item.medida) === index);

  return (
    <div className="app tela-placa-entrada" style={{ overflow: 'hidden' }}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />
      <div className="bg-consulta"></div>
      <button className="btn-voltar flutuante" onClick={voltarInicio}>Início</button>

      {seletorAberto && (
        <div className="ca-seletor-overlay">
          <div className="ca-seletor-box">
            <div className="ca-seletor-topo"><h2>ESCOLHA DO VEÍCULO</h2></div>
            <input className="ca-seletor-input" value={busca} readOnly />
            <div className="ca-seletor-resultados">
              {loading ? <div className="ca-seletor-msg">Carregando...</div> : opcoesFiltradas.length > 0 ? opcoesFiltradas.map(item => <button key={item.codigo} onClick={() => escolher(item)}>{item.nome}</button>) : <div className="ca-seletor-msg">Nenhum resultado</div>}
            </div>
            {/* [Teclado omitido para brevidade, mantenha o seu existente] */}
          </div>
        </div>
      )}

      {popupMedida && (
        <div className="popup-overlay">
          <div className="popup-medida popup-animado" style={{ textAlign: 'center' }}>
            <div className="popup-badge popup-badge-amarelo">🔍 MEDIDA IDEAL</div>
            {medidaPrincipal?.imagem_carro && (
              <img src={medidaPrincipal.imagem_carro} alt="Veículo" style={{ maxWidth: '100%', borderRadius: '10px', margin: '10px 0' }} />
            )}
            <div className="popup-medida-numero">{medidaPrincipal?.medida}</div>
            
            {/* DADOS TÉCNICOS EXTRAS (Se existirem) */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '15px 0' }}>
              {medidaPrincipal?.pressao_psi && (<div><strong>PSI:</strong> {medidaPrincipal.pressao_psi}</div>)}
              {medidaPrincipal?.indice_velocidade && (<div><strong>VEL:</strong> {medidaPrincipal.indice_velocidade}</div>)}
            </div>

            {outrasMedidas.length > 0 && (
              <div className="popup-outras-medidas">
                <p>OUTRAS OPÇÕES:</p>
                <div className="popup-outras-grid">
                  {outrasMedidas.map((item, i) => <div key={i} className="popup-outra-medida">{item.medida}</div>)}
                </div>
              </div>
            )}
            <div className="popup-acoes">
              <button onClick={novaConsulta}>NOVA CONSULTA</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}