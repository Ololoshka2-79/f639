export default function WorkList({ sections, sectionKey, toggleWork, updateWork, formatCurrency }) {
  if (!sections || sections.length === 0) return null;

  return (
    <div className="work-list">
      {sections.map((section, idx) => {
        const selectedItems = section.items.filter(i => i.selected);
        const sectionTotal = selectedItems.reduce((sum, item) => sum + (item.total || 0), 0);

        return (
          <div key={idx} className="section-block">
            <div className="section-header">
              <h3 className="section-title">{section.title}</h3>
            </div>
            
            {section.items.map(item => (
              <div key={item.id} className={`work-item ${item.selected ? 'selected' : ''}`}>
                <div 
                  className="work-label"
                  onClick={() => toggleWork(sectionKey, item.id)}
                >
                  <input
                    type={item.inputType === 'radio' ? 'radio' : 'checkbox'}
                    checked={item.selected || false}
                    onChange={() => {}} // Controlled by parent div click
                    className={item.inputType === 'radio' ? 'work-radio' : 'work-checkbox'}
                  />
                  <span className="work-name">{item.name}</span>
                  {(!item.selected && item.price > 0) && (
                    <span className="item-total">{formatCurrency(item.total)}</span>
                  )}
                </div>

                {item.selected && (
                  <div className="work-fields">
                    <div className="field-row">
                      <div className="field-group">
                        <label className="field-label">
                          {item.type === 'm2' ? 'Цена за м²' : item.type === 'unit' ? 'Цена за шт' : 'Стоимость'}
                        </label>
                        <input
                          type="number"
                          value={item.price || ''}
                          onChange={(e) => updateWork(sectionKey, item.id, 'price', e.target.value)}
                          placeholder="0"
                          className="field-input"
                        />
                      </div>
                      
                      {item.type !== 'fixed' && (
                        <div className="field-group">
                          <label className="field-label">
                            {item.type === 'm2' ? 'Кол-во м²' : 'Кол-во'}
                          </label>
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) => updateWork(sectionKey, item.id, 'quantity', e.target.value)}
                            placeholder={item.type === 'm2' ? '0' : '1'}
                            className="field-input"
                          />
                        </div>
                      )}
                      
                      <div className="item-total">{formatCurrency(item.total)}</div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}