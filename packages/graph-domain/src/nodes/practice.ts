import { Vertex } from '../vertex.ts';

export function createPracticeVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "middle-project",
      "label": "Проект на React",
      "short": "React app",
      "stageId": "practice",
      "prerequisites": [
        "architecture",
        "design-system",
        "global-state",
        "forms",
        "delivery",
        "ssr",
        "teamwork",
        "server-state",
        "react-effects",
        "router"
      ],
      "description": "React-приложение с ролями, маршрутизацией, API, формами и общим состоянием. Проверяются компоненты, пользовательские сценарии, производительность и выпуск.",
      "outcome": "Самостоятельно спроектировать и выпустить функцию, объяснить решения, обработать сбои и принять review.",
      "resources": [
        {
          "title": "React — официальное руководство",
          "url": "https://react.dev/learn"
        },
        {
          "title": "Playwright — пользовательские сценарии",
          "url": "https://playwright.dev/docs/writing-tests"
        },
        {
          "title": "web.dev — производительность",
          "url": "https://web.dev/learn/performance"
        }
      ]
    }),
    new Vertex({
      "id": "vue-project",
      "label": "Проект на Vue",
      "short": "Vue app",
      "stageId": "practice",
      "prerequisites": [
        "architecture",
        "design-system",
        "vue-pinia",
        "forms",
        "delivery",
        "ssr",
        "teamwork",
        "server-state",
        "vue-effects",
        "vue-router",
        "vue-testing"
      ],
      "description": "Vue-приложение с ролями, маршрутизацией, API, формами и Pinia. Исходники, тесты и развёрнутая версия подтверждают применение общих и специальных знаний.",
      "outcome": "Самостоятельно реализовать и выпустить функцию на Vue, объяснить решения и принять review.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        },
        {
          "title": "Vue — тестирование",
          "url": "https://vuejs.org/guide/scaling-up/testing.html"
        }
      ]
    }),
    new Vertex({
      "id": "role:middle-react",
      "label": "Middle React-разработчик",
      "short": "Middle",
      "stageId": "practice",
      "prerequisites": [
        "middle-project"
      ],
      "description": "Целевой профиль: самостоятельная разработка и сопровождение React-приложения, работа с API и командным процессом. Темы объединяются в практическом результате.",
      "outcome": "Взять функцию в работу, реализовать, протестировать, выпустить и сопровождать её с обоснованием решений.",
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
      "id": "role:middle-vue",
      "label": "Middle Vue-разработчик",
      "short": "Middle Vue",
      "stageId": "practice",
      "prerequisites": [
        "vue-project"
      ],
      "description": "Самостоятельная разработка и сопровождение Vue-приложений, интеграция API, качество и командный выпуск. React не входит в требования этой профессии.",
      "outcome": "Взять функцию в работу, реализовать на Vue, проверить, выпустить и сопровождать её.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        },
        {
          "title": "Vue — управление состоянием и Pinia",
          "url": "https://vuejs.org/guide/scaling-up/state-management.html"
        }
      ]
    })
  ];
}
