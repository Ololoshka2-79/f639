import axios from 'axios';
import type { ContactInfo, DeliveryData } from '../store/checkoutStore';
import { getAdminTelegramUserIds } from './adminTelegramConfig';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;

/** Notify all admins. Returns true if at least one delivery succeeds. */
export const sendAdminNotification = async (message: string): Promise<boolean> => {
  const chatIds = getAdminTelegramUserIds();
  if (!BOT_TOKEN || chatIds.length === 0) {
    console.warn('[TelegramBot] Token or admin chat ids missing. Notification not sent.');
    return false;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

  const results = await Promise.allSettled(
    chatIds.map((chat_id) =>
      axios.post(
        url,
        {
          chat_id,
          text: message,
          parse_mode: 'HTML',
        },
        { timeout: 20_000 }
      )
    )
  );

  const failures = results.filter((r) => r.status === 'rejected');
  const ok = results.some((r) => r.status === 'fulfilled');

  if (ok) {
    console.log('[TelegramBot] Notification sent to', results.filter((r) => r.status === 'fulfilled').length, 'admin(s).');
  }
  if (failures.length > 0) {
    console.error('[TelegramBot] Some admin notifications failed:', failures);
  }

  return ok;
};

function formatMoney(v: number) {
  return `${v.toLocaleString('ru-RU')} ₽`;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function deliveryLabel(): string {
  return 'Пункт выдачи заказов Яндекс';
}

function deliveryDetail(data: DeliveryData): string {
  return data.address.trim() || '—';
}

export function formatPaymentClaimNotification(params: {
  orderId: string;
  items: { title: string; price: number; quantity: number }[];
  orderTotal: number;
  contactInfo: ContactInfo;
  deliveryData: DeliveryData;
  tgUsername?: string;
}) {
  const { orderId, items, orderTotal, contactInfo, deliveryData, tgUsername } = params;

  const shortId = orderId.split('-')[0].toUpperCase();

  const lines = items.map((i) => {
    const unit = formatMoney(i.price);
    const line = formatMoney(i.price * i.quantity);
    return `• ${esc(i.title)}\n  ${unit} × ${i.quantity} → <b>${line}</b>`;
  });

  const name = contactInfo.name.trim() || '—';
  const phone = contactInfo.phone.trim() || '—';
  const username = tgUsername ? `@${esc(tgUsername.replace(/^@/, ''))}` : '—';

  return (
    `<b>💳 Заявка на подтверждение оплаты</b>\n\n` +
    `<b>Заказ</b> #${esc(shortId)}\n` +
    `<b>Итого</b> ${formatMoney(orderTotal)}\n` +
    `<b>Статус</b> Оплачено\n\n` +
    `<b>📦 Товары</b>\n` +
    `${lines.join('\n\n')}\n\n` +
    `<b>🚚 Доставка</b>\n` +
    `<b>Способ:</b> ${esc(deliveryLabel())}\n` +
    `<b>Адрес / детали:</b>\n${esc(deliveryDetail(deliveryData))}\n\n` +
    `<b>👤 Клиент</b>\n` +
    `<b>Telegram:</b> ${username}\n` +
    `<b>Телефон:</b> ${esc(phone)}\n` +
    `<b>Имя:</b> ${esc(name)}`
  );
}

export function formatLeadOrderNotification(params: {
  orderId: string;
  items: { title: string; price: number; quantity: number }[];
  orderTotal: number;
  contactInfo: ContactInfo;
  deliveryData: DeliveryData;
  tgUsername?: string;
}) {
  const { orderId, items, orderTotal, contactInfo, deliveryData, tgUsername } = params;
  const shortId = orderId.split('-')[0].toUpperCase();

  const itemBlocks = items.map((i, idx) => {
    const unit = i.price;
    const line = unit * i.quantity;
    return (
      `<b>${idx + 1}.</b> ${esc(i.title)}\n` +
      `   <i>Кол-во:</i> ${i.quantity}\n` +
      `   <i>Цена за ед.:</i> ${formatMoney(unit)}\n` +
      `   <i>Сумма:</i> <b>${formatMoney(line)}</b>`
    );
  });

  const username = tgUsername ? `@${esc(tgUsername.replace(/^@/, ''))}` : 'не указан';
  const phone = contactInfo.phone.trim() || 'не указан';
  const customerName = contactInfo.name.trim() || 'не указано';

  return (
    `<b>🛍 Новый заказ</b> <code>#${esc(shortId)}</code>\n` +
    `<b>━━━━━━━━━━━━━━━━</b>\n\n` +
    `<b>1. Клиент</b>\n` +
    `<b>Telegram:</b> ${username}\n` +
    `<b>Телефон:</b> ${esc(phone)}\n` +
    `<b>Имя:</b> ${esc(customerName)}\n\n` +
    `<b>2. Заказ (позиции)</b>\n` +
    `${itemBlocks.join('\n\n')}\n\n` +
    `<b>3. Итого</b>\n` +
    `<b>${formatMoney(orderTotal)}</b>\n\n` +
    `<b>4. Доставка</b>\n` +
    `<b>Способ:</b> ${esc(deliveryLabel())}\n` +
    `<b>Адрес / комментарий:</b>\n${esc(deliveryDetail(deliveryData))}\n\n` +
    `<i>Статус: ожидает связи с клиентом</i>`
  );
}
