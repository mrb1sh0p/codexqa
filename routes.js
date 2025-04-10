import { Router } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Tesseract from 'tesseract.js';

import upload from './middleware/upload.js';
import uploadToS3 from './middleware/uploadS3.js';
import { cleanText } from './utils/cleanText.js';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

router.post('/send', upload, uploadToS3, async (req, res) => {
  console.log('Iniciando o processamento da imagem...');
  console.log('Imagem recebida:', req.file.originalname);
  console.log('URL da imagem recebida:', req.file.path);

  try {
    if (!req.file)
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });

    // OCR com configurações otimizadas
    const {
      data: { text },
    } = await Tesseract.recognize(req.file.path, 'por+eng', {
      tessedit_pageseg_mode: 6, // Modo de detecção de fórmula
      tessedit_char_whitelist:
        'ABCDE0123456789(),-.{}[]<>/=+*áéíóúâêîôûàèìòùãõç',
    });

    // Prompt otimizado
    const aiPrompt = `
      RESPONDA: "${cleanText(text)}"

      REGRAS:
      1. Identifique a pergunta e, caso tenha, alternativas mesmo com erros de OCR
      2. Corrija notações matemáticas (ex: "(2/3)" → "\\frac{2}{3}")
      3. Caso indeterminável, retorne "Erro - Tente novamente"
      4. Caso tenha letras na alternativa, reposta ela antes de qualquer coisa
      5. Evite explicar o motivo da resposta
      6. Não responta texto muito longos, tente sempre resumir a resposta
      7. Não use formatação de código ou markdown
      8. Não volte a pergunta
    `;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: aiPrompt }],
    });

    const rawAnswer = cleanText(response.choices[0].message.content);

    console.log('Resposta da IA:', rawAnswer);

    res.json({
      answer: rawAnswer,
      extractedText: text,
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      error: 'Falha no processamento. Envie uma imagem mais nítida.',
    });
  }
});

export default router;
