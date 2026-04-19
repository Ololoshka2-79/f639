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
    web_url = _web_app_url()
    button = InlineKeyboardButton(
        text="Открыть",
        web_app=WebAppInfo(url="https://f639.up.railway.app")
    )
    
    # 3. Проверить тип кнопки (обязательно)
    log.info("Button object: %s", button)
    log.info("Button type: %s", type(button))
    
    kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [button]
        ]
    )
    
    # Dump fully serialized payload to logs
    kb_dict = kb.model_dump() if hasattr(kb, 'model_dump') else kb.dict()
    import json
    log.info("Full keyboard serialized JSON: %s", json.dumps(kb_dict))
    
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
        from aiogram.types import MenuButtonWebApp, MenuButtonDefault, WebAppInfo as BotWebAppInfo
        from aiogram.types import BotCommand
        
        # 1. Установка команд (меню "бургер" или список команд)
        await bot.set_my_commands([
            BotCommand(command="start", description="Запустить магазин")
        ])

        # 2. Описание перед началом (что видит новый пользователь)
        await bot.set_my_description(
            "F 63.9 — украшения с душой. Нажмите «Старт» или кнопку «Открыть», чтобы перейти в каталог."
        )
        await bot.set_my_short_description(
            "F 63.9: ювелирный магазин в вашем Telegram."
        )

        # 3. ОБЯЗАТЕЛЬНО сбросить и установить кнопку Web App
        await bot.set_chat_menu_button(menu_button=MenuButtonDefault())
        await asyncio.sleep(0.5) # Даем Telegram время на обработку сброса
        
        await bot.set_chat_menu_button(
            menu_button=MenuButtonWebApp(
                text="Открыть",
                web_app=BotWebAppInfo(url="https://f639.up.railway.app")
            )
        )
        log.info("Menu button and bot commands updated. WebApp URL: https://f639.up.railway.app")
    except Exception as e:
        log.error("Failed to update bot UI: %s", e)

    log.info("Polling started; WEB_APP_URL=%s", web_url)
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
