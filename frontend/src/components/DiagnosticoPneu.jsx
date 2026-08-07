import { useState } from 'react';

const PERGUNTAS = [
  'Já faz mais de 4 anos desde a troca dos seus pneus?',
  'A banda de rodagem (desenho do pneu) está gasta ou lisa em algum ponto?',
  'O carro puxa para um lado ou vibra ao dirigir?',
  'Você já notou bolha, rachadura ou corte na lateral do pneu?',
];

function calcularResultado(pontos) {
  if (pontos === 0) {
    return {
      badge: '✓ TUDO CERTO',
      badgeClasse: 'popup-badge-verde',
      titulo: 'Seus pneus parecem em bom estado!',
      texto: 'Continue de olho na calibragem e faça revisões periódicas para manter a segurança.',
      cta: null,
    };
  }
  if (pontos <= 2) {
    return {
      badge: '⚠️ FIQUE ATENTO',
      badgeClasse: 'popup-badge-amarelo',
      titulo: 'Alguns sinais merecem uma olhada.',
      texto: 'Vale a pena passar por uma inspeção rápida para garantir que está tudo certo.',
      cta: 'Peça uma inspeção gratuita com nosso vendedor',
    };
  }
  return {
    badge: '🚨 ATENÇÃO',
    badgeClasse: 'popup-badge-vermelho',
    titulo: 'Isso pode estar comprometendo sua segurança.',
    texto: 'Vários sinais de alerta apareceram. É importante verificar seus pneus o quanto antes.',
    cta: 'Fale agora com um vendedor',
  };
}

export default function DiagnosticoPneu({ voltarInicio, teclaRef }) {
  const [etapa, setEtapa] = useState(0);
  const [pontos, setPontos] = useState(0);

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

  function responder(sim) {
    tocarClique();
    if (sim) setPontos((p) => p + 1);
    setEtapa((e) => e + 1);
  }

  function novoDiagnostico() {
    tocarClique();
    setEtapa(0);
    setPontos(0);
  }

  const finalizado = etapa >= PERGUNTAS.length;
  const resultado = finalizado ? calcularResultado(pontos) : null;

  return (
    <div className="app tela-placa-entrada">
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto" />
      <div className="bg-consulta"></div>
      <div className="bg-consulta-overlay"></div>

      <button className="btn-voltar flutuante" onClick={voltarInicio} aria-label="Voltar ao Início" />

      <div className="popup-overlay">
        {!finalizado ? (
          <div className="popup-veiculo popup-animado">
            <div className="popup-badge popup-badge-amarelo">
              PERGUNTA {etapa + 1} DE {PERGUNTAS.length}
            </div>
            <p className="popup-pergunta" style={{ fontSize: 'clamp(20px, 2.2vw, 34px)', color: '#fff', fontWeight: 800, lineHeight: 1.3 }}>
              {PERGUNTAS[etapa]}
            </p>
            <div className="popup-acoes">
              <button className="popup-btn popup-btn-sim" onClick={() => responder(true)}>SIM</button>
              <button className="popup-btn popup-btn-nao" onClick={() => responder(false)}>NÃO</button>
            </div>
          </div>
        ) : (
          <div className="popup-medida popup-animado">
            <div className={`popup-badge ${resultado.badgeClasse}`}>{resultado.badge}</div>
            <div className="popup-veiculo-resumo">DIAGNÓSTICO RÁPIDO DO PNEU</div>
            <p style={{ color: '#fff', fontSize: 'clamp(20px,2.2vw,32px)', fontWeight: 900, textAlign: 'center', margin: '4px 0' }}>
              {resultado.titulo}
            </p>
            <p className="popup-medida-obs" style={{ fontSize: 'clamp(14px,1.3vw,20px)' }}>{resultado.texto}</p>
            {resultado.cta && (
              <div style={{
                width: '100%', background: 'rgba(255,107,91,0.12)', border: '2px solid rgba(255,107,91,0.4)',
                borderRadius: 16, padding: '14px 18px', textAlign: 'center', color: '#ff6b5b',
                fontWeight: 900, fontSize: 'clamp(14px,1.4vw,20px)', textTransform: 'uppercase',
              }}>
                {resultado.cta}
              </div>
            )}
            <div className="popup-acoes">
              <button className="popup-btn popup-btn-sim" onClick={novoDiagnostico}>🔄 NOVO DIAGNÓSTICO</button>
              <button className="popup-btn popup-btn-nao" onClick={voltarInicio}>🏠 VOLTAR AO INÍCIO</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
