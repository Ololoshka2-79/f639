#!/bin/bash

# Скрипт настройки Nginx + SSL Let's Encrypt для домена ollolo.fvds.ru
# Выход при ошибках
set -e

DOMAIN="f639.ru"
EMAIL="admin@$DOMAIN" # Email для уведомлений Let's Encrypt

echo "========================================="
echo "🔒 Запуск настройки Nginx и SSL для $DOMAIN..."
echo "========================================="

# 1. Замена адреса в файлах конфигурации .env на сервере
echo "✏️ Обновляем адрес WEB_APP_URL в конфигурационных файлах..."

# Заменяем старый адрес Railway во всех .env файлах проекта
sed -i "s|https://f639.up.railway.app|https://$DOMAIN|g" /var/f639/.env
sed -i "s|https://f639.up.railway.app|https://$DOMAIN|g" /var/f639/telegram-bot/.env

# Также заменяем временный технический адрес fvds.ru, если он был прописан ранее
sed -i "s|ollolo.fvds.ru|$DOMAIN|g" /var/f639/.env
sed -i "s|ollolo.fvds.ru|$DOMAIN|g" /var/f639/telegram-bot/.env

if [ -f /var/f639/server/.env ]; then
    # Также добавляем новый домен в список разрешенных CORS источников (ALLOWED_ORIGINS)
    sed -i "s|ALLOWED_ORIGINS=|ALLOWED_ORIGINS=https://$DOMAIN,http://localhost:5173,|g" /var/f639/server/.env
    # На случай если там был старый fvds адрес
    sed -i "s|ollolo.fvds.ru|$DOMAIN|g" /var/f639/server/.env
fi

# 2. Установка Nginx и Certbot
echo "📦 Устанавливаем Nginx и Certbot..."
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx

# 3. Настройка конфигурации Nginx под наш домен
echo "⚙️ Настраиваем конфигурационный файл Nginx..."
cat <<EOT | sudo tee /etc/nginx/sites-available/default
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    location / {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOT

# Перезапускаем Nginx, чтобы применить конфигурацию HTTP
echo "🔄 Перезапускаем Nginx..."
sudo systemctl restart nginx

# 4. Получение SSL-сертификата от Let's Encrypt
echo "🛡️ Выпускаем бесплатный SSL-сертификат..."
# --nginx автоматически настроит SSL в конфиге Nginx
# --non-interactive и --agree-tos принимают соглашение автоматически
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# Перезапускаем Nginx для применения SSL-конфигурации
sudo systemctl restart nginx

# 5. Перезапуск процессов PM2, чтобы они подхватили новые переменные окружения
echo "🔄 Перезапускаем процессы в PM2..."
cd /var/f639
pm2 restart all

echo "========================================="
echo "🎉 Настройка успешно завершена!"
echo "👉 Ваше приложение доступно по адресу: https://$DOMAIN"
echo "🤖 Telegram бот перезапущен с новыми параметрами."
echo "========================================="
