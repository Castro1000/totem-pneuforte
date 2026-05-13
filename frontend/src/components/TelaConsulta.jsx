import { useState } from 'react';

const LETRAS_1 = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
const LETRAS_2 = ['H', 'I', 'J', 'K', 'L', 'M', 'N'];
const LETRAS_3 = ['O', 'P', 'Q', 'R', 'S', 'T', 'U'];
const LETRAS_4 = ['V', 'W', 'X', 'Y', 'Z'];

const NUMEROS_1 = ['0', '1', '2', '3', '4'];
const NUMEROS_2 = ['5', '6', '7', '8', '9'];

export default function TelaConsulta({
  teclaRef,
  voltarInicio,
  resultado,
  erro,
  loading,
  placa,
  placaCompleta,
  buscar,
  adicionarTecla,
  apagarTecla,
  limparPlaca,
  novaConsulta,
}) {
  const [popupMedida, setPopupMedida] = useState(false);

  const placaExibida = placa.padEnd(7, ' ');
  const parte1 = placaExibida.slice(0, 3);
  const parte2 = placaExibida.slice(3, 7);

    const medidaPrincipal = resultado?.pneus?.[0] || null;
    const outrasMedidas = resultado?.pneus
      ?.slice(1)
      .filter((item, index, self) =>
        item.medida !== medidaPrincipal?.medida &&
        self.findIndex((m) => m.medida === item.medida) === index
      ) || [];

  function handleEMeuCarro() {
    setPopupMedida(true);
  }

  function handleNaoEMeuCarro() {
    novaConsulta();
  }

  function handleNovaConsulta() {
    setPopupMedida(false);
    novaConsulta();
  }

  return (
    <div className="app tela-placa-entrada">
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />
      <div className="bg-consulta"></div>
      <div className="bg-consulta-overlay"></div>

      <button className="btn-voltar flutuante" onClick={voltarInicio}>
        Início
      </button>

      {/* TELA PRINCIPAL — teclado + placa */}
      {!resultado && (
        <div className="consulta-wrapper consulta-wrapper-limpa">
          <div className="consulta-card consulta-card-animada consulta-card-limpo">
            <div className="consulta-coluna-unica">

              <h2 className="titulo-principal-placa">Digite a placa do seu carro</h2>

              <div className="placa-visual-wrapper">
                <img src="/placavazia.png" alt="Placa" className="placa-visual-img" />
                <div className="placa-visual-texto">
                  <span className="placa-parte1">
                    {parte1.split('').map((char, i) => (
                      <span key={i} className={`placa-char ${char.trim() ? 'preenchido' : ''}`}>
                        {char.trim() ? char : '\u00A0'}
                      </span>
                    ))}
                  </span>
                  <span className="placa-traco">-</span>
                  <span className="placa-parte2">
                    {parte2.split('').map((char, i) => (
                      <span key={i} className={`placa-char ${char.trim() ? 'preenchido' : ''}`}>
                        {char.trim() ? char : '\u00A0'}
                      </span>
                    ))}
                  </span>
                </div>
                {placa.length === 0 && (
                  <div className="placa-placeholder-hint"></div>
                )}
              </div>

              <button
                className={`btn-buscar btn-buscar-grande ${placaCompleta ? 'btn-buscar-pronto' : ''}`}
                onClick={buscar}
                disabled={loading || placa.length < 7}
              >
                {loading ? 'BUSCANDO...' : 'BUSCAR'}
              </button>

              <div className="teclado-layout-acessivel">
                <div className="teclado-numeros-box">
                  <div className="teclado-titulo teclado-titulo-grande">NÚMEROS</div>
                  <div className="teclado-linha numeros teclado-numeros-grande">
                    {NUMEROS_1.map((t) => (
                      <button key={t} type="button" className="tecla tecla-numero tecla-numero-gigante" onClick={() => adicionarTecla(t)}>{t}</button>
                    ))}
                  </div>
                  <div className="teclado-linha numeros teclado-numeros-grande">
                    {NUMEROS_2.map((t) => (
                      <button key={t} type="button" className="tecla tecla-numero tecla-numero-gigante" onClick={() => adicionarTecla(t)}>{t}</button>
                    ))}
                  </div>
                  <div className="teclado-linha teclado-acoes teclado-acoes-grandes">
                    <button type="button" className="tecla tecla-acao tecla-acao-grande" onClick={apagarTecla}>APAGAR</button>
                    <button type="button" className="tecla tecla-acao tecla-limpar tecla-acao-grande" onClick={limparPlaca}>LIMPAR</button>
                  </div>
                </div>

                <div className="teclado-letras-box">
                  <div className="teclado-titulo">LETRAS</div>
                  {[LETRAS_1, LETRAS_2, LETRAS_3].map((linha, idx) => (
                    <div key={idx} className="teclado-linha fixa">
                      {linha.map((t) => (
                        <button key={t} type="button" className="tecla tecla-letra" onClick={() => adicionarTecla(t)}>{t}</button>
                      ))}
                    </div>
                  ))}
                  <div className="teclado-linha fixa centralizada">
                    {LETRAS_4.map((t) => (
                      <button key={t} type="button" className="tecla tecla-letra" onClick={() => adicionarTecla(t)}>{t}</button>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* =============================================
          LOADING — ANIMAÇÃO DE BUSCA
          ============================================= */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">

            {/* Placa sendo "escaneada" */}
            <div className="loading-placa-wrap">
              <img src="/placavazia.png" alt="Placa" className="loading-placa-img" />
              <div className="loading-placa-texto">
                {placa.slice(0, 3)}
                <span className="loading-placa-traco">-</span>
                {placa.slice(3)}
              </div>
              <div className="loading-scanner-line" />
            </div>

            {/* Ícone radar + texto */}
            <div className="loading-radar-wrap">
              <div className="loading-radar">
                <div className="loading-radar-anel loading-radar-anel-1" />
                <div className="loading-radar-anel loading-radar-anel-2" />
                <div className="loading-radar-anel loading-radar-anel-3" />
                <div className="loading-radar-ponto" />
              </div>
            </div>

            <p className="loading-titulo">CONSULTANDO VEÍCULO</p>

            <div className="loading-dots">
              <span className="loading-dot loading-dot-1" />
              <span className="loading-dot loading-dot-2" />
              <span className="loading-dot loading-dot-3" />
            </div>

            <p className="loading-subtitulo">Buscando informações da placa</p>
          </div>
        </div>
      )}

      {/* ERRO */}
      {erro && !resultado && (
        <div className="popup-erro-bar">{erro}</div>
      )}

      {/* =============================================
          POPUP 1 — VEÍCULO ENCONTRADO
          ============================================= */}
      {resultado && !popupMedida && (
        <div className="popup-overlay">
          <div className="popup-veiculo popup-animado">

            <div className="popup-badge popup-badge-verde">
              ✓ VEÍCULO ENCONTRADO
            </div>

            <div className="popup-placa-tag">
              {resultado.veiculo.placa}
            </div>

            <div className="popup-veiculo-info">
              <div className="popup-info-linha popup-marca-modelo">
                <span className="popup-marca">{resultado.veiculo.marca}</span>
                <span className="popup-modelo">{resultado.veiculo.modelo}</span>
              </div>

              <div className="popup-info-boxes">
                <div className="popup-info-box">
                  <small>ANO</small>
                  <strong>{resultado.veiculo.ano}</strong>
                </div>
                {resultado.veiculo.versao && (
                  <div className="popup-info-box popup-info-box-wide">
                    <small>VERSÃO</small>
                    <strong>{resultado.veiculo.versao}</strong>
                  </div>
                )}
                {resultado.veiculo.combustivel && (
                  <div className="popup-info-box">
                    <small>COMBUSTÍVEL</small>
                    <strong>{resultado.veiculo.combustivel}</strong>
                  </div>
                )}
              </div>
            </div>

            <p className="popup-pergunta">Este é o seu veículo?</p>

            <div className="popup-acoes">
              <button className="popup-btn popup-btn-sim" onClick={handleEMeuCarro}>
                ✓ SIM, É MEU CARRO
              </button>
              <button className="popup-btn popup-btn-nao" onClick={handleNaoEMeuCarro}>
                ✗ NÃO É MEU CARRO
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =============================================
          POPUP 2 — MEDIDA IDEAL
          ============================================= */}
      {resultado && popupMedida && (
        <div className="popup-overlay">
          <div className="popup-medida popup-animado">

            <div className="popup-badge popup-badge-amarelo">
              🔍 MEDIDA IDEAL ENCONTRADA
            </div>

            <div className="popup-veiculo-resumo">
              {resultado.veiculo.marca} {resultado.veiculo.modelo} {resultado.veiculo.ano}
            </div>

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
                    <p className="popup-outras-titulo">OUTRAS MEDIDAS COMPATÍVEIS</p>
                    <div className="popup-outras-grid">
                      {outrasMedidas.map((item, i) => (
                        <div key={i} className="popup-outra-medida">
                          {item.medida}
                        </div>
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
              <button className="popup-btn popup-btn-sim" onClick={handleNovaConsulta}>
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
