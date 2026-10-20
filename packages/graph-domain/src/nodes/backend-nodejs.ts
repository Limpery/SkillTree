import { backendReferences as r, backendVertex as v } from './backend-shared.ts';

export function createNodejsVertices() {
  return [
    v('nodejs', 'Основы Node.js', 'Node.js', ['modules', 'async'], 'Среда выполнения JavaScript на сервере, модули, npm, конфигурация и обработка ошибок.', 'Создать и запустить серверный процесс с конфигурацией и корректным завершением работы.', r.node),
    v('nodejs-io', 'Файлы и потоки Node.js', 'FS / Streams', ['nodejs'], 'Файловый ввод-вывод, потоки, буферы и обработка ошибок при передаче данных.', 'Обработать большой файл потоком без загрузки всего содержимого в память.', r.node),
    v('nodejs-event-loop', 'Event Loop и конкурентность', 'Event Loop', ['nodejs', 'async'], 'Очереди выполнения, неблокирующий ввод-вывод, CPU-bound задачи и ограничения одного процесса.', 'Найти блокировку Event Loop и отделить тяжёлое вычисление от обработки запросов.', r.node),
    v('nestjs', 'NestJS и модули сервера', 'NestJS', ['nodejs', 'typescript-deep', 'oop-design', 'backend-http'], 'Модули, контроллеры, сервисы и внедрение зависимостей в приложении NestJS.', 'Создать модуль с контроллером, сервисом и заменяемым хранилищем данных.', r.nest),
    v('nestjs-validation', 'Валидация и ошибки NestJS', 'Pipes / DTO', ['nestjs', 'api-design'], 'DTO, pipes, guards, фильтры исключений и документирование входных и выходных данных.', 'Проверить входные данные и вернуть единообразные ошибки без раскрытия внутренних деталей.', r.nest),
    v('prisma', 'Prisma и слой хранения', 'Prisma', ['nestjs', 'postgresql'], 'Модель данных, миграции, клиент Prisma, запросы, транзакции и границы репозитория.', 'Реализовать слой хранения с миграциями и атомарным изменением связанных записей.', r.prisma, 'backend-data'),
    v('nodejs-testing', 'Тесты приложения NestJS', 'Nest tests', ['prisma', 'nestjs-validation', 'backend-testing', 'unit-tests'], 'Изолированные проверки сервисов и интеграционные тесты HTTP и PostgreSQL.', 'Проверить API, доступ владельца, ошибки валидации и работу транзакции с тестовой базой.', r.nest, 'quality'),
    v('nodejs-project', 'Проект серверного API на Node.js', 'Node API', ['nodejs-io', 'nodejs-event-loop', 'nodejs-testing', 'backend-architecture', 'backend-observability', 'backend-performance', 'message-queues', 'backend-teamwork', 'backend-security'], 'Сервис задач на NestJS: пользователи и роли, PostgreSQL через Prisma, Redis, фоновая очередь, тесты, контейнеры и наблюдаемость.', 'Самостоятельно выпустить серверный проект с документацией API, проверкой доступа, тестами и воспроизводимым запуском.', [r.nest, r.prisma, r.docker], 'practice'),
    v('role:middle-nodejs', 'Middle Node.js-разработчик', 'Middle Node.js', ['nodejs-project'], 'Учебный профиль серверной разработки на Node.js, TypeScript и NestJS. Требования объединяются в практическом API-проекте.', 'Реализовать и сопровождать серверную функцию, объяснить устройство данных, обработку ошибок и выпуск.', r.node, 'practice'),
  ];
}
