import { Vertex } from '../vertex.ts';

export function createWebVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "html",
      "label": "HTML и семантика",
      "short": "HTML",
      "stageId": "web",
      "prerequisites": [
        "web-basics"
      ],
      "description": "Структура документа, смысловые элементы, ссылки, изображения и элементы форм.",
      "outcome": "Сверстать содержательную страницу с корректной структурой.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "css",
      "label": "CSS",
      "short": "CSS",
      "stageId": "web",
      "prerequisites": [
        "web-basics"
      ],
      "description": "Селекторы, каскад, специфичность, блочная модель и оформление.",
      "outcome": "Объяснить применённые стили и исправить конфликт каскада.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:css"
    }),
    new Vertex({
      "id": "css-layout",
      "label": "Flexbox и Grid",
      "short": "Layout",
      "stageId": "web",
      "prerequisites": [
        "css"
      ],
      "description": "Поток документа, позиционирование и современные способы компоновки.",
      "outcome": "Собрать устойчивую сетку без случайных отступов.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:css"
    }),
    new Vertex({
      "id": "responsive",
      "label": "Адаптивная вёрстка",
      "short": "RWD",
      "stageId": "web",
      "prerequisites": [
        "css-layout"
      ],
      "description": "Гибкие размеры, медиазапросы, изображения и поведение на разных экранах.",
      "outcome": "Проверить интерфейс на узком и широком экранах без переполнения.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:css"
    }),
    new Vertex({
      "id": "dom",
      "label": "DOM и события",
      "short": "DOM",
      "stageId": "web",
      "prerequisites": [
        "html",
        "javascript"
      ],
      "description": "Дерево документа, обработчики, всплытие, делегирование и формы.",
      "outcome": "Объяснить событие и управлять элементами страницы без утечек.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:javascript"
    }),
    new Vertex({
      "id": "design-basics",
      "label": "Работа с макетом",
      "short": "UI",
      "stageId": "web",
      "prerequisites": [
        "html",
        "css-layout"
      ],
      "description": "Отступы, типографика, состояния элементов и чтение дизайнерского макета.",
      "outcome": "Реализовать макет со всеми состояниями, а не только основной экран.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "accessibility",
      "label": "Доступность",
      "short": "A11y",
      "stageId": "web",
      "prerequisites": [
        "html",
        "dom"
      ],
      "description": "Клавиатура, фокус, подписи, семантика и доступные состояния.",
      "outcome": "Пройти основной сценарий клавиатурой и проверить ошибки форм.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "browser-api",
      "label": "Возможности браузера",
      "short": "API",
      "stageId": "web",
      "prerequisites": [
        "dom",
        "async"
      ],
      "description": "Storage, URL, History, File API и очистка обработчиков.",
      "outcome": "Добавить загрузку файла или сохранение настройки с обработкой ошибок.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    })
  ];
}
