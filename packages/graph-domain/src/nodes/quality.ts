import { Vertex } from '../vertex.ts';

export function createQualityVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "debugging",
      "label": "DevTools и отладка",
      "short": "Debug",
      "stageId": "quality",
      "prerequisites": [
        "dom",
        "http"
      ],
      "description": "Точки останова, стек вызовов, сеть, DOM и воспроизведение ошибки.",
      "outcome": "Найти причину ошибки по наблюдениям и минимальному примеру.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "unit-tests",
      "label": "Модульные тесты",
      "short": "Unit",
      "stageId": "quality",
      "prerequisites": [
        "javascript",
        "modules"
      ],
      "description": "Проверка логики, граничных случаев и асинхронных функций, например в Vitest.",
      "outcome": "Написать тест на поведение, который обнаруживает реальную ошибку.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:testing"
    }),
    new Vertex({
      "id": "component-tests",
      "label": "Тесты компонентов",
      "short": "RTL",
      "stageId": "quality",
      "prerequisites": [
        "unit-tests",
        "dom",
        "typescript"
      ],
      "description": "Проверка интерфейса через роли, действия пользователя и асинхронные состояния. Общие приёмы; инструменты фреймворка применяются в проекте.",
      "outcome": "Проверить форму и ошибку загрузки без привязки к внутреннему state.",
      "resources": [
        {
          "title": "Playwright — пользовательские сценарии",
          "url": "https://playwright.dev/docs/writing-tests"
        }
      ],
      "groupingId": "group:testing"
    }),
    new Vertex({
      "id": "e2e",
      "label": "Пользовательские сценарии",
      "short": "E2E",
      "stageId": "quality",
      "prerequisites": [
        "component-tests",
        "auth",
        "forms",
        "server-state"
      ],
      "description": "Playwright, изоляция данных, устойчивые локаторы и критические сценарии.",
      "outcome": "Проверить вход, изменение данных и восстановление после ошибки.",
      "resources": [
        {
          "title": "Playwright — пользовательские сценарии",
          "url": "https://playwright.dev/docs/writing-tests"
        }
      ],
      "groupingId": "group:testing"
    }),
    new Vertex({
      "id": "performance",
      "label": "Производительность",
      "short": "Perf",
      "stageId": "quality",
      "prerequisites": [
        "css-layout",
        "js-deep",
        "debugging"
      ],
      "description": "Профилирование, загрузка ресурсов, разделение кода и стоимость обновления интерфейса. Общие измерения дополняются профилированием своего фреймворка.",
      "outcome": "Измерить проблему до исправления и подтвердить результат после.",
      "resources": [
        {
          "title": "web.dev — производительность",
          "url": "https://web.dev/learn/performance"
        }
      ]
    }),
    new Vertex({
      "id": "resilience",
      "label": "Устойчивость интерфейса",
      "short": "Errors",
      "stageId": "quality",
      "prerequisites": [
        "server-state",
        "debugging"
      ],
      "description": "Границы ошибок, retry, недоступность сети, пустые данные и гонки запросов.",
      "outcome": "Сохранить управляемое состояние приложения при сбое внешнего сервиса.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "vue-testing",
      "label": "Тесты Vue-компонентов",
      "short": "Test V",
      "stageId": "quality",
      "prerequisites": [
        "vue-types",
        "component-tests"
      ],
      "description": "Применение Vue Test Utils и пользовательских проверок к props, событиям, composables и состояниям загрузки.",
      "outcome": "Проверить поведение Vue-компонента при действии пользователя и ошибке API.",
      "resources": [
        {
          "title": "Vue — тестирование",
          "url": "https://vuejs.org/guide/scaling-up/testing.html"
        }
      ]
    })
  ];
}
