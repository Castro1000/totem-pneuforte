import { useEffect, useState } from 'react';

const LOJAS = ['/loja1.jpeg','/loja2.jpeg','/loja3.jpeg','/loja4.jpeg','/loja5.jpeg'];

const MARCAS_PARCEIRAS = ['XBRI','ROADCRUZA','WESTLAKE','LINGLONG','SAILUN','DURABLE','SPEEDMAX'];

const CARROSSEL_ITEMS = [
  { img: '/pneu-dunlop.png',  medida: '205/55R16', label: 'PROMOÇÕES',   labelCor: '#E53935' },
  { img: '/pneu-xbri.png',   medida: '185/65R15', label: 'PROMOÇÕES',   labelCor: '#E53935' },
  { img: '/pneu-falken.png', medida: '225/45R17', label: 'S-SERVIÇO',   labelCor: '#E53935' },
  { img: '/pneu-dunlop.png',  medida: '195/60R15', label: 'SERVICES',    labelCor: '#1a1a1a' },
  { img: '/pneu-xbri.png',   medida: '175/70R13', label: 'PROMOÇÕES',   labelCor: '#E53935' },
];

function IcoMao({ size = 32, cor = '#FFD400' }) {
  return (
    <svg viewBox="0 0 50 60" style={{ width: size, height: size * 1.2, flexShrink: 0 }}>
      <path d="M25 4 Q21 4 21 8 L21 9 Q18 9 18 13 L18 14 Q15 14 15 18 L15 24 Q12 22 10 24 Q8 28 11 32 L18 42 Q22 50 30 52 Q40 54 44 44 L44 28 Q44 24 40 24 L38 24 L38 18 Q38 14 34 14 L32 14 L32 9 Q32 5 28 4 Z"
        fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round"/>
    </svg>
  );
}

function IcoPlacaCarro({ cor = '#FFD400' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
      <div style={{ background:'rgba(255,255,255,0.15)', border:`1.5px solid ${cor}`, borderRadius:5, padding:'2px 8px', textAlign:'center' }}>
        <div style={{ fontSize:7, color:cor, fontWeight:900, fontFamily:'sans-serif', letterSpacing:1 }}>LCENÇA</div>
        <div style={{ fontSize:12, fontWeight:900, color:'#fff', fontFamily:'monospace', letterSpacing:2 }}>ABC-1234</div>
      </div>
      <svg viewBox="0 0 60 36" style={{ width:54, height:32 }}>
        <path d="M6 24 L6 17 L15 8 L45 8 L54 17 L54 24 Z" fill="none" stroke={cor} strokeWidth="2.5" strokeLinejoin="round"/>
        <rect x="4" y="22" width="52" height="7" rx="3.5" fill="none" stroke={cor} strokeWidth="2"/>
        <circle cx="15" cy="29" r="5.5" fill="none" stroke={cor} strokeWidth="2.5"/>
        <circle cx="45" cy="29" r="5.5" fill="none" stroke={cor} strokeWidth="2.5"/>
        <path d="M17 17 L22 9 L38 9 L43 17 Z" fill="none" stroke={cor} strokeWidth="1.5"/>
        <rect x="8" y="19" width="10" height="4" rx="2" fill={cor} opacity="0.3"/>
        <rect x="42" y="19" width="10" height="4" rx="2" fill={cor} opacity="0.3"/>
      </svg>
    </div>
  );
}

