import { Vertex } from '../vertex.ts';
import type { Material } from '../middle-react.ts';

export const backendReferences = {
  http: { title: 'MDN — устройство HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview' },
  openapi: { title: 'OpenAPI — описание контракта HTTP API', url: 'https://spec.openapis.org/oas/latest.html' },
  architecture: { title: 'Martin Fowler — разделение интерфейса, логики и данных', url: 'https://martinfowler.com/bliki/PresentationDomainDataLayering.html' },
  testing: { title: 'The Practical Test Pyramid — уровни автоматических проверок', url: 'https://martinfowler.com/articles/practical-test-pyramid.html' },
  postgres: { title: 'PostgreSQL — SQL и реляционные данные', url: 'https://www.postgresql.org/docs/current/tutorial.html' },
  security: { title: 'OWASP — безопасность REST API', url: 'https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html' },
  redis: { title: 'Redis — руководство разработчика', url: 'https://redis.io/docs/latest/develop/' },
  queues: { title: 'RabbitMQ — практические руководства', url: 'https://www.rabbitmq.com/tutorials' },
  docker: { title: 'Docker — начало работы', url: 'https://docs.docker.com/get-started/' },
  ci: { title: 'GitHub Actions — основы автоматизации', url: 'https://docs.github.com/en/actions/get-started/understand-github-actions' },
  telemetry: { title: 'OpenTelemetry — логи, метрики и трассировки', url: 'https://opentelemetry.io/docs/concepts/observability-primer/' },
  node: { title: 'Node.js — официальное руководство', url: 'https://nodejs.org/learn/getting-started/introduction-to-nodejs' },
  nest: { title: 'NestJS — официальное руководство', url: 'https://docs.nestjs.com/' },
  prisma: { title: 'Prisma — работа с базой данных', url: 'https://www.prisma.io/docs' },
  python: { title: 'Python — официальное руководство', url: 'https://docs.python.org/3/tutorial/' },
  fastapi: { title: 'FastAPI — учебное руководство', url: 'https://fastapi.tiangolo.com/tutorial/' },
  sqlalchemy: { title: 'SQLAlchemy — Unified Tutorial', url: 'https://docs.sqlalchemy.org/en/20/tutorial/' },
  pytest: { title: 'pytest — начало работы', url: 'https://docs.pytest.org/en/stable/getting-started.html' },
  java: { title: 'Dev.java — изучение Java', url: 'https://dev.java/learn/' },
  spring: { title: 'Spring — создание REST-сервиса', url: 'https://spring.io/guides/gs/rest-service/' },
  springData: { title: 'Spring — доступ к данным через JPA', url: 'https://spring.io/guides/gs/accessing-data-jpa/' },
  springTests: { title: 'Spring — тестирование веб-слоя', url: 'https://spring.io/guides/gs/testing-web/' },
} satisfies Record<string, Material>;

export function backendVertex(id: string, label: string, short: string, prerequisites: string[], description: string, outcome: string, resources: Material | Material[], stageId = 'backend'): Vertex {
  return new Vertex({ id, label, short, prerequisites, description, outcome, resources: Array.isArray(resources) ? resources : [resources], stageId });
}

