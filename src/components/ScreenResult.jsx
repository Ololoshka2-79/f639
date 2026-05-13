import { useState } from 'react';

const DONUT_COLORS = {
  demolition: '#C4693A',
  rough: '#A68B5B',
  finish: '#C4B49A',
  doors: '#8A8A8A'
};

export default function ScreenResult({ calculateTotal, formatCurrency, area, objectType, onPrev, isPro, branding, onSave, onGoToPro }) {
  const { total, breakdown } = calculateTotal();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // SVG Donut calculation
  let cumulativePercent = 0;
  const donutPaths = breakdown.map((item) => {
    const percent = (item.total / total) * 100;
    const startPercent = cumulativePercent;
    cumulativePercent += percent;

    const startX = Math.cos(2 * Math.PI * (startPercent / 100));
    const startY = Math.sin(2 * Math.PI * (startPercent / 100));
    const endX = Math.cos(2 * Math.PI * (cumulativePercent / 100));
    const endY = Math.sin(2 * Math.PI * (cumulativePercent / 100));

    const largeArcFlag = percent > 50 ? 1 : 0;

    return {
      d: `M ${startX} ${startY} A 1 1 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      color: DONUT_COLORS[item.key] || '#DDD8D2'
    };
  });

  return (
    <div className="screen-result">
      <div className="result-header" style={{ textAlign: 'left', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '4px' }}>Ваша смета</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px' }}>
          {objectType === 'new' ? 'Новостройка' : 'Вторичка'} • {area} м²
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
        {total > 0 && (
          <div className="chart-container" style={{ width: '220px', height: '220px' }}>
            <svg viewBox="-1.1 -1.1 2.2 2.2" style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
              {donutPaths.map((path, i) => (
                <path
                  key={i}
                  d={path.d}
                  fill="none"
                  stroke={path.color}
                  strokeWidth="0.3"
                />
              ))}
            </svg>
            <div className="chart-center">
              <span style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(total)}</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '32px' }}>
        {breakdown.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: DONUT_COLORS[item.key] }} />
              <span>{item.title}</span>
            </div>
            <span style={{ fontWeight: 600 }}>{formatCurrency(item.total)}</span>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.5px' }}>Итого</div>
        <div style={{ fontSize: '36px', fontWeight: 800 }}>{formatCurrency(total)}</div>
      </div>

      <div className="paywall-blocks" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {!isPro ? (
          <>
            <div className="res-block-free">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>PDF отчет</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Скачать разовый PDF</div>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>199 ₽</div>
              </div>
              <button className="btn-pdf-dark" onClick={() => alert('PDF генерация... Сначала оплатите 199 ₽')}>
                Скачать PDF — 199 ₽
              </button>
            </div>

            <div className="res-block-pro">
              <div className="res-pro-badge">✦ PRO</div>
              <div style={{ fontSize: '15px', fontWeight: 600, marginTop: '4px' }}>
                Безлимит PDF + свои прайсы + брендирование
              </div>
              <div className="res-pro-bullets">
                • Безлимитные PDF<br/>
                • Свой логотип<br/>
                • Сохранение проектов
              </div>
              <button className="btn-pro-gold" onClick={onGoToPro}>
                Оформить PRO — 499 ₽/мес
              </button>
            </div>
          </>
        ) : (
          <div className="res-block-pro">
            <div className="res-pro-badge">✦ PRO АКТИВЕН</div>
            {branding.companyName && (
              <div className="branding-preview-small">
                {branding.logo && <img src={branding.logo} alt="Logo" className="branding-logo-small" />}
                <div className="branding-text-small">
                  <span className="branding-name-small">{branding.companyName}</span>
                  <span className="branding-sub-small">{branding.phone}</span>
                </div>
              </div>
            )}
            <button className="btn-pro-gold" onClick={() => alert('PDF успешно создан!')}>
              Скачать брендированный PDF
            </button>
            <button className={`btn-save ${saved ? 'success' : ''}`} onClick={handleSave} style={{ 
              marginTop: '8px', 
              width: '100%', 
              height: '48px', 
              borderRadius: '12px', 
              border: '1px solid var(--border)',
              background: 'white',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              {saved ? '✓ Сохранено' : '💾 Сохранить проект'}
            </button>
          </div>
        )}
      </div>

      <div style={{ marginTop: '32px', textAlign: 'center', paddingBottom: '40px' }}>
        <button className="btn-secondary" onClick={onPrev} style={{ width: '100%' }}>
          Вернуться к редактированию
        </button>
      </div>
    </div>
  );
}