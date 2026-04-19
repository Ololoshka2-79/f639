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
from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup, Message, WebAppInfo

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
    return raw


@router.message(CommandStart())
async def cmd_start(message: Message, bot: Bot) -> None:
    me = await bot.get_me()
    username = me.username
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="Открыть магазин",
                    url=f"https://t.me/{username}?startapp=store",
                )
            ]
        ]
    )
    await message.answer(WELCOME_HTML, reply_markup=kb, parse_mode=ParseMode.HTML)


async def main() -> None:
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token:
        log.error("BOT_TOKEN не задан")
        sys.exit(1)

    web_url = _web_app_url()

    bot = Bot(token)
    dp = Dispatcher()
    dp.include_router(router)

    # Установка Menu Button (кнопка слева от ввода сообщения) в режим Web App
    try:
        from aiogram.types import MenuButtonWebApp, WebAppInfo as BotWebAppInfo
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Магазин",
                web_app=BotWebAppInfo(url=web_url)
            )
        )
        log.info("Menu button set to WebApp: %s", web_url)
    except Exception as e:
        log.error("Failed to set menu button: %s", e)

    log.info("Polling started; WEB_APP_URL=%s", web_url)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
