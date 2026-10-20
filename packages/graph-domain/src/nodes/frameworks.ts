import { Vertex } from '../vertex.ts';

export function createFrameworksVertices(): Vertex[] {
  return [
    new Vertex({
      "id": "react",
      "label": "Основы React",
      "short": "React",
      "stageId": "react",
      "prerequisites": [
        "html",
        "css",
        "javascript"
      ],
      "description": "JSX, компоненты, props, события, списки и правила рендеринга.",
      "outcome": "Разбить интерфейс на компоненты с понятными входными данными.",
      "resources": [
        {
          "title": "React — официальное руководство",
          "url": "https://react.dev/learn"
        }
      ],
      "groupingId": "group:react"
    }),
    new Vertex({
      "id": "react-state",
      "label": "Состояние и Hooks",
      "short": "Hooks",
      "stageId": "react",
      "prerequisites": [
        "react",
        "js-deep"
      ],
      "description": "useState, useReducer, обновления состояния и неизменяемые данные.",
      "outcome": "Смоделировать переходы интерфейса без дублирующего состояния.",
      "resources": [
        {
          "title": "React — управление состоянием",
          "url": "https://react.dev/learn/managing-state"
        }
      ],
      "groupingId": "group:react"
    }),
    new Vertex({
      "id": "react-effects",
      "label": "Эффекты и refs",
      "short": "Effects",
      "stageId": "react",
      "prerequisites": [
        "react-state",
        "async"
      ],
      "description": "Синхронизация с внешней системой, зависимости эффекта, cleanup и refs.",
      "outcome": "Удалить лишний эффект и корректно очистить подписку.",
      "resources": [
        {
          "title": "React — эффекты и внешние системы",
          "url": "https://react.dev/learn/escape-hatches"
        }
      ],
      "groupingId": "group:react"
    }),
    new Vertex({
      "id": "react-types",
      "label": "React с TypeScript",
      "short": "TSX",
      "stageId": "react",
      "prerequisites": [
        "react",
        "typescript"
      ],
      "description": "Типы props, событий, children, hooks и состояний компонента.",
      "outcome": "Создать типизированный компонент и обработчик без небезопасных приведений.",
      "resources": [
        {
          "title": "React — официальное руководство",
          "url": "https://react.dev/learn"
        },
        {
          "title": "TypeScript Handbook",
          "url": "https://www.typescriptlang.org/docs/handbook/intro.html"
        }
      ],
      "groupingId": "group:react"
    }),
    new Vertex({
      "id": "composition",
      "label": "Композиция компонентов",
      "short": "Parts",
      "stageId": "react",
      "prerequisites": [
        "react-state",
        "react-types"
      ],
      "description": "Композиция, управляемые компоненты, custom hooks и ответственность компонентов.",
      "outcome": "Вынести общую логику, сохранив ясный интерфейс компонентов.",
      "resources": [
        {
          "title": "React — официальное руководство",
          "url": "https://react.dev/learn"
        },
        {
          "title": "React — управление состоянием",
          "url": "https://react.dev/learn/managing-state"
        }
      ],
      "groupingId": "group:react"
    }),
    new Vertex({
      "id": "vue",
      "label": "Основы Vue",
      "short": "Vue",
      "stageId": "react",
      "prerequisites": [
        "html",
        "css",
        "javascript"
      ],
      "description": "Vue 3, Single-File Components, шаблоны, директивы, props и события. Начинается от той же веб-базы, что и React.",
      "outcome": "Разбить интерфейс на Vue-компоненты и передать данные и события между ними.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        }
      ],
      "groupingId": "group:vue"
    }),
    new Vertex({
      "id": "vue-reactivity",
      "label": "Реактивность Vue",
      "short": "ref",
      "stageId": "react",
      "prerequisites": [
        "vue",
        "js-deep"
      ],
      "description": "ref, reactive, computed и правила отслеживания зависимостей. Отличие вычисляемого значения от побочного эффекта.",
      "outcome": "Смоделировать реактивное состояние без потери реактивности и дублирующих вычислений.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        }
      ],
      "groupingId": "group:vue"
    }),
    new Vertex({
      "id": "vue-effects",
      "label": "Жизненный цикл Vue",
      "short": "watch",
      "stageId": "react",
      "prerequisites": [
        "vue-reactivity",
        "async"
      ],
      "description": "Lifecycle hooks, watch, watchEffect, template refs, очистка подписок и отмена устаревших операций.",
      "outcome": "Синхронизировать компонент с внешней системой и очистить созданные ресурсы.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        }
      ],
      "groupingId": "group:vue"
    }),
    new Vertex({
      "id": "vue-types",
      "label": "Vue с TypeScript",
      "short": "Vue TS",
      "stageId": "react",
      "prerequisites": [
        "vue",
        "typescript"
      ],
      "description": "script setup, типизация props, emits, refs и событий. Безопасные границы компонентов и данных.",
      "outcome": "Создать компонент с типизированными входами и событиями без небезопасных приведений.",
      "resources": [
        {
          "title": "Vue — TypeScript и Composition API",
          "url": "https://vuejs.org/guide/typescript/composition-api.html"
        }
      ],
      "groupingId": "group:vue"
    }),
    new Vertex({
      "id": "vue-composition",
      "label": "Композиция Vue",
      "short": "Parts V",
      "stageId": "react",
      "prerequisites": [
        "vue-reactivity",
        "vue-types"
      ],
      "description": "Composition API, composables, slots и provide/inject. Выделение повторяемой логики и ответственности компонентов.",
      "outcome": "Вынести логику в composable и построить компонент с ясным контрактом.",
      "resources": [
        {
          "title": "Vue — официальное руководство",
          "url": "https://vuejs.org/guide/introduction.html"
        }
      ],
      "groupingId": "group:vue"
    })
  ];
}
