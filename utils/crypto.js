const crypto = require('crypto');

const ALGO = 'aes-256-gcm';
const ENC_KEY = Buffer.from(process.env.PHONE_ENCRYPTION_KEY, 'hex');

/* Encrypt */
function encryptPhone(phone) {
    console.log('encrypt phone hit')
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, ENC_KEY, iv);

  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    phone_encrypted: encrypted,
    phone_iv: iv.toString('hex'),
    phone_auth_tag: cipher.getAuthTag().toString('hex')
  };
}

/* Decrypt */
function decryptPhone(enc, iv, tag) {
    console.log('decrypt phone hit')
  const decipher = crypto.createDecipheriv(
    ALGO,
    ENC_KEY,
    Buffer.from(iv, 'hex')
  );

  decipher.setAuthTag(Buffer.from(tag, 'hex'));

  let decrypted = decipher.update(enc, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/* HMAC lookup */
function phoneLookup(phone) {
  return crypto
    .createHmac('sha256', process.env.PHONE_LOOKUP_SECRET)
    .update(phone)
    .digest('hex');
}

module.exports = { encryptPhone, decryptPhone, phoneLookup };
