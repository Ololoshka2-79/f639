import WorkList from './WorkList.jsx';

export default function ScreenWorks({ title, sections, sectionKey, toggleWork, updateWork, formatCurrency, onNext, onPrev, isLast }) {
  return (
    <div className="screen-works">
      <h2 className="screen-title">{title}</h2>
      
      <WorkList
        sections={sections}
        sectionKey={sectionKey}
        toggleWork={toggleWork}
        updateWork={updateWork}
        formatCurrency={formatCurrency}
      />
    </div>

  );
}