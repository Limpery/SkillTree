# Пять учебных профилей

20 октября 2026 года. Обзор содержит начало и пять профессий. Одновременно раскрывается одна траектория; остальные профессии остаются доступными для переключения. Внешняя интеграция с рынком вакансий пока не подключена.

| Профессия | Тем | Учебных блоков | Кругов с навигацией | Линий | Основной стек проекта |
| --- | ---: | ---: | ---: | ---: | --- |
| Middle React | 51 | 21 | 27 | 33 | React, TypeScript, API, формы и состояние |
| Middle Vue | 52 | 21 | 27 | 33 | Vue, TypeScript, Router и Pinia |
| Middle Node.js | 40 | 21 | 27 | 34 | Node.js, TypeScript, NestJS и Prisma |
| Middle Python | 35 | 20 | 26 | 30 | Python, FastAPI, Pydantic и SQLAlchemy |
| Middle Java | 37 | 20 | 26 | 31 | Java, Spring Boot, Spring Web и JPA |

У трёх серверных профилей общая база: Git и Linux, структуры данных и ООП, HTTP и контракт API, SQL/PostgreSQL, транзакции, авторизация и безопасность, Redis, очереди, архитектура, тестирование, Docker, CI, выпуск и наблюдаемость. У каждой темы один ID и одна запись. JS/TS входят в Node.js и соответствующие фронтенд-пути; Python и Java не требуют JavaScript, HTML/CSS, DOM, React или Vue.

Итоговые проекты различаются: API задач на NestJS, API бронирования на FastAPI и API заказов на Spring Boot. Статус практической темы определяется её содержанием в разделе практики, а не списком двух известных ID. Общий каталог содержит 113 записей: 108 компетенций/проектов и пять профессий.

## Данные и сборка

- `nodes/backend-shared.ts` — общие серверные компетенции и ссылки на материалы.
- `nodes/backend-nodejs.ts`, `nodes/backend-python.ts`, `nodes/backend-java.ts` — отдельные языки, среды выполнения, фреймворки, тесты и проекты.
- `skill-catalog.ts` — пять профессий и сборка единого каталога с проверкой зависимостей.
- `backend-curriculum.ts` — серверные учебные блоки и предпочтительный порядок отображения. Настоящие зависимости сохраняются отдельно.
- `career-scene.ts` — общий алгоритм размещения, прямых линий и плавания для всех профессий.

Исходный `createFrontendCatalog()` оставлен для исторических раскладок и проверок двух фронтенд-профессий. Клиент использует `createSkillCatalog()`. При сборке полных данных исходные неизменяемые вершины пересоздаются перед установлением связей; ID и содержание общих тем сохраняются.

## Материалы

Ссылки добавлены по первичным источникам: [Node.js](https://nodejs.org/learn/getting-started/introduction-to-nodejs), [NestJS](https://docs.nestjs.com/), [Prisma](https://www.prisma.io/docs), [Python](https://docs.python.org/3/tutorial/), [FastAPI](https://fastapi.tiangolo.com/tutorial/), [SQLAlchemy](https://docs.sqlalchemy.org/en/20/tutorial/), [pytest](https://docs.pytest.org/en/stable/getting-started.html), [Dev.java](https://dev.java/learn/), [Spring REST](https://spring.io/guides/gs/rest-service/), [Spring Data JPA](https://spring.io/guides/gs/accessing-data-jpa/) и [Spring Testing](https://spring.io/guides/gs/testing-web/).

Общая часть ссылается на [MDN HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview), [OpenAPI](https://spec.openapis.org/oas/latest.html), [PostgreSQL](https://www.postgresql.org/docs/current/tutorial.html), [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [Redis](https://redis.io/docs/latest/develop/), [RabbitMQ](https://www.rabbitmq.com/tutorials), [Docker](https://docs.docker.com/get-started/), [GitHub Actions](https://docs.github.com/en/actions/get-started/understand-github-actions), [OpenTelemetry](https://opentelemetry.io/docs/concepts/observability-primer/), [описание слоёв Martin Fowler](https://martinfowler.com/bliki/PresentationDomainDataLayering.html) и [The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html). Это подготовленные учебные профили, не единый отраслевой стандарт Middle.

## Проверки

Восемь проверок полного каталога добавлены к прежним 46. Подтверждены уникальность и использование тем, сохранность исходных фронтенд-данных, независимость языков, общие ID, отсутствие потерь во вкладках и тупиков до проекта. Для обзора и всех пяти путей проверены круги, прямые связи и их геометрия на выборках двух минут плавания с шагом пять секунд.

Ручные проверки интерфейса и снимки — в [отчёте](LAYOUT_VALIDATION.md).
