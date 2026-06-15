import multer from 'multer'
import express from 'express'
import { S3Client } from '@aws-sdk/client-s3'


export const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
export const image_storage=  multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, file, cb) => {
        if (!file.mimetype.startsWith("image/")) {
          cb(new Error("Only images allowed"));
        }
        cb(null, true);
      },
    });
    


