import { useState, useCallback, useEffect } from 'react';
import { demolitionSections, roughSections, finishSections, doorWindowSections } from '../data/workData.js';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const deepCloneSections = (sections) => {
  return sections.map(section => ({
    ...section,
    items: section.items.map(item => ({ ...item }))
  }));
};

// Initial state for user
const initialUser = {
  isPro: false,
  subscriptionType: 'free',
  branding: {
    logo: '',
    companyName: '',
    executorName: '',
    phone: '',
    telegram: '',
    whatsapp: '',
    comment: ''
  },
  customPrices: {}, // { itemId: price }
};

export function useCalculator() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smetiq_user');
    return saved ? JSON.parse(saved) : initialUser;
  });

  const [savedProjects, setSavedProjects] = useState(() => {
    const saved = localStorage.getItem('smetiq_projects');
    return saved ? JSON.parse(saved) : [];
  });

  const [objectType, setObjectType] = useState('secondary');
  const [area, setArea] = useState(0);
  const [currentScreen, setCurrentScreen] = useState(0);
  const [sections, setSections] = useState({
    demolition: deepCloneSections(demolitionSections),
    rough: deepCloneSections(roughSections),
    finish: deepCloneSections(finishSections),
    doors: deepCloneSections(doorWindowSections),
  });

  // Persist user and projects
  useEffect(() => {
    localStorage.setItem('smetiq_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('smetiq_projects', JSON.stringify(savedProjects));
  }, [savedProjects]);

  const updateWork = useCallback((sectionKey, itemId, field, value) => {
    setSections(prev => {
      const newSections = { ...prev };
      const sectionArray = newSections[sectionKey];
      
      let itemToUpdate = null;
      let targetSection = null;

      for (const section of sectionArray) {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          itemToUpdate = item;
          targetSection = section;
          break;
        }
      }

      if (!itemToUpdate) return prev;

      const newItem = { 
        ...itemToUpdate, 
        [field]: field === 'selected' ? value : (value === '' ? 0 : Number(value)) 
      };
      
      // Calculate total
      if (newItem.type === 'fixed') {
        newItem.total = newItem.price || 0;
      } else if (newItem.type === 'unit') {
        newItem.total = (newItem.price || 0) * (newItem.quantity || 1);
      } else if (newItem.type === 'm2') {
        newItem.total = (newItem.price || 0) * (newItem.quantity || 0);
      }

      targetSection.items = targetSection.items.map(i => i.id === itemId ? newItem : i);
      
      return newSections;
    });
  }, []);

  const toggleWork = useCallback((sectionKey, itemId) => {
    setSections(prev => {
      const newSections = { ...prev };
      const sectionArray = newSections[sectionKey];

      let clickedItem = null;
      let targetSection = null;

      for (const section of sectionArray) {
        const item = section.items.find(i => i.id === itemId);
        if (item) {
          clickedItem = item;
          targetSection = section;
          break;
        }
      }

      if (!clickedItem) return prev;
      
      // Handle radio buttons (unselect others in same group)
      if (clickedItem.inputType === 'radio') {
        targetSection.items = targetSection.items.map(item => {
          if (item.group === clickedItem.group) {
            const isSelected = item.id === itemId;
            const newItem = { 
              ...item, 
              selected: isSelected,
              price: isSelected ? (user.customPrices[item.id] || item.price || 0) : 0, 
              quantity: isSelected ? (item.quantity || (item.type === 'm2' ? area : 1)) : 0, 
              total: 0 
            };
            if (isSelected && newItem.type === 'm2') {
              if (newItem.id.includes('floor') || newItem.name.toLowerCase().includes('пол')) {
                newItem.quantity = area || 0;
              } else if (newItem.id.includes('ceil') || newItem.name.toLowerCase().includes('потол')) {
                newItem.quantity = area || 0;
              } else if (newItem.id.includes('wall') || newItem.name.toLowerCase().includes('стен')) {
                newItem.quantity = (area || 0) * 2.5;
              }
              newItem.total = (newItem.price || 0) * (newItem.quantity || 0);
            }
            return newItem;
          }
          return item;
        });
      } else {
        // Handle checkbox / regular toggle
        const isNowSelected = !clickedItem.selected;
        const newItem = { ...clickedItem, selected: isNowSelected };
        
        if (!isNowSelected) {
          newItem.price = 0;
          newItem.quantity = 0;
          newItem.total = 0;
        } else {
          // Use custom price if available
          newItem.price = user.customPrices[newItem.id] || newItem.price || 0;

          // Auto-fill quantities based on area if m2
          if (newItem.type === 'm2') {
            if (newItem.id.includes('floor') || newItem.name.toLowerCase().includes('пол')) {
              newItem.quantity = area || 0;
            } else if (newItem.id.includes('ceil') || newItem.name.toLowerCase().includes('потол')) {
              newItem.quantity = area || 0;
            } else if (newItem.id.includes('wall') || newItem.name.toLowerCase().includes('стен')) {
              newItem.quantity = (area || 0) * 2.5;
            }
            newItem.total = (newItem.price || 0) * (newItem.quantity || 0);
          } else if (newItem.type === 'unit') {
            newItem.quantity = newItem.quantity || 1;
            newItem.total = (newItem.price || 0) * (newItem.quantity || 1);
          } else {
            newItem.total = newItem.price || 0;
          }
        }
        targetSection.items = targetSection.items.map(i => i.id === itemId ? newItem : i);
      }
      
      return newSections;
    });
  }, [area, user.customPrices]);

  const calculateTotal = useCallback(() => {
    let total = 0;
    const breakdown = [];

    Object.entries(sections).forEach(([key, sectionArray]) => {
      if (key === 'demolition' && objectType === 'new') return;
      
      let sectionCategoryTotal = 0;
      sectionArray.forEach(section => {
        const subTotal = section.items
          .filter(item => item.selected)
          .reduce((sum, item) => sum + (item.total || 0), 0);
        sectionCategoryTotal += subTotal;
      });

      if (sectionCategoryTotal > 0) {
        const titles = {
          demolition: 'Демонтаж',
          rough: 'Черновые работы',
          finish: 'Чистовая отделка',
          doors: 'Двери и окна'
        };
        breakdown.push({ title: titles[key] || key, total: sectionCategoryTotal, key });
      }
      total += sectionCategoryTotal;
    });

    return { total, breakdown };
  }, [sections, objectType]);

  const screens = [
    { id: 'start', title: 'Параметры объекта' },
    ...(objectType === 'secondary' ? [{ id: 'demolition', title: 'Демонтаж' }] : []),
    { id: 'rough', title: 'Черновые работы' },
    { id: 'finish', title: 'Чистовая отделка' },
    { id: 'doors', title: 'Двери и окна' },
    { id: 'result', title: 'Смета' },
    { id: 'pro', title: 'Smetiq PRO' },
    { id: 'history', title: 'Мои проекты' },
    { id: 'settings', title: 'Настройки PRO' },
    { id: 'prices', title: 'Мой прайс' },
  ];

  const nextScreen = useCallback(() => {
    setCurrentScreen(prev => Math.min(prev + 1, screens.length - 1));
  }, [screens.length]);

  const prevScreen = useCallback(() => {
    setCurrentScreen(prev => Math.max(prev - 1, 0));
  }, []);

  const saveProject = useCallback((title = 'Новая смета') => {
    const { total } = calculateTotal();
    const newProject = {
      id: Date.now().toString(),
      title,
      area,
      objectType,
      sections: deepCloneSections(Object.values(sections).flat()), // Simplified for storage
      rawSections: sections,
      total,
      createdAt: new Date().toISOString(),
    };
    setSavedProjects(prev => [newProject, ...prev]);
    return newProject;
  }, [area, objectType, sections, calculateTotal]);

  const loadProject = useCallback((project) => {
    setArea(project.area);
    setObjectType(project.objectType);
    setSections(project.rawSections);
    setCurrentScreen(screens.findIndex(s => s.id === 'result'));
  }, [screens]);

  const deleteProject = useCallback((id) => {
    setSavedProjects(prev => prev.filter(p => p.id !== id));
  }, []);

  const duplicateProject = useCallback((project) => {
    const duplicated = {
      ...project,
      id: Date.now().toString(),
      title: `${project.title} (копия)`,
      createdAt: new Date().toISOString(),
    };
    setSavedProjects(prev => [duplicated, ...prev]);
  }, []);

  const togglePro = useCallback(() => {
    setUser(prev => ({
      ...prev,
      isPro: !prev.isPro,
      subscriptionType: !prev.isPro ? 'pro' : 'free'
    }));
  }, []);

  const updateBranding = useCallback((branding) => {
    setUser(prev => ({ ...prev, branding: { ...prev.branding, ...branding } }));
  }, []);

  const updateCustomPrices = useCallback((itemId, price) => {
    setUser(prev => ({
      ...prev,
      customPrices: { ...prev.customPrices, [itemId]: Number(price) }
    }));
  }, []);

  return {
    user,
    setUser,
    togglePro,
    updateBranding,
    updateCustomPrices,
    savedProjects,
    saveProject,
    loadProject,
    deleteProject,
    duplicateProject,
    objectType,
    setObjectType: (type) => {
      setObjectType(type);
      setCurrentScreen(0);
    },
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
  };
}