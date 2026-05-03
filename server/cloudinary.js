import { v2 as cloudinary } from 'cloudinary';
import { config } from './config.js';

let enabled = false;

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
  enabled = true;
  console.log('[cloudinary] ✅ Cloudinary configured');
} else {
  console.warn('[cloudinary] ⚠️ Cloudinary not configured — images will be stored locally');
}

export { cloudinary, enabled };