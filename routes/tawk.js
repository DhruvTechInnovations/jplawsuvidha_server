const express = require('express');
const crypto = require('crypto');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid'); // for unique file names
const tawk_router = express.Router();

const TWAK_SECRET =process.env.TWAK_SECRET

// Initialize AWS S3 Client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
// console.log("Access Key:", process.env.AWS_ACCESS_KEY_ID);
// console.log("Secret Key:", process.env.AWS_SECRET_ACCESS_KEY);

function verifyTawkSignature(req, res, next) {
  const signature = req.headers['x-tawk-signature'];
  // console.log('in verify signature',req.rawBody)
  // console.log('signature is ',signature)

  if (!signature) {
    return res.status(401).json({ error: 'Missing Tawk signature' });
  }
  const hmac = crypto.createHmac('sha1', TWAK_SECRET);
  const digest = hmac.update(req.rawBody).digest('hex');
  // console.log('digest is ', digest)

  if (signature !== digest) {
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
}

tawk_router.post('/tawkdata', verifyTawkSignature, async (req, res) => {
  const data = req.body;
  const timestamp = new Date().toISOString();
  const filename = `tawk_data/${timestamp}_${uuidv4()}.json`; // e.g., tawk_data/2025-08-06_uuid.json

  const params = {
    Bucket:process.env.AWS_BUCKET , 
    Key: filename,
    Body: JSON.stringify(data),
    ContentType: 'application/json',
     Metadata: {
        source: 'tawk',
        receivedAt: new Date().toISOString(),
      }
  };

  try {
    await s3.send(new PutObjectCommand(params));
    res.status(201).json({ message: 'Data saved to S3', key: filename });
  } catch (err) {
    // console.error('Error uploading to S3:', err);
    res.status(500).json({ error: 'Failed to upload to S3' });
  }
});

module.exports = tawk_router;