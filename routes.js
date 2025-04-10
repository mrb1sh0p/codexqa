import { Router } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Tesseract from 'tesseract.js';
import sharp from 'sharp';
import fs from 'fs';

import upload from './middleware/upload.js';
import { cleanText } from './utils/cleanText.js';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

// Função de pré-processamento de imagem
const preprocessImage = async (imagePath) => {
  await sharp(imagePath)
    .greyscale() // Converter para escala de cinza
    .linear(1.2, -50) // Aumentar contraste e brilho
    .blur(0.5) // Reduzir ruído
    .toFile(`${imagePath}_processed.png`);

  return `${imagePath}_processed.png`;
};

router.post('/send', upload, async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    // Pré-processar a imagem
    const processedPath = await preprocessImage(req.file.path);

    // OCR com configurações otimizadas
    const {
      data: { text },
    } = await Tesseract.recognize(processedPath, 'por+eng', {
      tessedit_pageseg_mode: 6, // Modo de detecção de fórmula
      tessedit_char_whitelist:
        'ABCDE0123456789(),-.{}[]<>/=+*áéíóúâêîôûàèìòùãõç',
    });

    // Prompt otimizado
    const aiPrompt = `
      RESPONDA ESTE TEXTO RECONHECIDO: "${cleanText(text)}"

      REGRAS:
      1. Identifique a pergunta e alternativas mesmo com erros de OCR
      2. Corrija notações matemáticas (ex: "(2/3)" → "\\frac{2}{3}")
      3. Responda SOMENTE à alternativa correta
      4. Caso indeterminável, retorne "Erro"
      5. Caso tenha letras na alternativa, reposta ela antes de qualquer coisa
      6. Evite explicar o motivo da resposta
      7. Responda em texto cru, sem caracteres especiais ou formatação
    `;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: aiPrompt }],
    });

    const rawAnswer = cleanText(response.choices[0].message.content);

    [req.file.path, processedPath].forEach(
      (path) => fs.existsSync(path) && fs.unlinkSync(path)
    );

    res.json({
      answer: rawAnswer,
      extractedText: text,
    });
  } catch (error) {
    console.error('Erro:', error);
    res
      .status(500)
      .json({ error: 'Falha no processamento. Envie uma imagem mais nítida.' });
  }
});

export default router;
