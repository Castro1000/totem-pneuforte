import { useEffect, useState } from 'react';

function IconePlaca({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7.2"/>
      <line x1="21" y1="21" x2="16.4" y2="16.4"/>
    </svg>
  );
}

function IconeCarro({ style }) {
  return (
    <svg viewBox="0 0 24 24" style={style} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 13l1.6-4.8A2 2 0 016.5 7h11a2 2 0 011.9 1.5L21 13"/>
      <path d="M3 13h18v4a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H6v1a1 1 0 01-1 1H4a1 1 0 01-1-1v-4z"/>
      <circle cx="7.5" cy="17.3" r="1.4" fill="currentColor" stroke="none"/>
      <circle cx="16.5" cy="17.3" r="1.4" fill="currentColor" stroke="none"/>
    </svg>
  );
}

export default function TelaInicial({ animandoEntrada, iniciarTotem, teclaRef }) {
  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(()=>{});
  }, []);

  const ff = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

  // ── CARTÕES — igual ao modelo (ícone + texto, cartão branco) ─────────────
  const CARTOES = [
    { acao: () => iniciarTotem('placa'), corIcone: '#FFD400', textoIcone:'#111', Icone: IconePlaca, titulo: 'Consulta por Placa' },
    { acao: () => iniciarTotem('modelo'), corIcone: '#161616', textoIcone:'#fff', Icone: IconeCarro, titulo: 'Consulta Avançada' },
  ];

  return (
    <div className={`entrada-full kiosk-home ${animandoEntrada ? 'entrada-full-saindo' : ''}`}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto"/>
      <div className={`overlay-escuro ${animandoEntrada ? 'overlay-escuro-ativo' : ''}`}/>
      <div className={`vinheta-cinema ${animandoEntrada ? 'vinheta-cinema-ativa' : ''}`}/>
      <div className={`onda-luz ${animandoEntrada ? 'onda-luz-ativa' : ''}`}/>
      <div className={`clarão-tela ${animandoEntrada ? 'clarão-tela-ativo' : ''}`}/>
      <div className={`faixa-luz ${animandoEntrada ? 'faixa-luz-ativa' : ''}`}/>

      {/* SHELL — fundo claro, logo + boas-vindas, cartões com mascote no meio */}
      <div className={`kiosk-shell ${animandoEntrada ? 'kiosk-shell-saindo' : ''}`} style={{
        width:'100vw', height:'100vh',
        background:'#f7f5f0',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        fontFamily: ff, overflow:'hidden', position:'relative', gap:'clamp(24px,3.5vh,44px)',
      }}>

        {/* LOGO + BOAS-VINDAS */}
        <div style={{ textAlign:'center' }}>
          <img src="/logo.png" alt="Pneu Forte" style={{ height:'clamp(84px,11vh,130px)', objectFit:'contain', marginBottom:22 }}
            onError={e=>{e.target.style.display='none'}}/>
          <div style={{ fontSize:'clamp(34px,3.6vw,52px)', fontWeight:900, color:'#171717', lineHeight:1.2 }}>Seja bem-vindo!</div>
          <div style={{ fontSize:'clamp(22px,2vw,30px)', color:'#666', fontWeight:700, marginTop:12 }}>O que você precisa hoje?</div>
        </div>

        {/* CARTÕES + MASCOTE NO MEIO */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'clamp(24px,4vw,64px)' }}>
          <button type="button" onClick={CARTOES[0].acao}
            onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
            style={{
              border:'none', borderRadius:26, cursor:'pointer', background:'#fff',
              width:'clamp(240px,20vw,320px)', height:'clamp(280px,40vh,380px)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:22, boxShadow:'0 14px 34px rgba(0,0,0,0.12)', transition:'transform 0.12s',
            }}>
            <span style={{
              width:'clamp(80px,8vw,104px)', height:'clamp(80px,8vw,104px)', borderRadius:'50%',
              background:CARTOES[0].corIcone, color:CARTOES[0].textoIcone,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <IconePlaca style={{ width:'46%', height:'46%' }}/>
            </span>
            <span style={{ fontSize:'clamp(18px,1.7vw,24px)', fontWeight:900, color:'#171717', textAlign:'center', padding:'0 12px' }}>
              {CARTOES[0].titulo}
            </span>
          </button>

          <img src="/mascote.png" alt="Mascote"
            onError={e=>{e.target.style.display='none'}}
            style={{
              height:'clamp(300px,46vh,420px)', objectFit:'contain', flexShrink:0,
              filter:'drop-shadow(0 14px 20px rgba(0,0,0,0.22))',
              animation:'mascoteFloat 3s ease-in-out infinite',
            }}/>

          <button type="button" onClick={CARTOES[1].acao}
            onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
            onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
            style={{
              border:'none', borderRadius:26, cursor:'pointer', background:'#fff',
              width:'clamp(240px,20vw,320px)', height:'clamp(280px,40vh,380px)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:22, boxShadow:'0 14px 34px rgba(0,0,0,0.12)', transition:'transform 0.12s',
            }}>
            <span style={{
              width:'clamp(80px,8vw,104px)', height:'clamp(80px,8vw,104px)', borderRadius:'50%',
              background:CARTOES[1].corIcone, color:CARTOES[1].textoIcone,
              display:'flex', alignItems:'center', justifyContent:'center',
            }}>
              <IconeCarro style={{ width:'46%', height:'46%' }}/>
            </span>
            <span style={{ fontSize:'clamp(18px,1.7vw,24px)', fontWeight:900, color:'#171717', textAlign:'center', padding:'0 12px' }}>
              {CARTOES[1].titulo}
            </span>
          </button>
        </div>

        {/* FRASE */}
        <div style={{ fontSize:'clamp(22px,2.2vw,32px)', color:'#444', fontWeight:800, textAlign:'center', padding:'0 24px' }}>
          Qualidade, confiança e economia para você acelerar
        </div>
      </div>

      <style>{`
        @keyframes mascoteFloat {
          0%,100%{transform:translateY(0) rotate(-1deg);}
          50%{transform:translateY(-12px) rotate(1deg);}
        }
      `}</style>
    </div>
  );
}
