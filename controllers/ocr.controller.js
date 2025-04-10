import { createWorker } from 'tesseract.js';
import fs from 'fs';
import { cleanText } from '../utils/cleanText.js';

export const ocrController = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const worker = await createWorker('eng');

  try {
    const {
      data: { text },
    } = await worker.recognize(req.file.path);

    const result = cleanText(text);

    res.json({ result });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Error processing image' });
  } finally {
    await worker.terminate();
    fs.unlinkSync(req.file.path);
  }
};
