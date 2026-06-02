import { useEffect, useState } from 'react';

const LOJAS = ['/loja1.jpeg','/loja2.jpeg','/loja3.jpeg','/loja4.jpeg','/loja5.jpeg'];

const CARROSSEL_ITEMS = [
  { img: '/pneu-dunlop.png',  medida: '205/55R16' },
  { img: '/pneu-xbri.png',   medida: '185/65R15' },
  { img: '/pneu-falken.png', medida: '225/45R17' },
  { img: '/pneu-dunlop.png',  medida: '195/60R15' },
  { img: '/pneu-xbri.png',   medida: '175/70R13' },
];

function useIsMobile() {
  const [mobile, setMobile] = useState(
    () => window.innerWidth < 768 || window.innerHeight > window.innerWidth
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 768 || window.innerHeight > window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function TelaInicial({ animandoEntrada, iniciarTotem, teclaRef }) {
  const [lojaAtual, setLojaAtual] = useState(0);
  const [carrosselIdx, setCarrosselIdx] = useState(0);
  const [hora, setHora] = useState('');
  const [emBreve, setEmBreve] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const isMobile = useIsMobile();
  const VISIVEIS = isMobile ? 3 : 4;

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(()=>{});
  }, []);

  useEffect(() => {
    const fn = () => {
      const d = new Date();
      setHora(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    fn(); const t = setInterval(fn, 10000); return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => { setLojaAtual(p => (p+1) % LOJAS.length); setFadeIn(true); }, 350);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const max = CARROSSEL_ITEMS.length - VISIVEIS;
    const t = setInterval(() => setCarrosselIdx(p => (p+1) > max ? 0 : p+1), 2500);
    return () => clearInterval(t);
  }, [VISIVEIS]);

  const ff = "'Barlow Condensed','Arial Narrow',Arial,sans-serif";

  // ── BOTÕES ──────────────────────────────────────────
  const BOTOES = [
    {
      acao: () => iniciarTotem('placa'),
      bg: 'linear-gradient(135deg,#1a1200 0%,#3a2800 60%,#c69000 100%)',
      titulo: 'CONSULTA\nPOR PLACA',
      tituloCor: '#FFD400',
      desc: 'Busque a medida correta para seu carro através da placa.',
    },
    {
      acao: () => iniciarTotem('modelo'),
      bg: 'linear-gradient(135deg,#0a0a1a 0%,#1a1040 60%,#2d1b6e 100%)',
      titulo: 'CONSULTA\nAVANÇADA',
      tituloCor: '#a78bfa',
      desc: 'Busque a medida ideal inserindo Marca, Modelo, Ano e Versão.',
    },
    {
      acao: () => { setEmBreve('Simulador de Orçamento'); setTimeout(() => setEmBreve(null), 3000); },
      bg: 'linear-gradient(135deg,#001a0a 0%,#003d1a 60%,#005c22 100%)',
      titulo: 'SIMULAR\nORÇAMENTO',
      tituloCor: '#4ade80',
      desc: 'Simule um orçamento para análise de preços e compra de pneus.',
    },
    {
      acao: () => { setEmBreve('Forte Club — Programa de Fidelidade'); setTimeout(() => setEmBreve(null), 3000); },
      bg: 'linear-gradient(135deg,#1a0500 0%,#3d1000 60%,#6e2200 100%)',
      titulo: 'PROGRAMA\nDE FIDELIDADE',
      tituloCor: '#fb923c',
      desc: 'Ganhe descontos e brindes acumulando pontos visitando nossas lojas.',
    },
  ];

  return (
    <div className={`entrada-full kiosk-home ${animandoEntrada ? 'entrada-full-saindo' : ''}`}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto"/>
      <div className={`overlay-escuro ${animandoEntrada ? 'overlay-escuro-ativo' : ''}`}/>
      <div className={`vinheta-cinema ${animandoEntrada ? 'vinheta-cinema-ativa' : ''}`}/>
      <div className={`onda-luz ${animandoEntrada ? 'onda-luz-ativa' : ''}`}/>
      <div className={`clarão-tela ${animandoEntrada ? 'clarão-tela-ativo' : ''}`}/>
      <div className={`faixa-luz ${animandoEntrada ? 'faixa-luz-ativa' : ''}`}/>

      {/* POPUP EM BREVE */}
      {emBreve && (
        <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
          <div style={{background:'#111',border:'2px solid #FFD400',borderRadius:20,padding:isMobile?'32px 28px':'48px 56px',textAlign:'center',margin:'0 20px'}}>
            <div style={{fontSize:44,marginBottom:12}}>🚧</div>
            <div style={{color:'#FFD400',fontSize:isMobile?20:26,fontWeight:900,marginBottom:6,fontFamily:ff}}>EM BREVE!</div>
            <div style={{color:'#fff',fontSize:isMobile?14:16,fontWeight:700,marginBottom:6,fontFamily:ff}}>{emBreve}</div>
            <div style={{color:'#666',fontSize:12,fontFamily:'sans-serif',lineHeight:1.5}}>Este módulo está sendo desenvolvido<br/>e estará disponível em breve.</div>
          </div>
        </div>
      )}

      {/* SHELL */}
      <div className={`kiosk-shell ${animandoEntrada ? 'kiosk-shell-saindo' : ''}`} style={{
        width:'100vw', height:'100vh',
        background:'#1e1e1e',
        display:'flex', flexDirection:'column',
        fontFamily: ff, overflow:'hidden',
      }}>

        {/* TOPBAR */}
        <div style={{
          background:'#111', flexShrink:0,
          height: isMobile ? 46 : 50,
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding: isMobile ? '0 12px' : '0 20px',
          borderBottom:'2px solid #1a1a1a',
        }}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <img src="/logo.png" alt="Pneu Forte" style={{height:isMobile?32:38,objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{background:'#1e1e1e',borderRadius:7,padding:isMobile?'3px 10px':'4px 14px',display:'flex',alignItems:'center',gap:6,border:'1px solid #333'}}>
              {!isMobile && <span style={{fontSize:12,color:'#888',fontFamily:'sans-serif'}}>Ronina: 10</span>}
              <span style={{fontSize:isMobile?16:20,fontWeight:900,color:'#fff',letterSpacing:1}}>{hora}</span>
            </div>
            {!isMobile && (
              <button type="button" style={{background:'transparent',border:'1px solid #555',borderRadius:7,padding:'6px 14px',color:'#fff',fontSize:14,fontWeight:700,cursor:'pointer'}}>
                Grauser →
              </button>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{
          flex:1, display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          overflow:'hidden',
          gap:6, padding:6, minHeight:0,
        }}>

          {/* COLUNA ESQUERDA — foto loja + mascote */}
          <div style={{
            width: isMobile ? '100%' : '36%',
            height: isMobile ? 130 : 'auto',
            flexShrink:0, position:'relative',
            borderRadius:12, overflow:'hidden',
          }}>
            <img key={lojaAtual} src={LOJAS[lojaAtual]} alt="Loja"
              onError={e=>{e.target.style.opacity=0}}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:fadeIn?1:0,transition:'opacity 0.35s ease',zIndex:1}}/>
            <div style={{position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.1) 60%)',zIndex:2}}/>
            <img src="/mascote.png" alt="Mascote"
              onError={e=>{e.target.style.display='none'}}
              style={{
                position:'absolute',
                left: isMobile ? 8 : 6,
                bottom: 0,
                height: isMobile ? '90%' : '20%',
                objectFit:'contain',
                filter:'drop-shadow(2px 0 8px rgba(0,0,0,0.9))',
                animation:'mascoteFloat 3s ease-in-out infinite',
                zIndex:5,
              }}/>
            {/* dots */}
            <div style={{position:'absolute',bottom:6,left:0,right:0,display:'flex',gap:4,justifyContent:'center',zIndex:6}}>
              {LOJAS.map((_,i)=>(
                <div key={i} onClick={()=>setLojaAtual(i)}
                  style={{width:i===lojaAtual?16:5,height:4,borderRadius:2,background:i===lojaAtual?'#FFD400':'rgba(255,255,255,0.4)',transition:'all 0.3s',cursor:'pointer'}}/>
              ))}
            </div>
          </div>

          {/* COLUNA DIREITA */}
          <div style={{
            flex:1, display:'flex', flexDirection:'column',
            gap:6, minHeight:0,
            overflow:'hidden',
          }}>

            {/* CARROSSEL */}
            <div style={{background:'#111',borderRadius:10,padding:isMobile?'6px 8px 4px':'8px 10px 6px',flexShrink:0}}>
              <div style={{textAlign:'center',marginBottom:isMobile?5:7,fontSize:isMobile?13:17,fontWeight:900,color:'#fff',letterSpacing:2}}>
                PNEU<span style={{color:'#FFD400'}}>FORTE</span> PROMOÇÕES
              </div>
              <div style={{display:'flex',alignItems:'center',gap:4}}>
                <button type="button" onClick={()=>setCarrosselIdx(p=>p>0?p-1:CARROSSEL_ITEMS.length-VISIVEIS)}
                  style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,width:isMobile?24:28,height:isMobile?64:86,cursor:'pointer',color:'#fff',fontSize:20,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                <div style={{flex:1,display:'grid',gridTemplateColumns:`repeat(${VISIVEIS},1fr)`,gap:isMobile?4:6}}>
                  {CARROSSEL_ITEMS.slice(carrosselIdx,carrosselIdx+VISIVEIS).map((c,i)=>(
                    <div key={i} style={{background:'#1a1a1a',borderRadius:7,overflow:'hidden',display:'flex',flexDirection:'column'}}>
                      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'4px 3px',minHeight:isMobile?44:64}}>
                        <img src={c.img} alt="" onError={e=>{e.target.style.display='none'}}
                          style={{width:'100%',maxHeight:isMobile?42:60,objectFit:'contain',filter:'drop-shadow(0 2px 6px rgba(0,0,0,0.7))'}}/>
                      </div>
                      <div style={{background:'#111',padding:'3px 3px 4px',textAlign:'center',fontSize:isMobile?9:12,fontWeight:900,color:'#FFD400',fontFamily:'monospace',letterSpacing:0.5}}>
                        {c.medida}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>setCarrosselIdx(p=>p<CARROSSEL_ITEMS.length-VISIVEIS?p+1:0)}
                  style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,width:isMobile?24:28,height:isMobile?64:86,cursor:'pointer',color:'#fff',fontSize:20,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
              </div>
              <div style={{display:'flex',gap:3,justifyContent:'center',marginTop:5}}>
                {Array.from({length:CARROSSEL_ITEMS.length-VISIVEIS+1}).map((_,i)=>(
                  <div key={i} style={{width:i===carrosselIdx?14:4,height:3,borderRadius:2,background:i===carrosselIdx?'#FFD400':'rgba(255,255,255,0.2)',transition:'all 0.3s'}}/>
                ))}
              </div>
            </div>

            {/* GRADE BOTÕES */}
            <div style={{
              flex: 1,
              display:'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
              gridTemplateRows: isMobile ? 'repeat(4,1fr)' : '1fr 1fr',
              gap: isMobile ? 5 : 8,
              minHeight: isMobile ? 0 : 0,
            }}>
              {BOTOES.map((b, idx) => (
                <button key={idx} type="button" onClick={b.acao}
                  onTouchStart={e=>e.currentTarget.style.transform='scale(0.98)'}
                  onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                  style={{
                    border:'none', borderRadius:12, cursor:'pointer',
                    padding:0, overflow:'hidden', position:'relative',
                    transition:'transform 0.12s',
                    background: b.bg,
                    boxShadow:'0 3px 16px rgba(0,0,0,0.5)',
                  }}>
                  {/* badge NOVO */}
                  {b.badge && <>
                    <div style={{position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 56px 56px 0',borderColor:'transparent #1565C0 transparent transparent',zIndex:3}}/>
                    <div style={{position:'absolute',top:9,right:4,color:'#fff',fontSize:9,fontWeight:900,letterSpacing:1,transform:'rotate(45deg)',zIndex:4}}>NOVO</div>
                  </>}
                  {/* glow radial */}
                  <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 10% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)'}}/>
                  {/* conteúdo */}
                  <div style={{
                    position:'relative', zIndex:2,
                    height:'100%',
                    display:'flex', flexDirection:'column',
                    justifyContent:'center',
                    padding: isMobile ? '10px 16px' : '14px 22px',
                    gap: isMobile ? 4 : 6,
                  }}>
                    {/* título grande */}
                    <div style={{
                      fontSize: isMobile ? 'clamp(16px,5vw,22px)' : 'clamp(20px,2.4vw,30px)',
                      fontWeight:900, color: b.tituloCor,
                      lineHeight:1, letterSpacing:0.5,
                      textShadow:'0 2px 8px rgba(0,0,0,0.7)',
                      whiteSpace:'pre-line',
                    }}>{b.titulo}</div>
                    {/* texto descritivo */}
                    <div style={{
                      fontSize: isMobile ? 11 : 12,
                      color:'rgba(255,255,255,0.55)',
                      fontFamily:'sans-serif',
                      lineHeight:1.4,
                      fontWeight:400,
                    }}>{b.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{background:'#111',height:isMobile?38:40,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding: isMobile ? '0 12px' : '0 20px',borderTop:'2px solid #1a1a1a'}}>
          <div style={{display:'flex',alignItems:'center',gap:6}}>
            <svg viewBox="0 0 30 30" style={{width:20,height:20}}>
              <circle cx="15" cy="15" r="13" fill="none" stroke="#FFD400" strokeWidth="2"/>
              {Array.from({length:10}).map((_,i)=>{const a=(i/10)*Math.PI*2;return <line key={i} x1={15+Math.cos(a)*9} y1={15+Math.sin(a)*9} x2={15+Math.cos(a)*13} y2={15+Math.sin(a)*13} stroke="#FFD400" strokeWidth="2"/>;  })}
              <circle cx="15" cy="15" r="4.5" fill="#FFD400"/>
            </svg>
            <span style={{fontSize:isMobile?13:15,fontWeight:900,color:'#fff'}}>PNEU<span style={{color:'#FFD400'}}>FORTE</span></span>
          </div>
          <div style={{display:'flex',gap:14,alignItems:'center'}}>
            <span style={{fontSize:isMobile?17:20,cursor:'pointer'}}>👤</span>
            <span style={{fontSize:isMobile?17:20,cursor:'pointer'}}>⚙️</span>
            <span style={{fontSize:isMobile?17:20,cursor:'pointer'}}>☁️</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes mascoteFloat {
          0%,100%{transform:translateY(0) rotate(-1deg);}
          50%{transform:translateY(-10px) rotate(1deg);}
        }
      `}</style>
    </div>
  );
}