/** Shared server competencies are authored once, independently of a language or framework. */
export function createBackendSharedVertices(): Vertex[] {
  const r = backendReferences;
  return [
    backendVertex('data-structures', 'Структуры данных и сложность', 'DS / O(n)', ['programming'], 'Массивы, списки, словари, множества, очереди и оценка сложности операций.', 'Выбрать структуру данных и объяснить стоимость поиска, вставки и обработки коллекции.', [r.java, r.python]),
    backendVertex('oop-design', 'ООП и принципы проектирования', 'ООП', ['programming'], 'Инкапсуляция, интерфейсы, композиция, разделение ответственности и зависимости модулей.', 'Разделить предметную логику и инфраструктуру, проверить код без реальных внешних сервисов.', [r.java, r.python]),
    backendVertex('linux-server', 'Linux и окружение сервера', 'Linux', ['terminal'], 'Процессы, файловая система, права, переменные окружения, порты и диагностика запущенного сервиса.', 'Настроить окружение и найти причину недоступности процесса или сетевого порта.', r.docker),
    backendVertex('backend-http', 'HTTP на стороне сервера', 'HTTP server', ['http'], 'Обработка запроса, маршруты, заголовки, статусы, JSON, таймауты и жизненный цикл ответа.', 'Реализовать обработчик с корректными статусами и предсказуемой обработкой ошибок.', r.http),
    backendVertex('api-design', 'Проектирование REST API', 'REST / DTO', ['backend-http'], 'Ресурсы, DTO, валидация, пагинация, идемпотентность, совместимость контрактов и OpenAPI.', 'Описать API и реализовать создание, чтение, изменение и удаление данных с единым форматом ошибок.', r.openapi),
    backendVertex('sql', 'SQL и моделирование данных', 'SQL', ['data-structures'], 'Таблицы, связи, ключи, ограничения, JOIN, агрегирование и нормализация.', 'Спроектировать схему и написать запросы для связанных сущностей без потери целостности.', r.postgres, 'backend-data'),
    backendVertex('postgresql', 'PostgreSQL и миграции', 'PostgreSQL', ['sql'], 'Схемы, ограничения, соединения с приложением, миграции и управление изменениями данных.', 'Поднять PostgreSQL и применить проверяемую миграцию к существующей схеме.', r.postgres, 'backend-data'),
    backendVertex('db-transactions', 'Транзакции и индексы', 'ACID / Index', ['postgresql'], 'ACID, уровни изоляции, блокировки, индексы и анализ плана запроса.', 'Защитить согласованность операции и объяснить влияние индекса на запрос.', r.postgres, 'backend-data'),
    backendVertex('backend-auth', 'Аутентификация и права доступа', 'Auth / RBAC', ['api-design'], 'Сессии, токены, хеширование паролей, роли и проверка доступа к конкретному объекту.', 'Ограничить чтение и изменение данных владельцем и проверить отказы в доступе.', r.security),
    backendVertex('backend-security', 'Безопасность серверного API', 'Security', ['backend-auth'], 'Проверка входных данных, инъекции, секреты, HTTPS, ограничения запросов и безопасные ошибки.', 'Проверить основные угрозы API и исключить выдачу чужих данных и служебных секретов.', r.security),
    backendVertex('redis', 'Redis и кеширование', 'Redis', ['api-design', 'postgresql'], 'Ключи, TTL, кеширование чтения, инвалидация, ограничения и согласованность с основной базой.', 'Добавить кеш с понятным сроком жизни и корректным обновлением после изменения данных.', r.redis, 'backend-data'),
    backendVertex('message-queues', 'Очереди и фоновые задачи', 'Queue / Jobs', ['api-design'], 'Сообщения, обработчики, повторы, подтверждение обработки и идемпотентные операции.', 'Вынести длительную операцию в фоновую задачу и обработать повторную доставку сообщения.', r.queues),
    backendVertex('backend-architecture', 'Архитектура серверного приложения', 'Layers / DI', ['oop-design', 'api-design', 'db-transactions'], 'Границы модулей, слои, внедрение зависимостей, транзакционные границы и внешние интеграции.', 'Выделить бизнес-логику и слой хранения, обосновать границы модулей и ответственности.', r.architecture),
    backendVertex('backend-testing', 'Тестирование серверного API', 'API tests', ['api-design', 'db-transactions'], 'Модульные, интеграционные и контрактные проверки, фикстуры, изоляция и тестовые данные.', 'Проверить успешный сценарий, ошибки, права доступа и откат транзакции через API.', r.testing),
    backendVertex('docker', 'Docker и контейнеризация', 'Docker', ['linux-server'], 'Образ, контейнер, сеть, тома, переменные окружения и запуск приложения вместе с базой.', 'Воспроизводимо запустить сервис и PostgreSQL в отдельных контейнерах.', r.docker),
    backendVertex('backend-ci', 'CI для серверного проекта', 'CI', ['git-workflow', 'docker', 'backend-testing'], 'Автоматическая проверка типов, тестов, миграций и сборки образа перед выпуском.', 'Настроить pipeline, который отклоняет неисправную сборку и публикует проверенный образ.', r.ci, 'delivery'),
    backendVertex('backend-deploy', 'Развёртывание и выпуск API', 'Deploy', ['backend-ci', 'backend-security'], 'Конфигурация окружений, reverse proxy, HTTPS, health checks, миграции и откат версии.', 'Развернуть сервис с проверкой готовности и подготовить безопасный план отката.', r.docker, 'delivery'),
    backendVertex('backend-observability', 'Наблюдаемость сервера', 'Logs / Metrics', ['backend-deploy'], 'Структурированные логи, метрики, трассировки, идентификатор запроса и оповещения.', 'По сигналам наблюдаемости найти источник ошибки или задержки запроса.', r.telemetry, 'delivery'),
    backendVertex('backend-performance', 'Нагрузка и производительность', 'Load / Profile', ['db-transactions', 'redis'], 'Измерение задержек, профилирование, нагрузочные сценарии, узкие места базы и приложения.', 'Измерить время ответа под нагрузкой и обосновать улучшение по результатам замеров.', r.telemetry),
    backendVertex('backend-teamwork', 'Командная разработка API', 'Team / Review', ['git-workflow', 'api-design'], 'Review, небольшие изменения, описание контракта, согласование миграций и совместимость клиентов.', 'Подготовить изменение сервиса с тестами, описанием API и понятным планом выпуска.', r.ci, 'delivery'),
  ];
}
