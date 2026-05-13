import React, { useState } from 'react';
import { demolitionSections, roughSections, finishSections, doorWindowSections } from '../data/workData.js';

export default function ScreenCustomPrices({ customPrices, updateCustomPrices, formatCurrency, onBack }) {
  const [activeTab, setActiveTab] = useState('demolition');

  const tabs = [
    { id: 'demolition', title: 'Демонтаж', data: demolitionSections },
    { id: 'rough', title: 'Черновые', data: roughSections },
    { id: 'finish', title: 'Чистовые', data: finishSections },
    { id: 'doors', title: 'Двери/Окна', data: doorWindowSections },
  ];

  const currentTabData = tabs.find(t => t.id === activeTab).data;

  return (
    <div className="screen-prices">
      <div className="history-header-row">
        <h2 className="screen-title" style={{ margin: 0 }}>Мой прайс</h2>
        <button className="btn-history-new" onClick={() => window.location.reload()}>Сбросить</button>
      </div>

      <div className="prices-tabs" style={{ marginTop: '16px' }}>
        {tabs.map(tab => (
          <button 
            key={tab.id} 
            className={`price-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="prices-list">
        {currentTabData.map((section, sIdx) => (
          <div key={sIdx} className="price-category-group">
            <div className="price-category-label">{section.title}</div>
            {section.items.map(item => (
              <div key={item.id} className="price-edit-row">
                <div className="price-edit-name">{item.name}</div>
                <div className="price-edit-input-group">
                  <input 
                    type="number" 
                    className="price-edit-input"
                    value={customPrices[item.id] !== undefined ? customPrices[item.id] : item.price}
                    onChange={(e) => updateCustomPrices(item.id, e.target.value)}
                    placeholder="0"
                  />
                  <span className="price-edit-unit">
                    {item.type === 'm2' ? '₽/м²' : item.type === 'unit' ? '₽/шт' : '₽'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ marginTop: '32px' }}>
        <button className="btn-primary" style={{ width: '100%' }} onClick={onBack}>Сохранить прайс</button>
      </div>
    </div>
  );
}
