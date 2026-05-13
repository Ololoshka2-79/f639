import { Telegraf, Markup } from 'telegraf';
import 'dotenv/config';

const TOKEN = process.env.BOT_TOKEN;
const MINI_APP_URL = process.env.MINI_APP_URL || 'https://smetiq.pages.dev'; 

if (!TOKEN) {
  console.error('Ошибка: BOT_TOKEN не найден в .env файле');
  process.exit(1);
}

const bot = new Telegraf(TOKEN);
const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim());

const isAdmin = (ctx) => {
  return ADMIN_IDS.includes(ctx.from.id.toString());
};

bot.command('admin', (ctx) => {
  if (isAdmin(ctx)) {
    return ctx.reply('Панель администратора Smetiq 🛠️\n\nВы авторизованы как администратор.');
  }
  return ctx.reply('У вас нет прав для выполнения этой команды.');
});

bot.start((ctx) => {
  return ctx.reply(
    `Привет, ${ctx.from.first_name}! 👋\n\nЯ помогу тебе быстро рассчитать смету на ремонт квартиры.\nНажми на кнопку ниже, чтобы открыть калькулятор Smetiq.`,
    Markup.inlineKeyboard([
      [Markup.button.webApp('Открыть калькулятор', MINI_APP_URL)]
    ])
  );
});

bot.help((ctx) => ctx.reply('Нажми /start, чтобы запустить приложение.'));

bot.launch()
  .then(() => console.log('Бот Smetiq запущен!'))
  .catch((err) => console.error('Ошибка запуска бота:', err));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
