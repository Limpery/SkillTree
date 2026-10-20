import { Vertex } from '../vertex.ts';

export function createDeliveryVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "git-workflow",
      "label": "Командная работа с Git",
      "short": "PR",
      "stageId": "delivery",
      "prerequisites": [
        "git"
      ],
      "description": "Pull request, review, небольшие коммиты, rebase и договорённости команды.",
      "outcome": "Подготовить проверяемый PR и учесть замечания ревью.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "build",
      "label": "Сборка и инструменты",
      "short": "Vite",
      "stageId": "delivery",
      "prerequisites": [
        "modules"
      ],
      "description": "Vite, production-сборка, переменные окружения, lint и форматирование.",
      "outcome": "Настроить сборку, найти ошибку конфигурации и не раскрыть секреты в клиенте.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "teamwork",
      "label": "Работа с задачей",
      "short": "Team",
      "stageId": "delivery",
      "prerequisites": [
        "git-workflow",
        "design-basics"
      ],
      "description": "Уточнение требований, декомпозиция, оценка, review и коммуникация с дизайном и бэкендом.",
      "outcome": "Довести задачу от требований до проверенного результата в команде.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "ci",
      "label": "CI и проверки",
      "short": "CI",
      "stageId": "delivery",
      "prerequisites": [
        "git-workflow",
        "build",
        "e2e"
      ],
      "description": "Повторяемая установка, типы, lint, тесты и сборка при изменении кода.",
      "outcome": "Настроить pipeline, который останавливает выпуск при ошибке.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "deploy",
      "label": "Развёртывание",
      "short": "Deploy",
      "stageId": "delivery",
      "prerequisites": [
        "build",
        "web-basics",
        "security"
      ],
      "description": "Статические файлы, маршруты SPA, окружения, HTTPS и откат версии.",
      "outcome": "Выпустить приложение и проверить прямое открытие вложенной страницы.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "observability",
      "label": "Диагностика в production",
      "short": "Logs",
      "stageId": "delivery",
      "prerequisites": [
        "resilience",
        "performance"
      ],
      "description": "Ошибки пользователя, логи, source maps и измерение проблем после выпуска.",
      "outcome": "Воспроизвести production-ошибку без раскрытия личных данных.",
      "resources": [
        {
          "title": "web.dev — производительность",
          "url": "https://web.dev/learn/performance"
        },
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "delivery",
      "label": "Выпуск функции",
      "short": "Ship",
      "stageId": "delivery",
      "prerequisites": [
        "ci",
        "deploy",
        "observability"
      ],
      "description": "Совместная проверка приложения, мониторинга и возможности отката.",
      "outcome": "Выпустить изменение, проверить его и подготовить план отката.",
      "resources": [
        {
          "title": "Playwright — пользовательские сценарии",
          "url": "https://playwright.dev/docs/writing-tests"
        },
        {
          "title": "web.dev — производительность",
          "url": "https://web.dev/learn/performance"
        }
      ]
    })
  ];
}
