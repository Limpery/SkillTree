import { Vertex } from '../vertex.ts';

export function createNetworkVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "http",
      "label": "HTTP и HTTPS",
      "short": "HTTP",
      "stageId": "network",
      "prerequisites": [
        "web-basics"
      ],
      "description": "Методы, статусы, заголовки, запрос и ответ, кеширование и защищённое соединение.",
      "outcome": "Прочитать сетевой запрос в DevTools и объяснить результат.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "fetch",
      "label": "Запросы к API",
      "short": "Fetch",
      "stageId": "network",
      "prerequisites": [
        "http",
        "async"
      ],
      "description": "Fetch, JSON, отмена запроса, проверка статуса и состояния загрузки.",
      "outcome": "Показать loading, success, empty и error, отменить устаревший запрос.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "rest",
      "label": "Контракт REST API",
      "short": "REST",
      "stageId": "network",
      "prerequisites": [
        "fetch"
      ],
      "description": "Ресурсы, параметры, пагинация, ошибки и согласование контракта с бэкендом.",
      "outcome": "Подключить список с фильтрацией и пагинацией по описанному контракту.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "security",
      "label": "Безопасность клиента",
      "short": "Safe",
      "stageId": "network",
      "prerequisites": [
        "http",
        "dom"
      ],
      "description": "XSS, CSRF, CORS, cookies, авторизация и границы клиентских проверок.",
      "outcome": "Не выводить непроверенный HTML и объяснить, что должен проверять сервер.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "typed-api",
      "label": "Типизированный API",
      "short": "TS API",
      "stageId": "network",
      "prerequisites": [
        "rest",
        "typescript-deep"
      ],
      "description": "Модели запросов, проверка внешних данных и единый слой доступа к API.",
      "outcome": "Преобразовать неизвестный ответ в проверенную модель или понятную ошибку.",
      "resources": [
        {
          "title": "TypeScript Handbook",
          "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
        },
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    })
  ];
}
