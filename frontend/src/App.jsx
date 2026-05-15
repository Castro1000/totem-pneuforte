import { useMemo, useRef, useState } from 'react';
import './styles/global.css';
import './styles/telaInicial.css';
import './styles/telaConsulta.css';
import './styles/resultado.css';
import './styles/consultaAvancada.css';
import './styles/telaBoasVindas.css';

import TelaBoasVindas from './components/TelaBoasVindas';
import TelaInicial from './components/TelaInicial';
import TelaConsulta from './components/TelaConsulta';
import ConsultaAvancada from './components/ConsultaAvancada';

export default function App() {
  const [boasVindas, setBoasVindas] = useState(true);
  const [telaInicial, setTelaInicial] = useState(true);
  const [animandoEntrada, setAnimandoEntrada] = useState(false);
  const [tipoConsulta, setTipoConsulta] = useState('placa');

  const [placa, setPlaca] = useState('');
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [mostrarMaisMedidas, setMostrarMaisMedidas] = useState(false);

  const teclaRef = useRef(null);

  async function entrarFullscreen() {
    try {
      const elemento = document.documentElement;
      if (!document.fullscreenElement && elemento.requestFullscreen) {
        await elemento.requestFullscreen();
      }
    } catch {
      //
    }
  }

  function tocarSom(audioRef, volume = 1) {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch {
      //
    }
  }

  function tocarTecla() {
    tocarSom(teclaRef, 0.35);
  }

  function falarBoasVindas() {
    try {
      if (!('speechSynthesis' in window)) return;

      window.speechSynthesis.cancel();

      const fala = new SpeechSynthesisUtterance('Bem-vindo à Pneu Forte');
      fala.lang = 'pt-BR';
      fala.rate = 0.9;
      fala.pitch = 1;
      fala.volume = 1;

      const vozes = window.speechSynthesis.getVoices();
      const vozPt =
        vozes.find((v) => v.lang?.toLowerCase().includes('pt-br')) ||
        vozes.find((v) => v.lang?.toLowerCase().includes('pt')) ||
        null;

      if (vozPt) {
        fala.voice = vozPt;
      }

      window.speechSynthesis.speak(fala);
    } catch {
      //
    }
  }

  async function entrarApp() {
    await entrarFullscreen();
    falarBoasVindas();
    setBoasVindas(false);
  }

  function iniciarTotem(modo) {
    if (animandoEntrada) return;

    setTipoConsulta(modo);
    entrarFullscreen();
    setAnimandoEntrada(true);

    setTimeout(() => {
      setTelaInicial(false);
      setAnimandoEntrada(false);
    }, 2200);
  }

  function sanitizePlaca(valor) {
    return valor.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 7);
  }

  function formatarPlacaMercosul(valor) {
    const limpa = sanitizePlaca(valor);
    if (limpa.length <= 3) return limpa;
    return `${limpa.slice(0, 3)}-${limpa.slice(3)}`;
  }

  function montarBlocosPlaca(valor) {
    const limpa = sanitizePlaca(valor);
    const blocos = [];
    for (let i = 0; i < 7; i += 1) {
      blocos.push(limpa[i] || '');
    }
    return blocos;
  }

  const placaFormatada = useMemo(() => formatarPlacaMercosul(placa), [placa]);
  const blocosPlaca = useMemo(() => montarBlocosPlaca(placa), [placa]);
  const placaCompleta = placa.length === 7;

  const medidasResultado = resultado?.pneus || [];
  const medidaPrincipal = medidasResultado[0] || null;
  const outrasMedidas = medidasResultado.slice(1);

  function definirPlaca(valor) {
    setPlaca(sanitizePlaca(valor));
  }

  async function buscar() {
    try {
      setLoading(true);
      setErro('');
      setResultado(null);
      setMostrarMaisMedidas(false);

      const tentarBusca = async () => {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/totem/buscar-por-placa`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ placa })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || 'Erro ao buscar veículo');
        return data;
      };

      let data;
      let ultimoErro;
      for (let i = 0; i < 3; i++) {
        try {
          data = await tentarBusca();
          break;
        } catch (err) {
          ultimoErro = err;
          if (i < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (!data) throw ultimoErro;
      setResultado(data);
    } catch (err) {
      setErro(err.message);
    } finally {
      setLoading(false);
    }
  }

  function voltarInicio() {
    setTelaInicial(true);
    setTipoConsulta('placa');
    setPlaca('');
    setResultado(null);
    setErro('');
    setLoading(false);
    setMostrarMaisMedidas(false);
  }

  function novaConsulta() {
    setPlaca('');
    setResultado(null);
    setErro('');
    setMostrarMaisMedidas(false);
  }

  function adicionarTecla(valor) {
    if (placa.length >= 7) return;
    tocarTecla();
    setPlaca((prev) => sanitizePlaca(prev + valor));
  }

  function apagarTecla() {
    if (!placa.length) return;
    tocarTecla();
    setPlaca((prev) => prev.slice(0, -1));
  }

  function limparPlaca() {
    tocarTecla();
    setPlaca('');
  }

  if (boasVindas) {
    return <TelaBoasVindas onTocar={entrarApp} />;
  }

  if (telaInicial) {
    return (
      <TelaInicial
        animandoEntrada={animandoEntrada}
        iniciarTotem={iniciarTotem}
        teclaRef={teclaRef}
      />
    );
  }

  if (tipoConsulta === 'modelo') {
    return (
      <ConsultaAvancada
        voltarInicio={voltarInicio}
        teclaRef={teclaRef}
      />
    );
  }

  return (
    <TelaConsulta
      teclaRef={teclaRef}
      voltarInicio={voltarInicio}
      resultado={resultado}
      erro={erro}
      loading={loading}
      placa={placa}
      placaFormatada={placaFormatada}
      blocosPlaca={blocosPlaca}
      placaCompleta={placaCompleta}
      definirPlaca={definirPlaca}
      buscar={buscar}
      adicionarTecla={adicionarTecla}
      apagarTecla={apagarTecla}
      limparPlaca={limparPlaca}
      novaConsulta={novaConsulta}
      mostrarMaisMedidas={mostrarMaisMedidas}
      setMostrarMaisMedidas={setMostrarMaisMedidas}
      medidaPrincipal={medidaPrincipal}
      outrasMedidas={outrasMedidas}
      tipoConsulta={tipoConsulta}
    />
  );
}
