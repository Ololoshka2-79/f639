import React from 'react';

export default function ScreenHistory({ savedProjects, loadProject, deleteProject, duplicateProject, formatCurrency, onBack }) {
  return (
    <div className="screen-history">
      <div className="history-header-row">
        <h2 className="screen-title" style={{ margin: 0 }}>Мои сметы</h2>
        <button className="btn-history-new" onClick={onBack}>+ Новая</button>
      </div>

      {savedProjects.length === 0 ? (
        <div className="empty-state" style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📂</div>
          <h3 style={{ marginBottom: '8px' }}>Пока пусто</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Рассчитайте смету и сохраните её.</p>
          <button className="btn-primary" style={{ margin: '0 auto' }} onClick={onBack}>Начать расчет</button>
        </div>
      ) : (
        <div className="history-list">
          {savedProjects.map(project => (
            <div key={project.id} className="history-card">
              <div className="history-card-top" onClick={() => loadProject(project)}>
                <div style={{ flex: 1 }}>
                  <div className="history-card-title">{project.title}</div>
                  <div className="history-card-meta">
                    {project.objectType === 'new' ? 'Новостройка' : 'Вторичка'} • {project.area} м²
                  </div>
                </div>
                <button className="btn-secondary btn-small" style={{ minWidth: '40px', padding: 0 }}>···</button>
              </div>
              <div className="history-card-bottom">
                <div className="history-card-sum">{formatCurrency(project.total)}</div>
                <div className="history-card-date">
                  {new Date(project.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button className="btn-secondary btn-small" style={{ flex: 1 }} onClick={() => loadProject(project)}>Открыть</button>
                <button className="btn-secondary btn-small" onClick={() => duplicateProject(project)}>👯</button>
                <button className="btn-secondary btn-small" style={{ color: '#ef4444' }} onClick={() => deleteProject(project.id)}>🗑️</button>
              </div>
            </div>
          ))}
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px', marginTop: '24px' }}>
            Свайп влево для действий
          </p>
        </div>
      )}
    </div>
  );
}