function IcoLupaEngrenagem({ cor = '#333' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      <svg viewBox="0 0 44 44" style={{ width:38, height:38 }}>
        <circle cx="18" cy="18" r="11" fill="none" stroke={cor} strokeWidth="3"/>
        <line x1="27" y1="27" x2="40" y2="40" stroke={cor} strokeWidth="3.5" strokeLinecap="round"/>
        <circle cx="13" cy="13" r="4" fill="none" stroke={cor} strokeWidth="1.5" opacity="0.4"/>
      </svg>
      <svg viewBox="0 0 38 38" style={{ width:32, height:32 }}>
        <circle cx="19" cy="19" r="10" fill="none" stroke={cor} strokeWidth="2.5"/>
        <circle cx="19" cy="19" r="4.5" fill="none" stroke={cor} strokeWidth="2"/>
        {Array.from({length:8}).map((_,i)=>{
          const a=(i/8)*Math.PI*2;
          return <line key={i} x1={19+Math.cos(a)*10} y1={19+Math.sin(a)*10} x2={19+Math.cos(a)*14} y2={19+Math.sin(a)*14} stroke={cor} strokeWidth="2.5" strokeLinecap="round"/>;
        })}
      </svg>
    </div>
  );
}

function IcoPP({ cor = '#555', size = 36 }) {
  return (
    <svg viewBox="0 0 52 30" style={{ width:size*1.7, height:size, flexShrink:0 }}>
      <circle cx="13" cy="15" r="11" fill="none" stroke={cor} strokeWidth="2.5"/>
      <text x="13" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill={cor} fontFamily="Arial Bold, Arial">P</text>
      <circle cx="39" cy="15" r="11" fill="none" stroke={cor} strokeWidth="2.5"/>
      <text x="39" y="20" textAnchor="middle" fontSize="12" fontWeight="900" fill={cor} fontFamily="Arial Bold, Arial">P</text>
    </svg>
  );
}

