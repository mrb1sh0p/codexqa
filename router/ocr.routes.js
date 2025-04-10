import { Router } from 'express';
import multer from '../middleware/multer.js';
import { ocrController } from '../controllers/ocr.controller.js';
const router = Router();

router.post('/ocr', multer, ocrController);

export default router;
