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
from aiogram.filters import CommandStart, CommandObject
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
    # Всегда добавляем слэш в конце для нативности
    return f"{raw}/"


@router.message(CommandStart(deep_link=True))
async def start_with_param(message: Message, command: CommandObject):
    """
    🎯 ОБРАБОТКА startapp В БОТЕ (ОБЯЗАТЕЛЬНО)
    """
    param = command.args or "home"
    log.info("Processing startapp with param: %s", param)

    # Параметризованная ссылка на приложение
    base_url = _web_app_url()
    web_url = f"{base_url}?startapp={param}"

    button = InlineKeyboardButton(
        text="Открыть",
        web_app=WebAppInfo(url=web_url)
    )

    kb = InlineKeyboardMarkup(inline_keyboard=[[button]])

    await message.answer("Открыть приложение", reply_markup=kb)


@router.message(CommandStart())
async def cmd_start(message: Message, bot: Bot) -> None:
    """
    🚀 ЗАМЕНИТЬ ВСЕ КНОПКИ НА startapp DEEP LINK
    """
    bot_info = await bot.get_me()
    bot_username = bot_info.username or "f_639_bot"
    
    # Прямая ссылка на Mini App запуск
    start_app_url = f"https://t.me/{bot_username}?startapp=home"

    button = InlineKeyboardButton(
        text="Открыть",
        url=start_app_url
    )
    
    kb = InlineKeyboardMarkup(
        inline_keyboard=[[button]]
    )
    
    await message.answer(
        WELCOME_HTML, 
        reply_markup=kb, 
        parse_mode=ParseMode.HTML
    )


@router.message()
async def debug_all(message: Message, bot: Bot):
    # Логгируем все входящие
    log.info("RAW MESSAGE UPDATE: %s", message)
    
    if message.text and not message.text.startswith("/"):
        bot_info = await bot.get_me()
        bot_username = bot_info.username or "f_639_bot"
        start_app_url = f"https://t.me/{bot_username}?startapp=home"

        button = InlineKeyboardButton(
            text="Открыть",
            url=start_app_url
        )
        kb = InlineKeyboardMarkup(inline_keyboard=[[button]])

        await message.answer(
            "Пожалуйста, используйте кнопку для входа в приложение:", 
            reply_markup=kb
        )

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

    # Бот теперь не управляет кнопками и командами программно,
    # чтобы использовать только настройки из BotFather.
    log.info("Bot commands and menu button management removed.")

    log.info("Polling started. Final URL check: %s", repr(_web_app_url()))
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
