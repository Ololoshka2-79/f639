import React from 'react';

export default function ScreenSettings({ branding, updateBranding, onBack }) {
  const handleChange = (field, value) => {
    updateBranding({ [field]: value });
  };

  return (
    <div className="screen-brand">
      <div className="history-header-row" style={{ marginBottom: '32px' }}>
        <h2 className="screen-title" style={{ margin: 0 }}>Мой бренд</h2>
        <button className="btn-secondary btn-small" onClick={onBack}>Назад</button>
      </div>

      <div className="brand-field">
        <label className="brand-label">Логотип</label>
        <div className="brand-logo-drop" onClick={() => alert('Загрузка логотипа...')}>
          <div style={{ fontSize: '24px' }}>⊕</div>
          <div>Загрузить логотип</div>
          <div style={{ fontSize: '11px', opacity: 0.6 }}>#DDD82</div>
        </div>
      </div>

      <div className="brand-field">
        <label className="brand-label">Название / Имя</label>
        <input 
          type="text" 
          className="brand-input"
          value={branding.companyName || ''} 
          onChange={(e) => handleChange('companyName', e.target.value)}
          placeholder="ООО СтройМастер"
        />
      </div>

      <div className="brand-field">
        <label className="brand-label">Телефон</label>
        <input 
          type="tel" 
          className="brand-input"
          value={branding.phone || ''} 
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>

      <div className="brand-field">
        <label className="brand-label">Telegram</label>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }}>@</span>
          <input 
            type="text" 
            className="brand-input"
            style={{ paddingLeft: '34px' }}
            value={branding.telegram || ''} 
            onChange={(e) => handleChange('telegram', e.target.value)}
            placeholder="username"
          />
        </div>
      </div>

      <div className="brand-field">
        <label className="brand-label">WhatsApp</label>
        <input 
          type="tel" 
          className="brand-input"
          value={branding.whatsapp || ''} 
          onChange={(e) => handleChange('whatsapp', e.target.value)}
          placeholder="+7 (999) 123-45-67"
        />
      </div>

      <div className="brand-field">
        <label className="brand-label">Комментарий для PDF</label>
        <textarea 
          className="brand-input"
          style={{ height: '80px', resize: 'none' }}
          value={branding.comment || ''} 
          onChange={(e) => handleChange('comment', e.target.value)}
          placeholder="Благодарим за обращение! Смета действительна 14 дней."
        />
      </div>

      <div style={{ marginTop: '32px' }}>
        <button className="btn-primary" style={{ width: '100%', background: 'var(--accent)' }} onClick={onBack}>Сохранить</button>
      </div>
    </div>
  );
}
