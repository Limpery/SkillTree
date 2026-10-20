import { validateCatalog, type Catalog, type Topic, type TopicGroup } from './index.ts';

export type Material = { title: string; url: string };
export type KnowledgeTopic = Topic & { outcome: string; resources: Material[]; stageId: string; practice?: boolean };
export type CurriculumStage = { id: string; title: string; short: string };
export type KnowledgeCatalog = Omit<Catalog, 'topics'> & { topics: KnowledgeTopic[]; stages: CurriculumStage[] };

export const MIDDLE_REACT_ROLE = 'role:middle-react';
const references = {
  web: { title: 'MDN — основы веб-разработки', url: 'https://developer.mozilla.org/en-US/curriculum/core/' },
  react: { title: 'React — официальное руководство', url: 'https://react.dev/learn' },
  state: { title: 'React — управление состоянием', url: 'https://react.dev/learn/managing-state' },
  effects: { title: 'React — эффекты и внешние системы', url: 'https://react.dev/learn/escape-hatches' },
  types: { title: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html' },
  tests: { title: 'Playwright — пользовательские сценарии', url: 'https://playwright.dev/docs/writing-tests' },
  performance: { title: 'web.dev — производительность', url: 'https://web.dev/learn/performance' },
} satisfies Record<string, Material>;

export function createMiddleReactCatalog(): KnowledgeCatalog {
  const stages: CurriculumStage[] = [
    { id: 'foundation', title: 'Основы и рабочая среда', short: 'База' },
    { id: 'web', title: 'Интерфейс и браузер', short: 'Веб' },
    { id: 'language', title: 'JavaScript и TypeScript', short: 'JS / TS' },
    { id: 'network', title: 'Сеть, API и безопасность', short: 'API' },
    { id: 'react', title: 'React и компоненты', short: 'React' },
    { id: 'application', title: 'Разработка приложения', short: 'Приложение' },
    { id: 'quality', title: 'Качество и тестирование', short: 'Качество' },
    { id: 'delivery', title: 'Работа в команде и выпуск', short: 'Выпуск' },
    { id: 'practice', title: 'Самостоятельная работа Middle', short: 'Практика' },
  ];
  const groups: TopicGroup[] = stages.map(stage => ({ id: stage.id, label: stage.title, short: stage.short,
    description: stage.title, kind: stage.id === 'foundation' ? 'foundation' : 'direction', position: { x: 0, y: 0 } }));
  const topics: KnowledgeTopic[] = [];
  function add(id: string, label: string, short: string, stageId: string, prerequisites: string[], description: string, outcome: string, sources: (keyof typeof references)[] = ['web'], practice = false) {
    topics.push({ id, label, short, stageId, groupId: stageId, prerequisites, description, outcome,
      resources: sources.map(key => references[key]), kind: stageId === 'foundation' ? 'foundation' : 'technology', position: { x: 0, y: 0 }, practice });
  }

  add('web-basics', 'Как работает веб', 'Web', 'foundation', [], 'Браузер, сервер, URL, DNS и загрузка страницы. Отправная точка для понимания интерфейса и сети.', 'Объяснить путь от адреса в браузере до отображения страницы.');
  add('programming', 'Основы программирования', '</>', 'foundation', [], 'Переменные, типы данных, условия, циклы, функции и разбиение задачи на шаги.', 'Решить небольшую задачу и объяснить выбранный алгоритм.');
  add('git', 'Git', 'Git', 'foundation', [], 'Коммиты, ветки, слияние, удалённый репозиторий и восстановление изменений.', 'Создать ветку, оформить изменение и разрешить конфликт.');
  add('terminal', 'Терминал и среда', '>_', 'foundation', [], 'Командная строка, файловая система, редактор и переменные окружения.', 'Запустить проект по инструкции и разобраться с ошибкой окружения.');

  add('html', 'HTML и семантика', 'HTML', 'web', ['web-basics'], 'Структура документа, смысловые элементы, ссылки, изображения и элементы форм.', 'Сверстать содержательную страницу с корректной структурой.');
  add('css', 'CSS', 'CSS', 'web', ['web-basics'], 'Селекторы, каскад, специфичность, блочная модель и оформление.', 'Объяснить применённые стили и исправить конфликт каскада.');
  add('javascript', 'JavaScript', 'JS', 'language', ['programming'], 'Функции, объекты, массивы, преобразования типов и обработка ошибок.', 'Написать преобразование данных без лишних мутаций.');
  add('http', 'HTTP и HTTPS', 'HTTP', 'network', ['web-basics'], 'Методы, статусы, заголовки, запрос и ответ, кеширование и защищённое соединение.', 'Прочитать сетевой запрос в DevTools и объяснить результат.');
  add('git-workflow', 'Командная работа с Git', 'PR', 'delivery', ['git'], 'Pull request, review, небольшие коммиты, rebase и договорённости команды.', 'Подготовить проверяемый PR и учесть замечания ревью.');

  add('css-layout', 'Flexbox и Grid', 'Layout', 'web', ['css'], 'Поток документа, позиционирование и современные способы компоновки.', 'Собрать устойчивую сетку без случайных отступов.');
  add('responsive', 'Адаптивная вёрстка', 'RWD', 'web', ['css-layout'], 'Гибкие размеры, медиазапросы, изображения и поведение на разных экранах.', 'Проверить интерфейс на узком и широком экранах без переполнения.');
  add('design-basics', 'Работа с макетом', 'UI', 'web', ['html', 'css-layout'], 'Отступы, типографика, состояния элементов и чтение дизайнерского макета.', 'Реализовать макет со всеми состояниями, а не только основной экран.');
  add('dom', 'DOM и события', 'DOM', 'web', ['html', 'javascript'], 'Дерево документа, обработчики, всплытие, делегирование и формы.', 'Объяснить событие и управлять элементами страницы без утечек.');
  add('js-deep', 'JavaScript глубже', 'JS+', 'language', ['javascript'], 'Области видимости, замыкания, this, прототипы, коллекции и стоимость операций.', 'Объяснить поведение кода и выбрать подходящую структуру данных.');
  add('modules', 'Модули и npm', 'npm', 'language', ['javascript', 'terminal'], 'ES-модули, Node.js для инструментов, зависимости, lock-файл и npm-скрипты.', 'Воспроизвести установку и отделить зависимости приложения от инструментов.');
  add('async', 'Асинхронность', 'async', 'language', ['javascript'], 'Event loop, Promise, async/await, параллельные операции и ошибки.', 'Согласовать несколько операций и обработать отказ одной из них.');
  add('typescript', 'TypeScript', 'TS', 'language', ['javascript'], 'Типы, интерфейсы, объединения, narrowing и строгая проверка.', 'Описать данные без подмены неизвестных значений типом any.', ['types']);
  add('typescript-deep', 'Типизация сложных данных', 'TS+', 'language', ['typescript'], 'Generics, utility types, discriminated unions и границы типобезопасности.', 'Спроектировать типы состояний и переиспользуемого интерфейса.', ['types']);
  add('build', 'Сборка и инструменты', 'Vite', 'delivery', ['modules'], 'Vite, production-сборка, переменные окружения, lint и форматирование.', 'Настроить сборку, найти ошибку конфигурации и не раскрыть секреты в клиенте.');
  add('debugging', 'DevTools и отладка', 'Debug', 'quality', ['dom', 'http'], 'Точки останова, стек вызовов, сеть, DOM и воспроизведение ошибки.', 'Найти причину ошибки по наблюдениям и минимальному примеру.');
  add('accessibility', 'Доступность', 'A11y', 'web', ['html', 'dom'], 'Клавиатура, фокус, подписи, семантика и доступные состояния.', 'Пройти основной сценарий клавиатурой и проверить ошибки форм.');
  add('browser-api', 'Возможности браузера', 'API', 'web', ['dom', 'async'], 'Storage, URL, History, File API и очистка обработчиков.', 'Добавить загрузку файла или сохранение настройки с обработкой ошибок.');

  add('fetch', 'Запросы к API', 'Fetch', 'network', ['http', 'async'], 'Fetch, JSON, отмена запроса, проверка статуса и состояния загрузки.', 'Показать loading, success, empty и error, отменить устаревший запрос.');
  add('rest', 'Контракт REST API', 'REST', 'network', ['fetch'], 'Ресурсы, параметры, пагинация, ошибки и согласование контракта с бэкендом.', 'Подключить список с фильтрацией и пагинацией по описанному контракту.');
  add('security', 'Безопасность клиента', 'Safe', 'network', ['http', 'dom'], 'XSS, CSRF, CORS, cookies, авторизация и границы клиентских проверок.', 'Не выводить непроверенный HTML и объяснить, что должен проверять сервер.');
  add('typed-api', 'Типизированный API', 'TS API', 'network', ['rest', 'typescript-deep'], 'Модели запросов, проверка внешних данных и единый слой доступа к API.', 'Преобразовать неизвестный ответ в проверенную модель или понятную ошибку.', ['types', 'web']);

  add('react', 'Основы React', 'React', 'react', ['html', 'css', 'javascript'], 'JSX, компоненты, props, события, списки и правила рендеринга.', 'Разбить интерфейс на компоненты с понятными входными данными.', ['react']);
  add('react-state', 'Состояние и Hooks', 'Hooks', 'react', ['react', 'js-deep'], 'useState, useReducer, обновления состояния и неизменяемые данные.', 'Смоделировать переходы интерфейса без дублирующего состояния.', ['state']);
  add('react-effects', 'Эффекты и refs', 'Effects', 'react', ['react-state', 'async'], 'Синхронизация с внешней системой, зависимости эффекта, cleanup и refs.', 'Удалить лишний эффект и корректно очистить подписку.', ['effects']);
  add('react-types', 'React с TypeScript', 'TSX', 'react', ['react', 'typescript'], 'Типы props, событий, children, hooks и состояний компонента.', 'Создать типизированный компонент и обработчик без небезопасных приведений.', ['react', 'types']);
  add('composition', 'Композиция компонентов', 'Parts', 'react', ['react-state', 'react-types'], 'Композиция, управляемые компоненты, custom hooks и ответственность компонентов.', 'Вынести общую логику, сохранив ясный интерфейс компонентов.', ['react', 'state']);
  add('router', 'Маршрутизация', 'Routes', 'application', ['react', 'web-basics'], 'Вложенные страницы, параметры URL, навигация и обработка отсутствующего маршрута.', 'Собрать многостраничный сценарий и сохранить фильтры в URL.', ['react', 'web']);
  add('server-state', 'Серверные данные', 'Query', 'application', ['react-effects', 'typed-api'], 'Кеш, повторная загрузка, инвалидация и согласование мутаций. Практика на TanStack Query или аналогичном инструменте.', 'Обновить данные после изменения и избежать устаревших ответов.', ['effects', 'types']);
  add('global-state', 'Общее состояние', 'State', 'application', ['react-state', 'composition'], 'Локальное состояние, Context и store. Выбор Redux Toolkit или Zustand по задаче, без обязательного изучения обоих.', 'Обосновать место хранения состояния и не дублировать кеш сервера.', ['state']);
  add('forms', 'Сложные формы', 'Forms', 'application', ['react-state', 'react-types', 'browser-api', 'security'], 'Валидация, связанные поля, отправка, ошибки сервера и загрузка файлов.', 'Реализовать доступную форму с сохранением ввода при ошибке.', ['react', 'web']);
  add('auth', 'Авторизация в интерфейсе', 'Auth', 'application', ['router', 'security', 'react-effects'], 'Вход, завершение сессии, истечение доступа и защищённые страницы.', 'Обработать отказ сервера и завершение сессии без ложной защиты одним UI.', ['web', 'effects']);
  add('styling', 'Стилизация приложения', 'CSS+', 'application', ['responsive', 'react', 'design-basics'], 'Изоляция стилей, темы, адаптивные компоненты и выбор CSS Modules, SCSS или другого подхода.', 'Поддержать несколько состояний и размеров компонента без конфликтов.', ['web', 'react']);
  add('design-system', 'UI-компоненты', 'UI kit', 'application', ['composition', 'styling', 'accessibility'], 'Переиспользуемые элементы, доступные варианты, документация и согласованность.', 'Собрать небольшой набор доступных компонентов с примерами.', ['react', 'web']);

  add('unit-tests', 'Модульные тесты', 'Unit', 'quality', ['javascript', 'modules'], 'Проверка логики, граничных случаев и асинхронных функций, например в Vitest.', 'Написать тест на поведение, который обнаруживает реальную ошибку.');
  add('component-tests', 'Тесты компонентов', 'RTL', 'quality', ['unit-tests', 'react-types'], 'Проверка интерфейса через действия пользователя, роли и асинхронные состояния.', 'Проверить форму и ошибку загрузки без привязки к внутреннему state.', ['react', 'tests']);
  add('e2e', 'Пользовательские сценарии', 'E2E', 'quality', ['component-tests', 'auth', 'forms', 'server-state'], 'Playwright, изоляция данных, устойчивые локаторы и критические сценарии.', 'Проверить вход, изменение данных и восстановление после ошибки.', ['tests']);
  add('performance', 'Производительность', 'Perf', 'quality', ['react-effects', 'css-layout', 'js-deep', 'debugging'], 'Профилирование, загрузка ресурсов, разделение кода, рендеры и обоснованная оптимизация.', 'Измерить проблему до исправления и подтвердить результат после.', ['performance', 'effects']);
  add('resilience', 'Устойчивость интерфейса', 'Errors', 'quality', ['server-state', 'debugging'], 'Границы ошибок, retry, недоступность сети, пустые данные и гонки запросов.', 'Сохранить управляемое состояние приложения при сбое внешнего сервиса.', ['effects', 'web']);
  add('architecture', 'Архитектура frontend', 'Arch', 'application', ['composition', 'server-state', 'modules'], 'Границы модулей, зависимости, слой API и отделение бизнес-логики от представления.', 'Самостоятельно встроить новую функцию без связывания всех частей приложения.', ['react', 'state']);
  add('ssr', 'CSR SSR и гидратация', 'SSR', 'application', ['router', 'react', 'http'], 'Различия клиентского и серверного рендеринга, гидратация и ограничения браузерных API на сервере.', 'Объяснить выбор способа рендеринга и найти причину расхождения HTML.', ['react', 'web']);
  add('ci', 'CI и проверки', 'CI', 'delivery', ['git-workflow', 'build', 'e2e'], 'Повторяемая установка, типы, lint, тесты и сборка при изменении кода.', 'Настроить pipeline, который останавливает выпуск при ошибке.');
  add('deploy', 'Развёртывание', 'Deploy', 'delivery', ['build', 'router', 'security'], 'Статические файлы, маршруты SPA, окружения, HTTPS и откат версии.', 'Выпустить приложение и проверить прямое открытие вложенной страницы.');
  add('observability', 'Диагностика в production', 'Logs', 'delivery', ['resilience', 'performance'], 'Ошибки пользователя, логи, source maps и измерение проблем после выпуска.', 'Воспроизвести production-ошибку без раскрытия личных данных.', ['performance', 'web']);
  add('teamwork', 'Работа с задачей', 'Team', 'delivery', ['git-workflow', 'design-basics'], 'Уточнение требований, декомпозиция, оценка, review и коммуникация с дизайном и бэкендом.', 'Довести задачу от требований до проверенного результата в команде.');
  add('delivery', 'Выпуск функции', 'Ship', 'delivery', ['ci', 'deploy', 'observability'], 'Совместная проверка приложения, мониторинга и возможности отката.', 'Выпустить изменение, проверить его и подготовить план отката.', ['tests', 'performance']);

  add('middle-project', 'Приложение уровня Middle', 'Project', 'practice', ['architecture', 'design-system', 'global-state', 'forms', 'delivery', 'security', 'ssr', 'teamwork'],
    'Командный кабинет: роли пользователей, маршруты, таблицы с фильтрами, редактирование, файлы и работа с API. Исходники, тесты и развёрнутая версия входят в результат.',
    'Самостоятельно спроектировать и выпустить функцию, объяснить решения, обработать сбои и принять review.', ['react', 'tests', 'performance'], true);
  topics.push({ id: MIDDLE_REACT_ROLE, label: 'Middle React-разработчик', short: 'Middle', stageId: 'practice', groupId: 'practice', kind: 'role', prerequisites: ['middle-project'],
    description: 'Целевой профиль: самостоятельная разработка и сопровождение React-приложения, работа с API и командным процессом. Темы объединяются в практическом результате.',
    outcome: 'Взять функцию в работу, реализовать, протестировать, выпустить и сопровождать её с обоснованием решений.', resources: [references.react, references.web], position: { x: 0, y: 0 } });
  const relations = topics.flatMap(topic => topic.prerequisites.map(source => ({ id: `${source}>${topic.id}`, source, target: topic.id, kind: 'prerequisite' as const })));
  const catalog: KnowledgeCatalog = { topics, groups, relations, stages, roles: [{ id: MIDDLE_REACT_ROLE, groupId: 'practice', aliases: ['react', 'middle react', 'мидл реакт', 'react разработчик', 'frontend react'], requirements: [{ id: 'middle:all', mode: 'all', topics: ['middle-project'] }] }] };
  validateCatalog(catalog);
  return catalog;
}
