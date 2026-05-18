#!/bin/bash

# Скрипт автоматического деплоя Luxury Boutique TMA на сервере Ubuntu
# Данный скрипт устанавливает Node.js, Python, PM2, настраивает окружение и запускает проект.

# Выход при любой ошибке
set -e

echo "========================================="
echo "🚀 Начинаем автоматическую установку..."
echo "========================================="

# 1. Обновление системы
echo "🔄 Обновляем списки пакетов..."
sudo apt update -y

# 2. Установка системных зависимостей (Git, Python, Pip, curl)
echo "📦 Устанавливаем Git, Python и утилиты..."
sudo apt install -y git python3 python3-pip python3-venv curl build-essential

# 3. Установка Node.js 22
echo "🟢 Устанавливаем Node.js 22..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
else
    echo "Node.js уже установлен: $(node -v)"
fi

# 4. Установка PM2 глобально
echo "⚙️ Устанавливаем менеджер процессов PM2..."
sudo npm install -g pm2

# 5. Настройка веб-части (Node.js бэкенд + React фронтенд)
echo "🔧 Устанавливаем зависимости Node.js..."
npm install

echo "🏗️ Собираем фронтенд (React)..."
npm run build

# 6. Настройка Telegram-бота (Python)
echo "🐍 Настраиваем виртуальное окружение для бота..."
cd telegram-bot
python3 -m venv venv
echo "📥 Устанавливаем библиотеки для Python бота..."
./venv/bin/pip install --upgrade pip
./venv/bin/pip install -r requirements.txt
cd ..

# 7. Запуск процессов в PM2
echo "▶️ Запускаем сервер и бота в фоновом режиме через PM2..."
# Останавливаем старые процессы, если они были запущены
pm2 delete f639-web &> /dev/null || true
pm2 delete f639-bot &> /dev/null || true

# Запускаем Node.js сервер
pm2 start server/index.js --name "f639-web"

# Запускаем Python бот
cd telegram-bot
pm2 start venv/bin/python --name "f639-bot" -- main.py
cd ..

# Сохраняем конфигурацию PM2 для автозапуска
pm2 save

echo "========================================="
echo "🎉 Установка успешно завершена!"
echo "========================================="
echo "Проверить статус процессов можно командой: pm2 list"
echo "Посмотреть логи можно командой: pm2 logs"
echo "========================================="
