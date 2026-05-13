export default function ScreenStart({ objectType, setObjectType, area, setArea, onNext, onGoToPro, onGoToHistory, savedProjectsCount, isPro }) {
  return (
    <div className="screen-start">
      {!isPro && (
        <button className="btn-pro-trigger" onClick={onGoToPro}>
          ✦ Для работы? Попробовать PRO
        </button>
      )}

      {savedProjectsCount > 0 && (
        <button className="btn-history-link" onClick={onGoToHistory}>
          📂 Мои проекты ({savedProjectsCount})
        </button>
      )}

      <h2 className="screen-title" style={{ textAlign: 'center', marginBottom: '8px' }}>Параметры объекта</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center' }}>
        Укажите площадь и тип жилья для начала
      </p>

      <div className="area-input-wrapper">
        <input
          type="number"
          value={area || ''}
          onChange={(e) => setArea(Number(e.target.value))}
          className="area-input"
          placeholder="0"
          autoFocus
        />
        <span className="area-label">м²</span>
      </div>

      <div className="type-toggle">
        <button
          className={`type-btn ${objectType === 'secondary' ? 'active' : ''}`}
          onClick={() => setObjectType('secondary')}
        >
          Вторичка
        </button>
        <button
          className={`type-btn ${objectType === 'new' ? 'active' : ''}`}
          onClick={() => setObjectType('new')}
        >
          Новостройка
        </button>
      </div>

      <div className="templates-section">
        <h3 className="section-subtitle-small">Быстрые шаблоны</h3>
        <div className="templates-grid">
          <button className="template-btn" onClick={() => alert('Шаблон "Эконом" применен: выбраны базовые работы')}>
            <span className="template-icon">📉</span>
            <span>Эконом</span>
          </button>
          <button className="template-btn" onClick={() => alert('Шаблон "Стандарт" применен: оптимальный выбор')}>
            <span className="template-icon">🏠</span>
            <span>Стандарт</span>
          </button>
          <button className="template-btn" onClick={() => alert('Шаблон "Премиум" применен: лучшие материалы')}>
            <span className="template-icon">💎</span>
            <span>Премиум</span>
          </button>
        </div>
      </div>

      <div className="start-features">
        <div className="feature-item">
          <span className="feature-icon">✅</span>
          <span>Учтем демонтаж и отделку</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📊</span>
          <span>Рассчитаем материалы</span>
        </div>
        <div className="feature-item">
          <span className="feature-icon">📄</span>
          <span>Готовый PDF для клиента</span>
        </div>
      </div>
    </div>
  );
}