const fs = require('fs').promises;
const crypto = require('crypto');

async function uploadScanPdf(file) {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are required for course scan uploads');
  }

  const publicId = `course-scans/${crypto.randomUUID()}.pdf`;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHash('sha256')
    .update(`public_id=${publicId}&timestamp=${timestamp}${apiSecret}`).digest('hex');
  const form = new FormData();
  form.append('file', new Blob([await fs.readFile(file.path)], { type: 'application/pdf' }), file.originalname);
  form.append('public_id', publicId);
  form.append('timestamp', timestamp);
  form.append('api_key', apiKey);
  form.append('signature', signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/raw/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(120000)
  });
  const result = await response.json();
  if (!response.ok || !result.secure_url || !result.public_id) {
    throw new Error(`Cloudinary PDF upload failed: ${result.error?.message || response.status}`);
  }
  return { fileUrl: result.secure_url, cloudinaryPublicId: result.public_id };
}

module.exports = { uploadScanPdf };
