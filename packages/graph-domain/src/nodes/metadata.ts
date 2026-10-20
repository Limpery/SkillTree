import type { CurriculumStage } from '../middle-react.ts';
import type { Role } from '../index.ts';
import type { VertexGroup } from '../vertex.ts';

export const stages: CurriculumStage[] = [
  {
    "id": "foundation",
    "title": "Основы и рабочая среда",
    "short": "База"
  },
  {
    "id": "web",
    "title": "Интерфейс и браузер",
    "short": "Веб"
  },
  {
    "id": "language",
    "title": "JavaScript и TypeScript",
    "short": "JS / TS"
  },
  {
    "id": "network",
    "title": "Сеть, API и безопасность",
    "short": "API"
  },
  {
    "id": "react",
    "title": "Фреймворки и компоненты",
    "short": "Фреймворки"
  },
  {
    "id": "application",
    "title": "Разработка приложения",
    "short": "Приложение"
  },
  {
    "id": "quality",
    "title": "Качество и тестирование",
    "short": "Качество"
  },
  {
    "id": "delivery",
    "title": "Работа в команде и выпуск",
    "short": "Выпуск"
  },
  {
    "id": "practice",
    "title": "Самостоятельная работа Middle",
    "short": "Практика"
  }
];
export const roles: Role[] = [
  {
    "id": "role:middle-react",
    "groupId": "practice",
    "aliases": [
      "react",
      "middle react",
      "мидл реакт",
      "react разработчик",
      "frontend react"
    ],
    "requirements": [
      {
        "id": "middle:all",
        "mode": "all",
        "topics": [
          "middle-project"
        ]
      }
    ]
  },
  {
    "id": "role:middle-vue",
    "groupId": "practice",
    "aliases": [
      "vue",
      "vue разработчик",
      "middle vue",
      "мидл вью",
      "vue.js"
    ],
    "requirements": [
      {
        "id": "middle-vue:all",
        "mode": "all",
        "topics": [
          "vue-project"
        ]
      }
    ]
  }
];
export const vertexGroups: VertexGroup[] = [
  {
    "id": "group:environment",
    "label": "Рабочая среда",
    "short": ">_ / Git",
    "members": [
      "git",
      "terminal"
    ]
  },
  {
    "id": "group:css",
    "label": "CSS и адаптивная вёрстка",
    "short": "CSS",
    "members": [
      "css",
      "css-layout",
      "responsive"
    ]
  },
  {
    "id": "group:javascript",
    "label": "JavaScript и DOM",
    "short": "JS / DOM",
    "members": [
      "javascript",
      "dom"
    ]
  },
  {
    "id": "group:typescript",
    "label": "TypeScript",
    "short": "TS",
    "members": [
      "typescript",
      "typescript-deep"
    ]
  },
  {
    "id": "group:react",
    "label": "React и компоненты",
    "short": "React",
    "members": [
      "react",
      "react-state",
      "react-effects",
      "react-types",
      "composition"
    ]
  },
  {
    "id": "group:vue",
    "label": "Vue и компоненты",
    "short": "Vue",
    "members": [
      "vue",
      "vue-reactivity",
      "vue-effects",
      "vue-types",
      "vue-composition"
    ]
  },
  {
    "id": "group:testing",
    "label": "Тестирование интерфейса",
    "short": "Tests",
    "members": [
      "unit-tests",
      "component-tests",
      "e2e"
    ]
  }
];
