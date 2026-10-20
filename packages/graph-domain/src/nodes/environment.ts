import { Vertex } from '../vertex.ts';

export function createEnvironmentVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "web-basics",
      "label": "Как работает веб",
      "short": "Web",
      "stageId": "foundation",
      "prerequisites": [],
      "description": "Браузер, сервер, URL, DNS и загрузка страницы. Отправная точка для понимания интерфейса и сети.",
      "outcome": "Объяснить путь от адреса в браузере до отображения страницы.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "programming",
      "label": "Основы программирования",
      "short": "</>",
      "stageId": "foundation",
      "prerequisites": [],
      "description": "Переменные, типы данных, условия, циклы, функции и разбиение задачи на шаги.",
      "outcome": "Решить небольшую задачу и объяснить выбранный алгоритм.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "git",
      "label": "Git",
      "short": "Git",
      "stageId": "foundation",
      "prerequisites": [],
      "description": "Коммиты, ветки, слияние, удалённый репозиторий и восстановление изменений.",
      "outcome": "Создать ветку, оформить изменение и разрешить конфликт.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:environment"
    }),
    new Vertex({
      "id": "terminal",
      "label": "Терминал и среда",
      "short": ">_",
      "stageId": "foundation",
      "prerequisites": [],
      "description": "Командная строка, файловая система, редактор и переменные окружения.",
      "outcome": "Запустить проект по инструкции и разобраться с ошибкой окружения.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:environment"
    })
  ];
}
