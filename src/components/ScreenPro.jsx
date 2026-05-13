import React from 'react';

export default function ScreenPro({ user, togglePro, onBack }) {
  return (
    <div className="screen-pro">
      <div className="pro-paywall-card">
        <div className="pro-paywall-title">✦ PRO</div>
        <div className="pro-paywall-price">499 ₽/мес</div>
        <div className="pro-paywall-trial">Первые 7 дней бесплатно</div>
      </div>

      <div className="pro-benefits-list">
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">Безлимитные PDF</span>
        </div>
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">Свой логотип в PDF</span>
        </div>
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">История смет — сохранение</span>
        </div>
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">Свои прайсы и шаблоны</span>
        </div>
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">Брендирование для клиентов</span>
        </div>
        <div className="pro-benefit-row">
          <span className="pro-benefit-bullet">✦</span>
          <span className="pro-benefit-text">Быстрая отправка клиенту</span>
        </div>
      </div>

      <div className="pro-trigger-tagline">✓ Используется мастерами</div>
      <div className="pro-trigger-tagline">✓ Экономит часы на сметах</div>
      <div className="pro-trigger-tagline">✓ Готово для отправки клиенту</div>

      <div style={{ marginTop: '32px' }}>
        <button 
          className="btn-pro-subscribe" 
          onClick={() => {
            togglePro();
            onBack();
          }}
        >
          {user.isPro ? 'Управлять подпиской' : 'Оформить PRO — 499 ₽/мес'}
        </button>
        
        <button className="btn-one-time-link" onClick={onBack}>
          Разовый PDF — 199 ₽
        </button>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button className="btn-secondary" style={{ width: '100%' }} onClick={onBack}>
          Вернуться назад
        </button>
      </div>
    </div>
  );
}
