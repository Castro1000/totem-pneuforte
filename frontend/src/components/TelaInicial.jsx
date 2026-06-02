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

  // ── BOTÕES — dados ──────────────────────────────────────────
  const BOTOES = [
    {
      acao: () => iniciarTotem('placa'),
      bg: 'linear-gradient(135deg,#1a1200 0%,#3a2800 40%,#c69000 100%)',
      glow: 'rgba(255,212,0,0.25)',
      cat: '🚗 Identificação', catCor: 'rgba(255,212,0,0.75)',
      titulo: ['CONSULTA', 'POR PLACA'], tituloCor: '#fff', destaque: '#FFD400',
      sub: 'TOQUE PARA INICIAR →', subCor: 'rgba(255,255,255,0.55)',
      icone: (
        <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:4,flexShrink:0}}>
          <div style={{background:'#fff',borderRadius:6,padding:'3px 10px',border:'2.5px solid #FFD400',textAlign:'center'}}>
            <div style={{fontSize:7,color:'#1565C0',fontWeight:900,fontFamily:'sans-serif',letterSpacing:1}}>LICENÇA</div>
            <div style={{fontSize:isMobile?11:14,fontWeight:900,color:'#111',fontFamily:'monospace',letterSpacing:2}}>ABC·1234</div>
          </div>
          <svg viewBox="0 0 80 48" style={{width:isMobile?56:72,height:isMobile?34:44,filter:'drop-shadow(0 3px 6px rgba(0,0,0,0.6))'}}>
            <path d="M8 32 L8 22 L20 10 L60 10 L72 22 L72 32 Z" fill="#FFD400" stroke="#111" strokeWidth="2"/>
            <rect x="6" y="30" width="68" height="10" rx="5" fill="#FFD400" stroke="#111" strokeWidth="2"/>
            <circle cx="20" cy="40" r="7" fill="#222" stroke="#FFD400" strokeWidth="2.5"/>
            <circle cx="20" cy="40" r="3" fill="#FFD400"/>
            <circle cx="60" cy="40" r="7" fill="#222" stroke="#FFD400" strokeWidth="2.5"/>
            <circle cx="60" cy="40" r="3" fill="#FFD400"/>
            <path d="M22 22 L28 11 L52 11 L58 22 Z" fill="#111" opacity="0.4"/>
          </svg>
        </div>
      ),
    },
    {
      acao: () => iniciarTotem('modelo'),
      bg: 'linear-gradient(135deg,#0a0a1a 0%,#1a1040 50%,#2d1b6e 100%)',
      glow: 'rgba(99,102,241,0.3)',
      badge: 'NOVO',
      cat: '🔍 Pesquisa', catCor: 'rgba(139,92,246,0.85)',
      titulo: ['CONSULTA', 'AVANÇADA'], tituloCor: '#fff', destaque: '#a78bfa',
      sub: null,
      icone: (
        <svg viewBox="0 0 80 80" style={{width:isMobile?52:70,height:isMobile?52:70,flexShrink:0,filter:'drop-shadow(0 3px 10px rgba(99,102,241,0.5))'}}>
          <circle cx="34" cy="34" r="24" fill="rgba(99,102,241,0.15)" stroke="#a78bfa" strokeWidth="3.5"/>
          <circle cx="34" cy="34" r="15" fill="rgba(99,102,241,0.08)" stroke="rgba(167,139,250,0.3)" strokeWidth="1.5"/>
          <line x1="52" y1="52" x2="73" y2="73" stroke="#a78bfa" strokeWidth="5.5" strokeLinecap="round"/>
          {Array.from({length:8}).map((_,i)=>{const a=(i/8)*Math.PI*2;return <line key={i} x1={34+Math.cos(a)*24} y1={34+Math.sin(a)*24} x2={34+Math.cos(a)*29} y2={34+Math.sin(a)*29} stroke="rgba(167,139,250,0.35)" strokeWidth="2" strokeLinecap="round"/>;  })}
        </svg>
      ),
    },
    {
      acao: () => { setEmBreve('Simulador de Orçamento'); setTimeout(() => setEmBreve(null), 3000); },
      bg: 'linear-gradient(135deg,#001a0a 0%,#003d1a 50%,#005c22 100%)',
      glow: 'rgba(0,200,80,0.2)',
      cat: '💰 Preços', catCor: 'rgba(0,230,100,0.75)',
      titulo: ['SIMULAR', 'ORÇAMENTO'], tituloCor: '#fff', destaque: '#4ade80',
      sub: 'TOQUE PARA INICIAR →', subCor: 'rgba(74,222,128,0.65)',
      icone: (
        <div style={{flexShrink:0,filter:'drop-shadow(0 3px 10px rgba(74,222,128,0.4))'}}>
          <div style={{fontSize:isMobile?42:56,fontWeight:900,color:'#4ade80',lineHeight:1,textShadow:'0 0 24px rgba(74,222,128,0.5)'}}>R$</div>
          <div style={{fontSize:9,fontWeight:700,color:'rgba(255,255,255,0.35)',fontFamily:'sans-serif',letterSpacing:1,textAlign:'center'}}>COMPARE</div>
        </div>
      ),
    },
    {
      acao: () => { setEmBreve('Forte Club — Programa de Fidelidade'); setTimeout(() => setEmBreve(null), 3000); },
      bg: 'linear-gradient(135deg,#1a0500 0%,#3d1000 50%,#6e2200 100%)',
      glow: 'rgba(251,146,60,0.25)',
      cat: '⭐ Fidelidade', catCor: 'rgba(251,146,60,0.8)',
      titulo: ['PROGRAMA', 'DE FIDELIDADE'], tituloCor: '#fff', destaque: '#fb923c',
      sub: null,
      icone: (
        <svg viewBox="0 0 70 80" style={{width:isMobile?50:64,height:isMobile?58:72,flexShrink:0,filter:'drop-shadow(0 3px 10px rgba(251,146,60,0.5))'}}>
          <path d="M20 6 L50 6 L50 42 Q50 57 35 60 Q20 57 20 42 Z" fill="#fb923c" stroke="#f97316" strokeWidth="2"/>
          <path d="M20 13 L7 13 Q3 13 3 19 Q3 31 20 35" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"/>
          <path d="M50 13 L63 13 Q67 13 67 19 Q67 31 50 35" fill="none" stroke="#fbbf24" strokeWidth="3.5" strokeLinecap="round"/>
          <rect x="30" y="60" width="10" height="12" rx="2" fill="#fb923c"/>
          <rect x="20" y="71" width="30" height="6" rx="3" fill="#f97316"/>
          <text x="35" y="38" textAnchor="middle" fontSize="20" fill="#fff" fontWeight="900">1</text>
        </svg>
      ),
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
            <img src="/logo.png" alt="" style={{height:isMobile?28:34,objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>
            <span style={{fontSize:isMobile?20:28,fontWeight:900,color:'#fff',letterSpacing:1}}>
              PNEU<span style={{color:'#FFD400'}}>FORTE</span>
            </span>
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
          overflow: isMobile ? 'auto' : 'hidden',
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
                left:6, bottom: isMobile ? 16 : 24,
                height: isMobile ? '75%' : '20%',
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
            overflow: isMobile ? 'visible' : 'hidden',
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

            {/* GRADE BOTÕES 2x2 */}
            <div style={{
              flex: isMobile ? 'none' : 1,
              display:'grid',
              gridTemplateColumns:'1fr 1fr',
              gridTemplateRows: isMobile ? 'auto auto' : '1fr 1fr',
              gap: isMobile ? 6 : 8,
              minHeight: isMobile ? 'auto' : 0,
            }}>
              {BOTOES.map((b, idx) => (
                <button key={idx} type="button" onClick={b.acao}
                  onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                  onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                  style={{
                    border:'none', borderRadius:12, cursor:'pointer',
                    padding:0, overflow:'hidden', position:'relative',
                    transition:'transform 0.12s',
                    background: b.bg,
                    boxShadow:'0 3px 16px rgba(0,0,0,0.5)',
                    minHeight: isMobile ? 100 : 'auto',
                  }}>
                  {/* badge NOVO */}
                  {b.badge && <>
                    <div style={{position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 64px 64px 0',borderColor:'transparent #1565C0 transparent transparent',zIndex:3}}/>
                    <div style={{position:'absolute',top:10,right:5,color:'#fff',fontSize:9,fontWeight:900,letterSpacing:1,transform:'rotate(45deg)',zIndex:4}}>NOVO</div>
                  </>}
                  {/* glow */}
                  <div style={{position:'absolute',inset:0,background:`radial-gradient(ellipse at 80% 50%,${b.glow} 0%,transparent 70%)`}}/>
                  {/* conteúdo */}
                  <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding: isMobile ? '10px 12px' : '0 18px'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:isMobile?9:10,fontWeight:700,color:b.catCor,letterSpacing:2,textTransform:'uppercase',fontFamily:'sans-serif',marginBottom:3}}>{b.cat}</div>
                      <div style={{fontSize:isMobile?'clamp(14px,4vw,18px)':'clamp(16px,2vw,26px)',fontWeight:900,color:b.tituloCor,lineHeight:0.95,letterSpacing:-0.3,textShadow:'0 2px 6px rgba(0,0,0,0.8)'}}>
                        {b.titulo[0]}<br/><span style={{color:b.destaque}}>{b.titulo[1]}</span>
                      </div>
                      {b.sub && (
                        <div style={{marginTop:6,background:'rgba(0,0,0,0.4)',borderRadius:5,padding:'2px 8px',display:'inline-block',border:'1px solid rgba(255,255,255,0.12)'}}>
                          <span style={{fontSize:8,color:b.subCor,fontFamily:'sans-serif',letterSpacing:1,textTransform:'uppercase'}}>{b.sub}</span>
                        </div>
                      )}
                    </div>
                    <div style={{flexShrink:0, marginLeft:8}}>{b.icone}</div>
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
