const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const logger = require('../utils/logger');

const s3Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

class StorageService {
  static async uploadFile(file, key) {
    try {
      const command = new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);
      
      const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`;
      logger.info({ key, publicUrl }, 'File uploaded to R2');
      
      return publicUrl;
    } catch (err) {
      logger.error({ err, key }, 'R2 upload error');
      throw new Error('File upload failed');
    }
  }

  static generateKey(userId, filename) {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `recordings/${userId}/${timestamp}-${sanitized}`;
  }
}

module.exports = StorageService;
