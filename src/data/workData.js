// Работы для Демонтажа (только вторичка)
export const demolitionSections = [
  {
    title: 'Полы',
    items: [
      { id: 'dem-floor-1', name: 'Демонтаж пола (под ключ)', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-floor' },
      { id: 'dem-floor-2', name: 'Демонтаж стяжки', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-floor' },
      { id: 'dem-floor-3', name: 'Демонтаж напольного покрытия', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-floor' },
      { id: 'dem-floor-4', name: 'Демонтаж плитки (пол)', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-floor' },
    ]
  },
  {
    title: 'Стены',
    items: [
      { id: 'dem-wall-1', name: 'Демонтаж стен/перегородок', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
    ]
  },
  {
    title: 'Потолки',
    items: [
      { id: 'dem-ceil-1', name: 'Демонтаж потолка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-ceil' },
      { id: 'dem-ceil-2', name: 'Очистка потолка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, group: 'dem-ceil' },
    ]
  },
  {
    title: 'Стены (отделка)',
    items: [
      { id: 'dem-finish-1', name: 'Снятие обоев', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'dem-finish-2', name: 'Демонтаж плитки (стены)', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'dem-finish-3', name: 'Очистка стен', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
    ]
  },
  {
    title: 'Сантехника',
    items: [
      { id: 'dem-plumb-1', name: 'Унитаз', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'dem-plumb-2', name: 'Ванна/душ', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'dem-plumb-3', name: 'Раковина', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'dem-plumb-4', name: 'Прочее', type: 'fixed', price: 0, quantity: 0, total: 0, selected: false },
    ]
  },
  {
    title: 'Двери/окна',
    items: [
      { id: 'dem-door-1', name: 'Демонтаж дверей', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'dem-door-2', name: 'Демонтаж окон', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
    ]
  },
  {
    title: 'Прочее',
    items: [
      { id: 'dem-other-1', name: 'Мебель', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'dem-other-2', name: 'Кухня', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
    ]
  },
  {
    title: 'Вывоз',
    items: [
      { id: 'dem-dump-1', name: 'Мусор', type: 'fixed', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'dem-dump-2', name: 'Уборка', type: 'fixed', price: 0, quantity: 0, total: 0, selected: false },
    ]
  },
];

// Черновые работы
export const roughSections = [
  {
    title: 'Черновые работы',
    items: [
      { id: 'rough-1', name: 'Перегородки', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-2', name: 'Штукатурка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-3', name: 'Шпаклёвка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-4', name: 'Стяжка пола', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-5', name: 'Потолок выравнивание', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-6', name: 'Гидроизоляция', type: 'm2', price: 0, quantity: 0, total: 0, selected: false },
      { id: 'rough-7', name: 'Прочее', type: 'fixed', price: 0, quantity: 0, total: 0, selected: false },
    ]
  }
];

// Чистовая
export const finishSections = [
  {
    title: 'Стены',
    items: [
      { id: 'finish-wall-1', name: 'Обои', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'checkbox', group: 'finish-wall' },
      { id: 'finish-wall-2', name: 'Покраска', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'checkbox', group: 'finish-wall' },
      { id: 'finish-wall-3', name: 'Плитка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'checkbox', group: 'finish-wall' },
    ]
  },
  {
    title: 'Полы',
    items: [
      { id: 'finish-floor-1', name: 'Ламинат/паркет', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'radio', group: 'finish-floor' },
      { id: 'finish-floor-2', name: 'Плитка', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'radio', group: 'finish-floor' },
    ]
  },
  {
    title: 'Потолки',
    items: [
      { id: 'finish-ceil-1', name: 'Натяжной', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'radio', group: 'finish-ceil' },
      { id: 'finish-ceil-2', name: 'Покраска', type: 'm2', price: 0, quantity: 0, total: 0, selected: false, inputType: 'radio', group: 'finish-ceil' },
    ]
  },
  {
    title: 'Дополнительно',
    items: [
      { id: 'finish-add-1', name: 'Плинтусы', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'finish-add-2', name: 'Прочее', type: 'fixed', price: 0, quantity: 0, total: 0, selected: false },
    ]
  }
];

// Двери / окна
export const doorWindowSections = [
  {
    title: 'Двери и окна',
    items: [
      { id: 'door-1', name: 'Входная дверь', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'door-2', name: 'Межкомнатные двери', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
      { id: 'door-3', name: 'Окна', type: 'unit', price: 0, quantity: 1, total: 0, selected: false },
    ]
  }
];