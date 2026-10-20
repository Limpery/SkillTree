import { Vertex } from '../vertex.ts';

export function createLanguageVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "javascript",
      "label": "JavaScript",
      "short": "JS",
      "stageId": "language",
      "prerequisites": [
        "programming"
      ],
      "description": "Функции, объекты, массивы, преобразования типов и обработка ошибок.",
      "outcome": "Написать преобразование данных без лишних мутаций.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ],
      "groupingId": "group:javascript"
    }),
    new Vertex({
      "id": "modules",
      "label": "Модули и npm",
      "short": "npm",
      "stageId": "language",
      "prerequisites": [
        "javascript",
        "terminal"
      ],
      "description": "ES-модули, Node.js для инструментов, зависимости, lock-файл и npm-скрипты.",
      "outcome": "Воспроизвести установку и отделить зависимости приложения от инструментов.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "js-deep",
      "label": "JavaScript глубже",
      "short": "JS+",
      "stageId": "language",
      "prerequisites": [
        "javascript"
      ],
      "description": "Области видимости, замыкания, this, прототипы, коллекции и стоимость операций.",
      "outcome": "Объяснить поведение кода и выбрать подходящую структуру данных.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "async",
      "label": "Асинхронность",
      "short": "async",
      "stageId": "language",
      "prerequisites": [
        "javascript"
      ],
      "description": "Event loop, Promise, async/await, параллельные операции и ошибки.",
      "outcome": "Согласовать несколько операций и обработать отказ одной из них.",
      "resources": [
        {
          "title": "MDN — основы веб-разработки",
          "url": "https://developer.mozilla.org/en-US/curriculum/core/"
        }
      ]
    }),
    new Vertex({
      "id": "typescript",
      "label": "TypeScript",
      "short": "TS",
      "stageId": "language",
      "prerequisites": [
        "javascript"
      ],
      "description": "Типы, интерфейсы, объединения, narrowing и строгая проверка.",
      "outcome": "Описать данные без подмены неизвестных значений типом any.",
      "resources": [
        {
          "title": "TypeScript Handbook",
          "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
        }
      ],
      "groupingId": "group:typescript"
    }),
    new Vertex({
      "id": "typescript-deep",
      "label": "Типизация сложных данных",
      "short": "TS+",
      "stageId": "language",
      "prerequisites": [
        "typescript"
      ],
      "description": "Generics, utility types, discriminated unions и границы типобезопасности.",
      "outcome": "Спроектировать типы состояний и переиспользуемого интерфейса.",
      "resources": [
        {
          "title": "TypeScript Handbook",
          "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
        }
      ],
      "groupingId": "group:typescript"
    })
  ];
}
