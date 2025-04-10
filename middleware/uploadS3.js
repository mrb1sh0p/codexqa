import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const uploadToS3 = (req, res, next) => {
  if (!req.file)
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: req.file.originalname,
    Body: req.file.buffer,
    ContentType: req.file.mimetype,
  };

  const command = new PutObjectCommand(params);

  s3.send(command)
    .then(() => {
      req.file.path = `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${req.file.originalname}`;
      next();
    })
    .catch((err) => {
      console.error('Erro ao fazer o upload:', err);
      res.status(500).json({ error: 'Erro ao fazer o upload da imagem' });
    });
};

export default uploadToS3;
