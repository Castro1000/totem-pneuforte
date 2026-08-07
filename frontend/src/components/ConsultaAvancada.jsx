import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import '../styles/consultaAvancada.css';

const LETRAS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G',
  'H', 'I', 'J', 'K', 'L', 'M', 'N',
  'O', 'P', 'Q', 'R', 'S', 'T', 'U',
  'V', 'W', 'X', 'Y', 'Z'
];

const NUMEROS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

const API_WHEEL_SIZE = `${import.meta.env.VITE_API_URL}/api/wheel-size`;

// Todo o seletor (marca → modelo → ano → versão) usa o catálogo da própria
// Wheel-Size, de ponta a ponta. Isso elimina a tradução entre vocabulários
// de APIs diferentes (que era a origem de medidas erradas): o cliente escolhe
// literalmente uma versão real cadastrada na Wheel-Size, então a consulta
// final não precisa "adivinhar" nada.

export default function ConsultaAvancada({ voltarInicio, teclaRef }) {
  const [etapa, setEtapa] = useState('marca');
  const [seletorAberto, setSeletorAberto] = useState(true);
  const [busca, setBusca] = useState('');
  const [tipoTeclado, setTipoTeclado] = useState('ABC');

  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anos, setAnos] = useState([]);
  const [versoes, setVersoes] = useState([]);

  const [marca, setMarca] = useState(null);
  const [modelo, setModelo] = useState(null);
  const [ano, setAno] = useState(null);
  const [versaoTrim, setVersaoTrim] = useState(null);

  const [loading, setLoading] = useState(false);
  const [erroApi, setErroApi] = useState('');

  const [popupVeiculo, setPopupVeiculo] = useState(false);
  const [popupMedida, setPopupMedida] = useState(false);

  const [loadingMedida, setLoadingMedida] = useState(false);
  const [erroMedida, setErroMedida] = useState('');
  const [resultadoMedidas, setResultadoMedidas] = useState(null);

  const marcasCarregadas = useRef(false);

  function tocarClique() {
    const audio = teclaRef?.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 0.35;
      audio.play().catch(() => {});
    } catch { }
  }

  const carregarMarcas = useCallback(async () => {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_WHEEL_SIZE}/marcas`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar marcas');
      setMarcas((data || []).map((m) => ({ codigo: m.slug, nome: m.name || m.name_en })));
    } catch {
      setErroApi('Não foi possível carregar as marcas. Verifique a internet.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!marcasCarregadas.current) {
      carregarMarcas();
      marcasCarregadas.current = true;
    }
  }, [carregarMarcas]);

  async function carregarModelos(marcaSlug) {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_WHEEL_SIZE}/marcas/${encodeURIComponent(marcaSlug)}/modelos`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar modelos');
      setModelos((data || []).map((m) => ({ codigo: m.slug, nome: m.name || m.name_en })));
    } catch {
      setErroApi('Não foi possível carregar os modelos desta marca.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarAnos(marcaSlug, modeloSlug) {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_WHEEL_SIZE}/marcas/${encodeURIComponent(marcaSlug)}/modelos/${encodeURIComponent(modeloSlug)}/anos`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar anos');
      const lista = (data || [])
        .map((a) => ({ codigo: a.slug, nome: String(a.name ?? a.slug) }))
        .sort((a, b) => Number(b.nome) - Number(a.nome));
      setAnos(lista);
    } catch {
      setErroApi('Não foi possível carregar os anos deste modelo.');
    } finally {
      setLoading(false);
    }
  }

  async function carregarVersoes(marcaSlug, modeloSlug, anoSlug) {
    try {
      setLoading(true);
      setErroApi('');
      const response = await fetch(`${API_WHEEL_SIZE}/marcas/${encodeURIComponent(marcaSlug)}/modelos/${encodeURIComponent(modeloSlug)}/anos/${encodeURIComponent(anoSlug)}/versoes`);
      const data = await response.json();
      if (!response.ok) throw new Error('Erro ao carregar versões');
      setVersoes((data || []).map((v) => ({ codigo: v.slug, nome: v.rotulo, motor: v.motor })));
    } catch {
      setErroApi('Não foi possível carregar as versões deste veículo.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmarVeiculo() {
    try {
      tocarClique();
      setLoadingMedida(true);
      setErroMedida('');
      setResultadoMedidas(null);

      const response = await fetch(`${API_WHEEL_SIZE}/buscar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marcaSlug: marca.codigo,
          modeloSlug: modelo.codigo,
          ano: ano.codigo,
          trimSlug: versaoTrim.codigo,
          marca: marca.nome,
          modelo: modelo.nome,
          versao: versaoTrim.nome,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro || 'Não foi possível consultar a medida');

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
    setMarca(null); setModelo(null); setAno(null); setVersaoTrim(null);
    setResultadoMedidas(null);
    setModelos([]); setAnos([]); setVersoes([]);
    setErroApi(''); setErroMedida('');
    setPopupVeiculo(false); setPopupMedida(false);
    setLoadingMedida(false);
  }

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
    if (etapa === 'modelo') return modelos;
    if (etapa === 'ano') return anos;
    if (etapa === 'versao') return versoes;
    return [];
  }, [etapa, marcas, modelos, anos, versoes]);

  const opcoesFiltradas = useMemo(() => {
    const texto = busca.trim().toUpperCase();
    // Na etapa de versão, mostra todas as opções mesmo sem digitar (geralmente poucas)
    if (etapa === 'versao') {
      if (!texto) return opcoes;
      return opcoes.filter((item) => String(item.nome).toUpperCase().includes(texto));
    }
    // Para marca, modelo e ano: lista já na primeira letra
    if (texto.length < 1) return [];
    return opcoes.filter((item) => String(item.nome).toUpperCase().includes(texto));
  }, [busca, opcoes, etapa]);

  async function escolher(item) {
    tocarClique();
    if (etapa === 'marca') {
      setMarca(item); setModelo(null); setAno(null); setVersaoTrim(null);
      setResultadoMedidas(null); setModelos([]); setAnos([]); setVersoes([]);
      setBusca(''); setEtapa('modelo');
      await carregarModelos(item.codigo);
      return;
    }
    if (etapa === 'modelo') {
      setModelo(item); setAno(null); setVersaoTrim(null);
      setResultadoMedidas(null); setAnos([]); setVersoes([]);
      setBusca(''); setEtapa('ano');
      await carregarAnos(marca.codigo, item.codigo);
      return;
    }
    if (etapa === 'ano') {
      setAno(item); setVersaoTrim(null);
      setResultadoMedidas(null); setVersoes([]);
      setBusca(''); setEtapa('versao');
      await carregarVersoes(marca.codigo, modelo.codigo, item.codigo);
      return;
    }
    if (etapa === 'versao') {
      setVersaoTrim(item); setBusca('');
      setSeletorAberto(false);
      setPopupVeiculo(true);
    }
  }

  function digitar(valor) { tocarClique(); setBusca((prev) => `${prev}${valor}`); }
  function apagar() { tocarClique(); setBusca((prev) => prev.slice(0, -1)); }

  const teclasVisiveis = useMemo(() => {
    if (etapa === 'ano') return NUMEROS;
    return tipoTeclado === 'ABC' ? LETRAS : NUMEROS;
  }, [etapa, tipoTeclado]);

  const veiculoResumo = marca && modelo && ano && versaoTrim
    ? { marca: marca.nome, modelo: modelo.nome, ano: ano.nome, versao: versaoTrim.nome }
    : null;

  const pneus = resultadoMedidas?.pneus || [];
  const medidaPrincipal = pneus[0] || null;
  const outrasMedidas = pneus
    .slice(1)
    .filter((item, index, self) =>
      item.medida !== medidaPrincipal?.medida &&
      self.findIndex(p => p.medida === item.medida) === index
   );
  const confiancaBaixa = resultadoMedidas?.confianca === 'baixa';
  const candidatos = resultadoMedidas?.candidatos || [];

  return (
    <div className="app tela-placa-entrada" style={{ overflow: 'hidden' }}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />
      <div className="bg-consulta"></div>
      <div className="bg-consulta-overlay"></div>

      <button className="btn-voltar flutuante" onClick={voltarInicio}>Início</button>

      {seletorAberto && (
        <div className="ca-seletor-overlay">
          <div className="ca-seletor-box" style={{ maxHeight: '95vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="ca-seletor-topo"><h2>{tituloSeletor[etapa]}</h2></div>
            <input className="ca-seletor-input" value={busca} placeholder={placeholderSeletor[etapa]} readOnly />
            <div className="ca-seletor-resultados" style={{ flex: 1, overflowY: 'auto' }}>
              {loading ? (
                <div className="ca-seletor-msg">Carregando...</div>
              ) : erroApi ? (
                <div className="ca-seletor-msg">{erroApi}</div>
              ) : !busca && etapa !== 'versao' ? (
                <div className="ca-seletor-msg">Digite no teclado para pesquisar</div>
              ) : opcoesFiltradas.length > 0 ? (
                opcoesFiltradas.map((item) => (
                  <button key={item.codigo} className="ca-seletor-opcao" onClick={() => escolher(item)}>
                    {item.nome}
                  </button>
                ))
              ) : (
                <div className="ca-seletor-msg">Nenhum resultado</div>
              )}
            </div>
            <div className="ca-seletor-teclado-container" style={{ background: '#111', padding: '10px' }}>
              <div className="ca-seletor-teclado" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
                {teclasVisiveis.map((tecla) => (
                  <button key={tecla} className="ca-tecla" onClick={() => digitar(tecla)}>{tecla}</button>
                ))}
              </div>
              <div className="ca-seletor-acoes" style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                {etapa !== 'ano' && (
                  <button className="ca-btn-alternar" style={{ flex: 1 }} onClick={() => { tocarClique(); setTipoTeclado(tipoTeclado === 'ABC' ? '123' : 'ABC'); }}>
                    {tipoTeclado === 'ABC' ? '123' : 'ABC'}
                  </button>
                )}
                {etapa !== 'ano' && (
                  <button className="ca-btn-apagar" style={{ flex: 2 }} onClick={() => digitar(' ')}>ESPAÇO</button>
                )}
                {etapa !== 'ano' && (
                  <button className="ca-btn-apagar" style={{ flex: 1 }} onClick={() => digitar('.')}>.</button>
                )}
                <button className="ca-btn-apagar" style={{ flex: 1 }} onClick={apagar}>APAGAR</button>
                <button className="ca-btn-limpar" style={{ flex: 1 }} onClick={() => { tocarClique(); setBusca(''); }}>LIMPAR</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {popupVeiculo && veiculoResumo && (
        <div className="popup-overlay">
          <div className="popup-veiculo popup-animado">
            <div className="popup-badge popup-badge-verde">✓ VEÍCULO ENCONTRADO</div>
            <div className="popup-veiculo-info">
              <div className="popup-info-linha">
                <span className="popup-marca">{veiculoResumo.marca}</span>
                <span className="popup-modelo">{veiculoResumo.modelo}</span>
              </div>
              <div className="popup-info-boxes">
                <div className="popup-info-box"><small>ANO</small><strong>{veiculoResumo.ano}</strong></div>
                <div className="popup-info-box" style={{ flex: 2 }}><small>VERSÃO</small><strong>{veiculoResumo.versao}</strong></div>
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
              <button className="popup-btn popup-btn-sim" onClick={confirmarVeiculo} disabled={loadingMedida}>
                {loadingMedida ? '🔍 BUSCANDO...' : '✓ SIM, É MEU CARRO'}
              </button>
              <button className="popup-btn popup-btn-nao" onClick={novaConsulta}>✗ NÃO É MEU CARRO</button>
            </div>
          </div>
        </div>
      )}

      {popupMedida && (
        <div className="popup-overlay">
          <div className="popup-medida popup-animado">
            <div className="popup-badge popup-badge-amarelo">🔍 MEDIDA IDEAL ENCONTRADA</div>

            {medidaPrincipal?.imagem_carro && (
               <div style={{ margin: '15px 0' }}>
                 <img src={medidaPrincipal.imagem_carro} alt="Veículo" style={{ maxWidth: '100%', maxHeight: '180px', borderRadius: '15px', border: '2px solid #FFD700' }} />
               </div>
            )}

            {veiculoResumo && (
              <div className="popup-veiculo-resumo">{veiculoResumo.marca} {veiculoResumo.modelo} {veiculoResumo.ano}</div>
            )}

            {confiancaBaixa ? (
              <div style={{ width: '100%', margin: '10px 0' }}>
                <p style={{ color: '#FFD700', fontWeight: 900, fontSize: '13px', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  ⚠️ Não temos certeza absoluta da medida do seu carro
                </p>
                <p style={{ color: '#EEE', fontSize: '13px', textAlign: 'center', marginBottom: '10px' }}>
                  Pode ser uma destas — um vendedor vai confirmar qual é a certa:
                </p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {candidatos.map((c, i) => (
                    <div key={i} style={{ background: 'linear-gradient(180deg,#3a3a3a,#1e1e1e)', borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '140px', border: '1px solid #FFD700' }}>
                      <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900 }}>{c}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : medidaPrincipal ? (
              <>
                {/* ── DIANTEIRO / TRASEIRO ── */}
                {(medidaPrincipal.observacao?.toUpperCase().includes('DIANTEIRO') ||
                  outrasMedidas.some(m => m.observacao?.toUpperCase().includes('TRASEIRO'))) ? (
                  <div style={{ width: '100%', margin: '10px 0' }}>
                    <p style={{ color: '#FFD700', fontWeight: 900, fontSize: '13px', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      ⚠️ Este veículo usa medidas diferentes dianteiro/traseiro
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <div style={{ background: 'linear-gradient(180deg,#1a6edb,#0d4fa8)', borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '140px' }}>
                        <div style={{ color: '#90caf9', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>🔵 DIANTEIRO</div>
                        <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900 }}>{medidaPrincipal.medida}</div>
                      </div>
                      {outrasMedidas.filter(m => m.observacao?.toUpperCase().includes('TRASEIRO')).map((m, i) => (
                        <div key={i} style={{ background: 'linear-gradient(180deg,#c0392b,#922b21)', borderRadius: '12px', padding: '12px 20px', textAlign: 'center', minWidth: '140px' }}>
                          <div style={{ color: '#f1948a', fontSize: '11px', fontWeight: 700, marginBottom: '4px' }}>🔴 TRASEIRO</div>
                          <div style={{ color: '#fff', fontSize: '22px', fontWeight: 900 }}>{m.medida}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* ── MEDIDA NORMAL ── */}
                    <div className="popup-medida-numero glow-measure" style={{ fontSize: '2.5rem', margin: '10px 0' }}>{medidaPrincipal.medida}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '15px', color: '#EEE' }}>
                      {medidaPrincipal.pressao_psi && (<div><strong>PSI:</strong> {medidaPrincipal.pressao_psi}</div>)}
                      {medidaPrincipal.indice_velocidade && (<div><strong>VEL:</strong> {medidaPrincipal.indice_velocidade}</div>)}
                    </div>
                    {medidaPrincipal.observacao && <p className="popup-medida-obs">{medidaPrincipal.observacao}</p>}
                  </>
                )}

                {/* Outras medidas — excluindo traseiro que já aparece acima */}
                {outrasMedidas.filter(m => !m.observacao?.toUpperCase().includes('TRASEIRO')).length > 0 && (
                  <div className="popup-outras-medidas">
                    <p className="popup-outras-titulo">OUTRAS MEDIDAS COMPATÍVEIS</p>
                    <div className="popup-outras-grid">
                      {outrasMedidas.filter(m => !m.observacao?.toUpperCase().includes('TRASEIRO')).map((item, i) => (
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
              <button className="popup-btn popup-btn-sim" onClick={novaConsulta}>🔄 NOVA CONSULTA</button>
              <button className="popup-btn popup-btn-nao" onClick={voltarInicio}>🏠 VOLTAR AO INÍCIO</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
