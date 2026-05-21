function normalizeText(value = '') {
  if (typeof value !== 'string') return '';
  
  return value
    .toString()
    .normalize('NFD')                 // Decompõe caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '')   // Remove acentos
    .replace(/[^a-zA-Z0-9]/g, '')     // REMOVE TUDO que não for letra ou número (espaços, traços, pontos)
    .toUpperCase()                    // Padroniza para maiúsculas
    .trim();
}

module.exports = {
  normalizeText
};