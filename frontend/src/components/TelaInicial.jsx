import { useEffect } from 'react';

export default function TelaInicial({
  animandoEntrada,
  iniciarTotem,
  teclaRef
}) {

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    }
  }, []);

  return (
    <div className={`entrada-full kiosk-home ${animandoEntrada ? 'entrada-full-saindo' : ''}`}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />

      <div className={`overlay-escuro ${animandoEntrada ? 'overlay-escuro-ativo' : ''}`}></div>
      <div className={`vinheta-cinema ${animandoEntrada ? 'vinheta-cinema-ativa' : ''}`}></div>
      <div className={`onda-luz ${animandoEntrada ? 'onda-luz-ativa' : ''}`}></div>
      <div className={`clarão-tela ${animandoEntrada ? 'clarão-tela-ativo' : ''}`}></div>
      <div className={`faixa-luz ${animandoEntrada ? 'faixa-luz-ativa' : ''}`}></div>

      <div className={`kiosk-shell ${animandoEntrada ? 'kiosk-shell-saindo' : ''}`}>
        <div className="kiosk-topbar">
          <div className="kiosk-topo-faixa">
            <div className="kiosk-topo-mini">TERMINAL DE</div>
            <div className="kiosk-topo-big">AUTOATENDIMENTO</div>
          </div>
        </div>

        <div className="kiosk-screen">
          <div className="kiosk-header">
            <h1>SELECIONE O TIPO DE CONSULTA</h1>
            <p></p>
            <p>Escolha uma das opções abaixo para iniciar seu atendimento</p>
            <p></p>

            <div className="kiosk-instrucao-linha">
              <span className="kiosk-instrucao-traco"></span>
              <span className="kiosk-instrucao-texto">PRESSIONE O BOTÃO DO SERVIÇO DESEJADO</span>
              <span className="kiosk-instrucao-traco"></span>
            </div>
          </div>

          <div className="kiosk-acoes-area">
            <div className="kiosk-mao mao-esquerda">☞</div>

            <div className="kiosk-buttons">

              {/* BOTÃO AMARELO — ícone FORA do kiosk-btn-text */}
              <button
                type="button"
                className="kiosk-btn kiosk-btn-primary"
                onClick={() => iniciarTotem('placa')}
              >
                <span className="kiosk-btn-icon">
                  <img
                    src="/placa.png"
                    alt="Placa"
                    className="kiosk-btn-placa-img"
                  />
                </span>
                <span className="kiosk-btn-text">
                  <strong>CONSULTA POR PLACA</strong>
                  <small>Encontre o pneu ideal digitando a placa do veículo</small>
                </span>
              </button>

              {/* BOTÃO AZUL */}
              <button
                type="button"
                className="kiosk-btn kiosk-btn-secondary"
                onClick={() => iniciarTotem('modelo')}
              >
                <span className="kiosk-btn-icon">
                  <img
                    src="/pneu.png"
                    alt="Pneu"
                    className="kiosk-btn-pneu"
                  />
                </span>
                <span className="kiosk-btn-text">
                  <strong>CONSULTA AVANÇADA</strong>
                  <small>Encontre o pneu ideal consultando por marca/modelo/ano</small>
                </span>
              </button>

            </div>

            <div className="kiosk-mao mao-direita">☜</div>
          </div>

          <div className="kiosk-footer">
            <img src="/mascote.png" alt="Mascote" className="kiosk-mascote-footer" />
            <img src="/logo.png" alt="Pneu Forte" className="kiosk-footer-logo" />
          </div>

        </div>
      </div>
    </div>
  );
}
