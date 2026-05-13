import { useCalculator } from './hooks/useCalculator.js';
import ScreenStart from './components/ScreenStart.jsx';
import ScreenWorks from './components/ScreenWorks.jsx';
import ScreenResult from './components/ScreenResult.jsx';
import ScreenPro from './components/ScreenPro.jsx';
import ScreenHistory from './components/ScreenHistory.jsx';
import ScreenSettings from './components/ScreenSettings.jsx';
import ScreenCustomPrices from './components/ScreenCustomPrices.jsx';
import { isAdmin } from './config.js';

function App() {
  const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const isCurrentUserAdmin = telegramUser ? isAdmin(telegramUser.id) : false;

  const {
    user,
    togglePro,
    updateBranding,
    updateCustomPrices,
    savedProjects,
    saveProject,
    loadProject,
    deleteProject,
    duplicateProject,
    objectType,
    setObjectType,
    area,
    setArea,
    currentScreen,
    setCurrentScreen,
    screens,
    nextScreen,
    prevScreen,
    sections,
    updateWork,
    toggleWork,
    calculateTotal,
    formatCurrency,
  } = useCalculator();

  const goTo = (screenId) => {
    const index = screens.findIndex(s => s.id === screenId);
    if (index !== -1) setCurrentScreen(index);
  };

  const renderScreen = () => {
    const screen = screens[currentScreen];

    switch (screen.id) {
      case 'start':
        return (
          <ScreenStart
            objectType={objectType}
            setObjectType={setObjectType}
            area={area}
            setArea={setArea}
            onNext={nextScreen}
            onGoToPro={() => goTo('pro')}
            onGoToHistory={() => goTo('history')}
            savedProjectsCount={savedProjects.length}
            isPro={user.isPro}
          />
        );

      case 'demolition':
        return (
          <ScreenWorks
            title="Демонтаж"
            sections={sections.demolition}
            sectionKey="demolition"
            toggleWork={toggleWork}
            updateWork={updateWork}
            formatCurrency={formatCurrency}
            onNext={nextScreen}
            onPrev={prevScreen}
            isLast={false}
          />
        );

      case 'rough':
        return (
          <ScreenWorks
            title="Черновые работы"
            sections={sections.rough}
            sectionKey="rough"
            toggleWork={toggleWork}
            updateWork={updateWork}
            formatCurrency={formatCurrency}
            onNext={nextScreen}
            onPrev={prevScreen}
            isLast={false}
          />
        );

      case 'finish':
        return (
          <ScreenWorks
            title="Чистовая отделка"
            sections={sections.finish}
            sectionKey="finish"
            toggleWork={toggleWork}
            updateWork={updateWork}
            formatCurrency={formatCurrency}
            onNext={nextScreen}
            onPrev={prevScreen}
            isLast={false}
          />
        );

      case 'doors':
        return (
          <ScreenWorks
            title="Двери и окна"
            sections={sections.doors}
            sectionKey="doors"
            toggleWork={toggleWork}
            updateWork={updateWork}
            formatCurrency={formatCurrency}
            onNext={nextScreen}
            onPrev={prevScreen}
            isLast={true}
          />
        );

      case 'result':
        return (
          <ScreenResult
            calculateTotal={calculateTotal}
            formatCurrency={formatCurrency}
            area={area}
            objectType={objectType}
            onPrev={prevScreen}
            isPro={user.isPro}
            branding={user.branding}
            onSave={() => saveProject(`${objectType === 'new' ? 'Новостройка' : 'Вторичка'}, ${area}м²`)}
            onGoToPro={() => goTo('pro')}
          />
        );

      case 'pro':
        return (
          <ScreenPro 
            user={user} 
            togglePro={togglePro} 
            onBack={() => setCurrentScreen(0)} 
          />
        );

      case 'history':
        return (
          <ScreenHistory
            savedProjects={savedProjects}
            loadProject={loadProject}
            deleteProject={deleteProject}
            duplicateProject={duplicateProject}
            formatCurrency={formatCurrency}
            onBack={() => setCurrentScreen(0)}
          />
        );

      case 'settings':
        return (
          <ScreenSettings
            branding={user.branding}
            updateBranding={updateBranding}
            onBack={() => setCurrentScreen(0)}
          />
        );

      case 'prices':
        return (
          <ScreenCustomPrices
            customPrices={user.customPrices}
            updateCustomPrices={updateCustomPrices}
            formatCurrency={formatCurrency}
            onBack={() => setCurrentScreen(0)}
          />
        );

      default:
        return null;
    }
  };

  const isUtilityScreen = ['pro', 'history', 'settings', 'prices'].includes(screens[currentScreen].id);

  return (
    <div className={`app ${user.isPro ? 'theme-pro' : ''}`}>
      {!isUtilityScreen && (
        <header className="app-header">
          <div className="header-top">
            <div className="app-logo" onClick={() => setCurrentScreen(0)}>
              <h1 className="app-title">Smetiq</h1>
              {user.isPro && <span className="pro-badge-mini">PRO</span>}
              {isCurrentUserAdmin && <span className="pro-badge-mini" style={{ background: '#ef4444', color: 'white', marginLeft: '4px' }}>ADMIN</span>}
            </div>
            <div className="header-actions">
              {user.isPro ? (
                <>
                  <button className="nav-icon-btn" onClick={() => goTo('history')} title="История">📂</button>
                  <button className="nav-icon-btn" onClick={() => goTo('prices')} title="Цены">💰</button>
                  <button className="nav-icon-btn" onClick={() => goTo('settings')} title="Настройки">⚙️</button>
                </>
              ) : (
                <button className="btn-pro-pill" onClick={() => goTo('pro')}>PRO</button>
              )}
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentScreen + 1) / screens.filter(s => !['pro', 'history', 'settings', 'prices'].includes(s.id)).length) * 100}%` }}
            />
          </div>
        </header>
      )}

      <main className="app-main">
        {renderScreen()}
      </main>

      {!isUtilityScreen && (
        <div className="sticky-footer">
          <div className="total-display">
            <span className="total-label">Итого</span>
            <span className="total-amount">{formatCurrency(calculateTotal().total)}</span>
          </div>
          {['demolition', 'rough', 'finish', 'doors', 'start'].includes(screens[currentScreen].id) && (
            <button className="btn-primary" onClick={nextScreen}>
              {screens[currentScreen].id === 'doors' ? 'Смета' : 'Далее'}
            </button>
          )}
          {screens[currentScreen].id === 'result' && (
            <button className="btn-secondary" onClick={() => window.location.reload()}>
              Заново
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

