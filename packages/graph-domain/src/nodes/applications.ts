import { Vertex } from '../vertex.ts';

export function createApplicationsVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "router",
      "label": "Роутинг React",
      "short": "Routes R",
      "stageId": "application",
      "prerequisites": [
        "react",
        "web-basics"
      ],
      "description": "Вложенные страницы, параметры URL, навигация и обработка отсутствующего маршрута.",
      "outcome": "Собрать многостраничный сценарий и сохранить фильтры в URL.",
      "resources": [
        {
          "title": "React — официальное руководство",
          "url": "https://react.dev/learn"
        },
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "global-state",
      "label": "Состояние React",
      "short": "Store R",
      "stageId": "application",
      "prerequisites": [
        "react-state",
        "composition"
      ],
      "description": "Локальное состояние, Context и store. Выбор Redux Toolkit или Zustand по задаче, без обязательного изучения обоих.",
      "outcome": "Обосновать место хранения состояния и не дублировать кеш сервера.",
      "resources": [
        {
          "title": "React — управление состоянием",
          "url": "https://react.dev/learn/managing-state"
        }
      ]
    }),
    new Vertex({
      "id": "styling",
      "label": "Стилизация приложения",
      "short": "CSS+",
      "stageId": "application",
      "prerequisites": [
        "responsive",
        "design-basics"
      ],
      "description": "Изоляция стилей, темы, адаптивные компоненты и выбор CSS Modules, SCSS или другого подхода.",
      "outcome": "Поддержать несколько состояний и размеров компонента без конфликтов.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "vue-router",
      "label": "Vue Router",
      "short": "Routes V",
      "stageId": "application",
      "prerequisites": [
        "vue",
        "web-basics"
      ],
      "description": "Вложенные маршруты, параметры URL, переходы и navigation guards. URL хранит состояние навигации.",
      "outcome": "Реализовать страницы и фильтры в URL, обработать неизвестный маршрут.",
      "resources": [
        {
          "title": "Vue Router — руководство",
          "url": "https://router.vuejs.org/introduction.html"
        }
      ]
    }),
    new Vertex({
      "id": "vue-pinia",
      "label": "Pinia",
      "short": "Pinia",
      "stageId": "application",
      "prerequisites": [
        "vue-composition"
      ],
      "description": "Stores, state, getters и actions. Разделение общего состояния интерфейса и кеша серверных данных.",
      "outcome": "Обосновать использование store и организовать состояние без дублирования кеша.",
      "resources": [
        {
          "title": "Vue — управление состоянием и Pinia",
          "url": "https://vuejs.org/guide/scaling-up/state-management.html"
        }
      ]
    }),
    new Vertex({
      "id": "server-state",
      "label": "Серверные данные",
      "short": "Query",
      "stageId": "application",
      "prerequisites": [
        "typed-api",
        "async"
      ],
      "description": "Кеш серверных данных, повторная загрузка, инвалидация и мутации. Принципы общие для React и Vue; интеграция отрабатывается в проекте.",
      "outcome": "Объяснить обновление кеша после изменения и предотвратить устаревший ответ.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "forms",
      "label": "Сложные формы",
      "short": "Forms",
      "stageId": "application",
      "prerequisites": [
        "browser-api",
        "security",
        "typescript"
      ],
      "description": "Валидация, связанные поля, ошибки сервера, загрузка файлов и доступность. Общая логика форм, применяемая в выбранном фреймворке.",
      "outcome": "Реализовать доступную форму с сохранением ввода при ошибке.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "auth",
      "label": "Сессии и доступ",
      "short": "Auth",
      "stageId": "application",
      "prerequisites": [
        "security",
        "fetch"
      ],
      "description": "Вход, завершение и истечение сессии, отказ в доступе. Общие правила поведения клиента; проверка прав остаётся на сервере.",
      "outcome": "Обработать отказ сервера и завершение сессии без ложной защиты одним UI.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "design-system",
      "label": "UI-компоненты",
      "short": "UI kit",
      "stageId": "application",
      "prerequisites": [
        "styling",
        "accessibility"
      ],
      "description": "Контракт UI-компонента, состояния, доступные варианты и документация. Реализация компонентов выполняется отдельно на React или Vue.",
      "outcome": "Собрать небольшой набор доступных компонентов с примерами.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "architecture",
      "label": "Архитектура frontend",
      "short": "Arch",
      "stageId": "application",
      "prerequisites": [
        "modules",
        "typed-api",
        "js-deep"
      ],
      "description": "Границы модулей, слой API, бизнес-логика и направление зависимостей. Принципы применяются в приложении на выбранном фреймворке.",
      "outcome": "Самостоятельно встроить новую функцию без связывания всех частей приложения.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "ssr",
      "label": "CSR SSR и гидратация",
      "short": "SSR",
      "stageId": "application",
      "prerequisites": [
        "web-basics",
        "http",
        "javascript"
      ],
      "description": "Различия клиентского и серверного рендеринга, гидратация и ограничения браузерных API на сервере.",
      "outcome": "Объяснить выбор способа рендеринга и найти причину расхождения HTML.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    })
  ];
}
