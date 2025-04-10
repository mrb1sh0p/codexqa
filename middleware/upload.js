import multer from 'multer';

const upload = (req, res, next) => {
  const storage = multer.memoryStorage({
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + '-' + file.originalname);
    },
  });

  const upload = multer({ storage }).single('image');

  upload(req, res, (err) => {
    if (err) {
      console.log('Erro no upload:', err);
      return res.status(400).json({ error: 'Falha no upload da imagem' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma imagem enviada' });
    }

    next();
  });
};

export default upload;
