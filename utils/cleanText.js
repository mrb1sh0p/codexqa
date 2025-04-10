export const cleanText = (rawText) => {
  return rawText
    .replace(/\\n/g, ' ') // substitui \n por espaço
    .replace(/\n/g, ' ') // caso venha como quebra real de linha
    .replace(/\s+/g, ' ') // remove múltiplos espaços
    .replace(/[|@#]/g, '') // remove caracteres estranhos comuns
    .trim(); // remove espaços nas pontas
};
