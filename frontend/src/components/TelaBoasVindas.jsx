export default function TelaBoasVindas({ onTocar }) {
  return (
    <div className="bv-full" onClick={onTocar}>
      <div className="bv-fundo"></div>
      <div className="bv-overlay"></div>

      <div className="bv-centro">
        <div className="bv-mascote-wrapper">
          <img src="/mascote.png" alt="Mascote" className="bv-mascote" />
          <div className="bv-balao">
            <span>TOQUE NA TELA</span>
            <span>PARA COMEÇAR!</span>
          </div>
        </div>
      </div>
    </div>
  );
}
