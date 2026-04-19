"""
Telegram-бот для F 63.9: /start + кнопка «Открыть магазин» через WebAppInfo (не url).

Запуск:
  pip install -r requirements.txt
  set BOT_TOKEN=... & set WEB_APP_URL=https://... & python main.py

Переменные окружения: BOT_TOKEN, WEB_APP_URL (HTTPS, домен должен совпадать с настройками бота в @BotFather).
"""

from __future__ import annotations

import asyncio
import logging
import os
import sys
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(Path(__file__).resolve().parent / ".env")
except ImportError:
    pass

from aiogram import Bot, Dispatcher, Router
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo, CallbackQuery

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
log = logging.getLogger("f639-bot")

router = Router()

# Деплой фронта (Railway); переопределяется через WEB_APP_URL
DEFAULT_WEB_APP_URL = "https://f639.up.railway.app"

WELCOME_HTML = (
    "Добро пожаловать в F 63.9 <code>code of love</code>!\n"
    "Открывайте, выбирайте и заказывайте самые красивые украшения ручной работы.\n"
    "Начните прямо сейчас!"
)


def _web_app_url() -> str:
    raw = (os.environ.get("WEB_APP_URL") or DEFAULT_WEB_APP_URL).strip().rstrip("/")
    if not raw.lower().startswith("http"):
        raw = "https://" + raw
    elif not raw.lower().startswith("https://"):
        log.error("WEB_APP_URL должен быть HTTPS (требование Telegram для Web App). Получено: " + raw)
    # Сброс кэша Telegram через параметр версии
    v = os.environ.get("WEB_APP_VERSION", "102")
    return f"{raw}/?v={v}"


@router.message(CommandStart())
async def cmd_start(message: Message, bot: Bot) -> None:
    # 🎯 ПРИНУДИТЕЛЬНЫЙ ВЫЗОВ: только через /start или startapp
    log.info("IS_START_CONTEXT: %s", message.text.startswith("/start") if message.text else False)
    log.info("IS_WEBAPP_CONTEXT: %s", bool(getattr(message, "web_app_data", None)))
    
    web_url = _web_app_url()
    # 🎯 Используем ПРЯМУЮ ссылку на приложение (t.me/bot/app), чтобы было на весь экран с кнопкой свернуть
    bot_user = (await bot.get_me()).username
    app_short_name = "app" # По умолчанию, если вы не переопределили в BotFather
    direct_link = f"https://t.me/{bot_user}/{app_short_name}"
    
    button = InlineKeyboardButton(
        text="Открыть магазин 💎",
        url=direct_link
    )
    
    kb = InlineKeyboardMarkup(
        inline_keyboard=[[button]]
    )
    
    # Текст с прямой ссылкой
    welcome_text = (
        f"{WELCOME_HTML}\n\n"
        f"🔗 Быстрый вход: {direct_link}"
    )
    
    await message.answer(
        welcome_text, 
        reply_markup=kb, 
        parse_mode=ParseMode.HTML
    )
    log.info("SENT WEBAPP BUTTON IN START CONTEXT.")

@router.message()
async def debug_all(message: Message):
    # Логгируем все входящие, но НЕ отправляем WebApp кнопки для обычных сообщений
    log.info("RAW MESSAGE UPDATE: %s", message)
    log.info("IS_START_CONTEXT: False (Caught in fallback)")
    log.info("IS_WEBAPP_CONTEXT: %s", bool(getattr(message, "web_app_data", None)))
    
    if message.text and not message.text.startswith("/"):
        await message.answer("Используйте /start или кнопку в меню для открытия магазина.")

@router.callback_query()
async def debug_callback(call: CallbackQuery):
    log.info("RAW CALLBACK DATA: %s", call)
    log.info("MESSAGE: %s", call.message)
    log.info("INLINE KEYBOARD: %s", call.message.reply_markup if call.message else "None")


async def main() -> None:
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token:
        log.error("BOT_TOKEN не задан")
        sys.exit(1)

    bot = Bot(token)
    dp = Dispatcher()
    dp.include_router(router)

    # Установка Menu Button
    try:
        from aiogram.types import MenuButtonWebApp, MenuButtonDefault, WebAppInfo as BotWebAppInfo
        from aiogram.types import BotCommand
        
        await bot.set_my_commands([
            BotCommand(command="start", description="Запустить магазин")
        ])

        # Для кнопки меню используем ЧИСТЫЙ URL (как в BotFather)
        clean_url = (os.environ.get("WEB_APP_URL") or DEFAULT_WEB_APP_URL).strip().rstrip("/")
        
        menu_btn = MenuButtonWebApp(
            text="Открыть",
            web_app=BotWebAppInfo(url=clean_url)
        )
        
        await bot.set_chat_menu_button(menu_button=MenuButtonDefault())
        await asyncio.sleep(0.5)
        await bot.set_chat_menu_button(menu_button=menu_btn)
        
        log.info("Menu button updated with clean URL: %s", clean_url)
    except Exception as e:
        log.error("Failed to update bot UI: %s", e)

    log.info("Polling started. Final URL check: %s", repr(_web_app_url()))
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