export default function TelaInicial({ animandoEntrada, iniciarTotem, teclaRef }) {
  const [lojaAtual, setLojaAtual] = useState(0);
  const [carrosselIdx, setCarrosselIdx] = useState(0);
  const [hora, setHora] = useState('');
  const [emBreve, setEmBreve] = useState(null);
  const [fadeIn, setFadeIn] = useState(true);
  const VISIVEIS = 4;

  useEffect(() => {
    const el = document.documentElement;
    if (el.requestFullscreen && !document.fullscreenElement) el.requestFullscreen().catch(()=>{});
  }, []);

  useEffect(() => {
    const fn = () => {
      const d = new Date();
      setHora(`${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`);
    };
    fn(); const t = setInterval(fn, 10000); return ()=>clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => { setLojaAtual(p=>(p+1)%LOJAS.length); setFadeIn(true); }, 350);
    }, 4500);
    return ()=>clearInterval(t);
  }, []);

  // Auto-rotate carrossel
  useEffect(() => {
    const t = setInterval(() => {
      setCarrosselIdx(p => (p + 1) % (CARROSSEL_ITEMS.length - VISIVEIS + 1));
    }, 2500);
    return ()=>clearInterval(t);
  }, []);

  return (
    <div className={`entrada-full kiosk-home ${animandoEntrada?'entrada-full-saindo':''}`}>
      <audio ref={teclaRef} src="/tecla.mp3" preload="auto"/>
      <div className={`overlay-escuro ${animandoEntrada?'overlay-escuro-ativo':''}`}/>
      <div className={`vinheta-cinema ${animandoEntrada?'vinheta-cinema-ativa':''}`}/>
      <div className={`onda-luz ${animandoEntrada?'onda-luz-ativa':''}`}/>
      <div className={`clarão-tela ${animandoEntrada?'clarão-tela-ativo':''}`}/>
      <div className={`faixa-luz ${animandoEntrada?'faixa-luz-ativa':''}`}/>

      {emBreve && (
        <div style={{position:'fixed',inset:0,zIndex:9999,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(0,0,0,0.85)',backdropFilter:'blur(8px)'}}>
          <div style={{background:'#111',border:'2px solid #FFD400',borderRadius:24,padding:'48px 56px',textAlign:'center'}}>
            <div style={{fontSize:56,marginBottom:16}}>🚧</div>
            <div style={{color:'#FFD400',fontSize:28,fontWeight:900,marginBottom:8}}>EM BREVE!</div>
            <div style={{color:'#fff',fontSize:18,fontWeight:700,marginBottom:8}}>{emBreve}</div>
            <div style={{color:'#666',fontSize:14,fontFamily:'sans-serif',lineHeight:1.5}}>Este módulo está sendo desenvolvido<br/>e estará disponível em breve.</div>
          </div>
        </div>
      )}

      <div className={`kiosk-shell ${animandoEntrada?'kiosk-shell-saindo':''}`} style={{
        width:'100vw', height:'100vh',
        background:'#2a2a2a',
        display:'flex', flexDirection:'column',
        fontFamily:"'Barlow Condensed','Arial Narrow',Arial,sans-serif",
        overflow:'hidden',
      }}>

        {/* TOPBAR */}
        <div style={{background:'#111',height:50,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',flexShrink:0,borderBottom:'2px solid #1a1a1a'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <img src="/logo.png" alt="" style={{height:34,objectFit:'contain'}} onError={e=>{e.target.style.display='none'}}/>
            <span style={{fontSize:30,fontWeight:900,color:'#fff',letterSpacing:1}}>PNEU<span style={{color:'#FFD400'}}>FORTE</span></span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{background:'#1e1e1e',borderRadius:8,padding:'5px 18px',display:'flex',alignItems:'center',gap:8,border:'1px solid #333'}}>
              <span style={{fontSize:13,color:'#888',fontFamily:'sans-serif'}}>Ronina: 10</span>
              <span style={{fontSize:22,fontWeight:900,color:'#fff',letterSpacing:1}}>{hora}</span>
            </div>
            <button type="button" style={{background:'transparent',border:'1px solid #555',borderRadius:8,padding:'7px 18px',color:'#fff',fontSize:15,fontWeight:700,cursor:'pointer',display:'flex',alignItems:'center',gap:6}}>
              Grauser
              <svg viewBox="0 0 20 20" style={{width:16,height:16}}><path d="M14 10H4M14 10L10 6M14 10L10 14" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round"/><rect x="13" y="4" width="3" height="12" rx="1" fill="#fff" opacity="0.5"/></svg>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{flex:1,display:'flex',overflow:'hidden',minHeight:0,gap:8,padding:8}}>

          {/* ── ESQUERDA ── */}
          <div style={{width:'38%',position:'relative',borderRadius:14,overflow:'hidden',flexShrink:0}}>

            {/* foto loja fundo */}
            <img key={lojaAtual} src={LOJAS[lojaAtual]} alt="Loja"
              onError={e=>{e.target.style.opacity=0}}
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',opacity:fadeIn?1:0,transition:'opacity 0.35s ease',zIndex:1}}/>
            {/* overlay escuro */}
            <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.45)',zIndex:2}}/>

            {/* mascote — cantinho inferior esquerdo, bem pequeno */}
            <img src="/mascote.png" alt="Mascote"
              onError={e=>{e.target.style.display='none'}}
              style={{
                position:'absolute',
                left:6, bottom:20,
                height:'18%',
                objectFit:'contain',
                filter:'drop-shadow(2px 0 8px rgba(0,0,0,0.9))',
                animation:'mascoteFloat 3s ease-in-out infinite',
                zIndex:5,
              }}/>

            {/* dots lojas */}
            <div style={{position:'absolute',bottom:8,left:0,right:0,display:'flex',gap:5,justifyContent:'center',zIndex:6}}>
              {LOJAS.map((_,i)=>(
                <div key={i} onClick={()=>setLojaAtual(i)}
                  style={{width:i===lojaAtual?18:5,height:5,borderRadius:3,background:i===lojaAtual?'#FFD400':'rgba(255,255,255,0.45)',transition:'all 0.3s',cursor:'pointer'}}/>
              ))}
            </div>
          </div>

          {/* ── DIREITA ── */}
          <div style={{flex:1,display:'flex',flexDirection:'column',gap:8,minHeight:0}}>

            {/* CARROSSEL PNEUFORTE PROMOÇÕES */}
            <div style={{background:'#111',borderRadius:12,padding:'8px 10px 6px',flexShrink:0}}>
              <div style={{textAlign:'center',marginBottom:8}}>
                <span style={{fontSize:18,fontWeight:900,color:'#fff',letterSpacing:2}}>
                  PNEU<span style={{color:'#FFD400'}}>FORTE</span> PROMOÇÕES
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <button type="button" onClick={()=>setCarrosselIdx(p=>Math.max(0,p-1))}
                  style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,width:28,height:90,cursor:'pointer',color:'#fff',fontSize:24,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>‹</button>
                <div style={{flex:1,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
                  {CARROSSEL_ITEMS.slice(carrosselIdx,carrosselIdx+VISIVEIS).map((c,i)=>(
                    <div key={i} style={{background:'#1a1a1a',borderRadius:8,overflow:'hidden',cursor:'pointer',display:'flex',flexDirection:'column'}}>
                      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',padding:'6px 4px',minHeight:70}}>
                        <img src={c.img} alt="" onError={e=>{e.target.style.display='none'}}
                          style={{width:'100%',height:68,objectFit:'contain',filter:'drop-shadow(0 3px 8px rgba(0,0,0,0.7))'}}/>
                      </div>
                      <div style={{background:'#111',padding:'5px 4px 6px',textAlign:'center'}}>
                        <div style={{fontSize:13,fontWeight:900,color:'#FFD400',fontFamily:'monospace',letterSpacing:1}}>{c.medida}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={()=>setCarrosselIdx(p=>Math.min(CARROSSEL_ITEMS.length-VISIVEIS,p+1))}
                  style={{background:'rgba(255,255,255,0.08)',border:'none',borderRadius:6,width:28,height:90,cursor:'pointer',color:'#fff',fontSize:24,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center'}}>›</button>
              </div>
              <div style={{display:'flex',gap:4,justifyContent:'center',marginTop:6}}>
                {Array.from({length:CARROSSEL_ITEMS.length-VISIVEIS+1}).map((_,i)=>(
                  <div key={i} style={{width:i===carrosselIdx?16:5,height:4,borderRadius:2,background:i===carrosselIdx?'#FFD400':'rgba(255,255,255,0.2)',transition:'all 0.3s'}}/>
                ))}
              </div>
            </div>

            {/* GRADE 2x2 BOTÕES — estilo thumbnail */}
            <div style={{flex:1,display:'grid',gridTemplateColumns:'1fr 1fr',gridTemplateRows:'1fr 1fr',gap:10,minHeight:0}}>

              {/* CONSULTA POR PLACA */}
              <button type="button" onClick={()=>iniciarTotem('placa')}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                style={{border:'none',borderRadius:14,cursor:'pointer',padding:0,overflow:'hidden',position:'relative',transition:'transform 0.12s',
                  background:'linear-gradient(135deg, #1a1200 0%, #3a2800 40%, #FFD400 100%)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                {/* fundo brilho */}
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 50%, rgba(255,212,0,0.25) 0%, transparent 70%)'}}/>
                {/* conteúdo */}
                <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(255,212,0,0.7)',letterSpacing:3,textTransform:'uppercase',fontFamily:'sans-serif',marginBottom:4}}>🚗 Identificação</div>
                    <div style={{fontSize:30,fontWeight:900,color:'#fff',lineHeight:0.95,letterSpacing:-0.5,textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>CONSULTA<br/><span style={{color:'#FFD400'}}>POR PLACA</span></div>
                    <div style={{marginTop:10,background:'rgba(0,0,0,0.4)',borderRadius:6,padding:'3px 10px',display:'inline-block',border:'1px solid rgba(255,212,0,0.3)'}}>
                      <span style={{fontSize:9,color:'rgba(255,255,255,0.6)',fontFamily:'sans-serif',letterSpacing:1.5,textTransform:'uppercase'}}>TOQUE PARA INICIAR →</span>
                    </div>
                  </div>
                  {/* placa + carro SVG grande */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6,flexShrink:0}}>
                    <div style={{background:'#fff',borderRadius:8,padding:'4px 12px',border:'3px solid #FFD400',textAlign:'center',boxShadow:'0 4px 12px rgba(0,0,0,0.5)'}}>
                      <div style={{fontSize:8,color:'#1565C0',fontWeight:900,fontFamily:'sans-serif',letterSpacing:1}}>LICENÇA</div>
                      <div style={{fontSize:16,fontWeight:900,color:'#111',fontFamily:'monospace',letterSpacing:3}}>ABC·1234</div>
                    </div>
                    <svg viewBox="0 0 80 48" style={{width:80,height:48,filter:'drop-shadow(0 4px 8px rgba(0,0,0,0.6))'}}>
                      <path d="M8 32 L8 22 L20 10 L60 10 L72 22 L72 32 Z" fill="#FFD400" stroke="#111" strokeWidth="2"/>
                      <rect x="6" y="30" width="68" height="10" rx="5" fill="#FFD400" stroke="#111" strokeWidth="2"/>
                      <circle cx="20" cy="40" r="7" fill="#222" stroke="#FFD400" strokeWidth="2.5"/>
                      <circle cx="20" cy="40" r="3" fill="#FFD400"/>
                      <circle cx="60" cy="40" r="7" fill="#222" stroke="#FFD400" strokeWidth="2.5"/>
                      <circle cx="60" cy="40" r="3" fill="#FFD400"/>
                      <path d="M22 22 L28 11 L52 11 L58 22 Z" fill="#111" opacity="0.4"/>
                      <rect x="14" y="29" width="12" height="5" rx="2.5" fill="#fff" opacity="0.8"/>
                      <rect x="54" y="29" width="12" height="5" rx="2.5" fill="#fff" opacity="0.8"/>
                    </svg>
                  </div>
                </div>
              </button>

              {/* CONSULTA AVANÇADA */}
              <button type="button" onClick={()=>iniciarTotem('modelo')}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                style={{border:'none',borderRadius:14,cursor:'pointer',padding:0,overflow:'hidden',position:'relative',transition:'transform 0.12s',
                  background:'linear-gradient(135deg, #0a0a1a 0%, #1a1040 50%, #2d1b6e 100%)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                {/* badge NOVO */}
                <div style={{position:'absolute',top:0,right:0,width:0,height:0,borderStyle:'solid',borderWidth:'0 80px 80px 0',borderColor:'transparent #1565C0 transparent transparent',zIndex:3}}/>
                <div style={{position:'absolute',top:13,right:6,color:'#fff',fontSize:10,fontWeight:900,letterSpacing:1,transform:'rotate(45deg)',zIndex:4}}>NOVO</div>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 50%, rgba(99,102,241,0.3) 0%, transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(139,92,246,0.8)',letterSpacing:3,textTransform:'uppercase',fontFamily:'sans-serif',marginBottom:4}}>🔍 Pesquisa</div>
                    <div style={{fontSize:30,fontWeight:900,color:'#fff',lineHeight:0.95,letterSpacing:-0.5,textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>CONSULTA<br/><span style={{color:'#a78bfa'}}>AVANÇADA</span></div>
                    <div style={{marginTop:10,display:'flex',alignItems:'center',gap:6}}>
                      <svg viewBox="0 0 44 26" style={{width:32,height:18}}><circle cx="11" cy="13" r="9" fill="none" stroke="#a78bfa" strokeWidth="2"/><text x="11" y="18" textAnchor="middle" fontSize="10" fontWeight="900" fill="#a78bfa" fontFamily="Arial">P</text><circle cx="33" cy="13" r="9" fill="none" stroke="#a78bfa" strokeWidth="2"/><text x="33" y="18" textAnchor="middle" fontSize="10" fontWeight="900" fill="#a78bfa" fontFamily="Arial">P</text></svg>
                      <span style={{fontSize:10,color:'rgba(255,255,255,0.45)',fontFamily:'sans-serif'}}>Acumule pontos</span>
                    </div>
                  </div>
                  {/* lupa grande SVG */}
                  <svg viewBox="0 0 90 90" style={{width:80,height:80,flexShrink:0,filter:'drop-shadow(0 4px 12px rgba(99,102,241,0.5))'}}>
                    <circle cx="38" cy="38" r="28" fill="rgba(99,102,241,0.15)" stroke="#a78bfa" strokeWidth="4"/>
                    <circle cx="38" cy="38" r="18" fill="rgba(99,102,241,0.1)" stroke="rgba(167,139,250,0.4)" strokeWidth="2"/>
                    <line x1="58" y1="58" x2="82" y2="82" stroke="#a78bfa" strokeWidth="6" strokeLinecap="round"/>
                    <circle cx="30" cy="30" r="7" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2"/>
                    {Array.from({length:8}).map((_,i)=>{const a=(i/8)*Math.PI*2;return <line key={i} x1={38+Math.cos(a)*28} y1={38+Math.sin(a)*28} x2={38+Math.cos(a)*33} y2={38+Math.sin(a)*33} stroke="rgba(167,139,250,0.4)" strokeWidth="2.5" strokeLinecap="round"/>;  })}
                  </svg>
                </div>
              </button>

              {/* SIMULAR ORÇAMENTO */}
              <button type="button"
                onClick={()=>{setEmBreve('Simulador de Orçamento');setTimeout(()=>setEmBreve(null),3000);}}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                style={{border:'none',borderRadius:14,cursor:'pointer',padding:0,overflow:'hidden',position:'relative',transition:'transform 0.12s',
                  background:'linear-gradient(135deg, #001a0a 0%, #003d1a 50%, #006e2e 100%)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 50%, rgba(0,200,80,0.2) 0%, transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(0,230,100,0.7)',letterSpacing:3,textTransform:'uppercase',fontFamily:'sans-serif',marginBottom:4}}>💰 Preços</div>
                    <div style={{fontSize:30,fontWeight:900,color:'#fff',lineHeight:0.95,letterSpacing:-0.5,textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>SIMULAR<br/><span style={{color:'#4ade80'}}>ORÇAMENTO</span></div>
                    <div style={{marginTop:10,background:'rgba(0,0,0,0.4)',borderRadius:6,padding:'3px 10px',display:'inline-block',border:'1px solid rgba(74,222,128,0.3)'}}>
                      <span style={{fontSize:9,color:'rgba(74,222,128,0.7)',fontFamily:'sans-serif',letterSpacing:1.5,textTransform:'uppercase'}}>TOQUE PARA INICIAR →</span>
                    </div>
                  </div>
                  {/* R$ grande */}
                  <div style={{display:'flex',flexDirection:'column',alignItems:'center',flexShrink:0,filter:'drop-shadow(0 4px 12px rgba(74,222,128,0.4))'}}>
                    <div style={{fontSize:64,fontWeight:900,color:'#4ade80',lineHeight:1,textShadow:'0 0 30px rgba(74,222,128,0.5)'}}>R$</div>
                    <div style={{fontSize:14,fontWeight:700,color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif',letterSpacing:1}}>COMPARE PREÇOS</div>
                  </div>
                </div>
              </button>

              {/* PROGRAMA DE FIDELIDADE */}
              <button type="button"
                onClick={()=>{setEmBreve('Forte Club — Programa de Fidelidade');setTimeout(()=>setEmBreve(null),3000);}}
                onTouchStart={e=>e.currentTarget.style.transform='scale(0.97)'}
                onTouchEnd={e=>e.currentTarget.style.transform='scale(1)'}
                style={{border:'none',borderRadius:14,cursor:'pointer',padding:0,overflow:'hidden',position:'relative',transition:'transform 0.12s',
                  background:'linear-gradient(135deg, #1a0500 0%, #3d1000 50%, #7c2d00 100%)',
                  boxShadow:'0 4px 20px rgba(0,0,0,0.5)'}}>
                <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse at 80% 50%, rgba(251,146,60,0.25) 0%, transparent 70%)'}}/>
                <div style={{position:'relative',zIndex:2,height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px'}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,color:'rgba(251,146,60,0.7)',letterSpacing:3,textTransform:'uppercase',fontFamily:'sans-serif',marginBottom:4}}>⭐ Fidelidade</div>
                    <div style={{fontSize:30,fontWeight:900,color:'#fff',lineHeight:0.95,letterSpacing:-0.5,textShadow:'0 2px 8px rgba(0,0,0,0.8)'}}>PROGRAMA<br/><span style={{color:'#fb923c'}}>DE FIDELIDADE</span></div>
                    <div style={{marginTop:10,display:'flex',alignItems:'center',gap:6}}>
                      <svg viewBox="0 0 44 26" style={{width:32,height:18}}><circle cx="11" cy="13" r="9" fill="none" stroke="#fb923c" strokeWidth="2"/><text x="11" y="18" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fb923c" fontFamily="Arial">P</text><circle cx="33" cy="13" r="9" fill="none" stroke="#fb923c" strokeWidth="2"/><text x="33" y="18" textAnchor="middle" fontSize="10" fontWeight="900" fill="#fb923c" fontFamily="Arial">P</text></svg>
                      <span style={{fontSize:10,color:'rgba(255,255,255,0.4)',fontFamily:'sans-serif'}}>Acumule e ganhe</span>
                    </div>
                  </div>
                  {/* troféu SVG */}
                  <svg viewBox="0 0 80 90" style={{width:70,height:80,flexShrink:0,filter:'drop-shadow(0 4px 12px rgba(251,146,60,0.5))'}}>
                    <path d="M25 8 L55 8 L55 45 Q55 62 40 65 Q25 62 25 45 Z" fill="#fb923c" stroke="#f97316" strokeWidth="2"/>
                    <path d="M25 15 L10 15 Q5 15 5 22 Q5 35 25 38" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"/>
                    <path d="M55 15 L70 15 Q75 15 75 22 Q75 35 55 38" fill="none" stroke="#fbbf24" strokeWidth="4" strokeLinecap="round"/>
                    <rect x="34" y="65" width="12" height="14" rx="2" fill="#fb923c"/>
                    <rect x="24" y="78" width="32" height="6" rx="3" fill="#f97316"/>
                    <text x="40" y="42" textAnchor="middle" fontSize="22" fill="#fff" fontWeight="900">1</text>
                    <circle cx="40" cy="26" r="3" fill="rgba(255,255,255,0.5)"/>
                  </svg>
                </div>
              </button>

            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div style={{background:'#111',height:40,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'0 20px',borderTop:'2px solid #1a1a1a'}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <svg viewBox="0 0 30 30" style={{width:24,height:24}}>
              <circle cx="15" cy="15" r="13" fill="none" stroke="#FFD400" strokeWidth="2"/>
              {Array.from({length:12}).map((_,i)=>{const a=(i/12)*Math.PI*2;return <line key={i} x1={15+Math.cos(a)*9} y1={15+Math.sin(a)*9} x2={15+Math.cos(a)*13} y2={15+Math.sin(a)*13} stroke="#FFD400" strokeWidth="2"/>;  })}
              <circle cx="15" cy="15" r="5" fill="#FFD400"/>
            </svg>
            <span style={{fontSize:16,fontWeight:900,color:'#fff'}}>PNEU<span style={{color:'#FFD400'}}>FORTE</span></span>
          </div>
          <div style={{display:'flex',gap:18,alignItems:'center'}}>
            <span style={{fontSize:20,cursor:'pointer'}}>👤</span>
            <span style={{fontSize:20,cursor:'pointer'}}>⚙️</span>
            <span style={{fontSize:20,cursor:'pointer'}}>☁️</span>
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
