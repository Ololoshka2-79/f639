import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env' });

const token = process.env.BOT_TOKEN;

async function getInfo() {
  if (!token) {
    console.log('No BOT_TOKEN found in .env');
    return;
  }
  try {
    const res = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    console.log('Bot Info:', res.data.result);
  } catch (e) {
    console.error('Error fetching bot info:', e.message);
  }
}

getInfo();
