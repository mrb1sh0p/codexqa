import { Router } from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import Tesseract from 'tesseract.js';
import fs from 'fs';

import upload from './middleware/upload.js';
import { cleanText } from './utils/cleanText.js';

dotenv.config();

const router = Router();

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

router.post('/send', upload, async (req, res) => {
  console.log('Arquivo recebido:', req.file.originalname);
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    const {
      data: { text },
    } = await Tesseract.recognize(req.file.path, 'por');

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: `Texto extraído da imagem: "${cleanText(text)}". 
          Responda com base neste texto. 
          Evite formações especiais e não use aspas. 
          Responda apenas com o texto que
           você acha que é a resposta correta. Não adicione mais nada.`,
        },
      ],
    });

    fs.unlinkSync(req.file.path);

    console.log('Texto extraído:', text);
    console.log('Resposta da API:', response.choices[0].message.content);

    res.json({
      answer: cleanText(response.choices[0].message.content),
      extractedText: text,
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
