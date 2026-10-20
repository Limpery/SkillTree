import { validateCatalog, type Catalog, type Role, type Topic, type TopicGroup } from './index.ts';
import { arrangeCatalog } from './layout.ts';

const group = (id: string, label: string, short: string, x: number, y: number, kind: TopicGroup['kind'] = 'direction'): TopicGroup =>
  ({ id, label, short, position: { x, y }, kind, description: kind === 'foundation' ? 'Общие навыки. Обязательность задаётся требованиями профессии.' : kind === 'shared' ? 'Одна технология может использоваться в нескольких направлениях.' : 'Технологии одного направления разработки.' });

export function createCatalog(targetCount?: number): Catalog {
  const groups: TopicGroup[] = [
    group('foundation', 'База разработчика', 'База', 0, 0, 'foundation'),
    group('javascript', 'JavaScript и TypeScript', 'JS', 0, -260, 'shared'),
    group('protocols', 'Веб и инструменты', 'HTTP', 245, -25, 'shared'),
    group('data', 'Работа с данными', 'SQL', 45, 260, 'shared'),
    group('web', 'Основы интерфейса', 'Web', -160, -490),
    group('react', 'React-экосистема', 'React', 145, -490),
    group('node', 'Node.js backend', 'Node', 390, -330),
    group('jvm', 'Java и Kotlin', 'JVM', 510, 0),
    group('spring', 'Spring-экосистема', 'Spring', 650, 200),
    group('python', 'Python backend', 'Python', 340, 420),
    group('go', 'Go backend', 'Go', -35, 530),
    group('android', 'Android', 'Android', -390, 360),
    group('ios', 'iOS', 'iOS', -510, -10),
    group('flutter', 'Flutter', 'Flutter', -390, -330)
  ];
  const topics: Topic[] = [];
  function topic(id: string, label: string, short: string, groupId: string, prerequisites: string[] = [], description = '') {
    topics.push({ id, label, short, groupId, prerequisites, kind: groupId === 'foundation' ? 'foundation' : 'technology', position: { x: 0, y: 0 },
      description: description || label + ' — часть выбранной образовательной траектории. Конкретные результаты освоения и материалы будут уточняться в карточке технологии.' });
  }
  topic('programming', 'Основы программирования', '</>', 'foundation', [], 'Типы данных, условия, циклы, функции и разбор задачи на шаги. Это общая база, которую можно изучать параллельно с первым языком.');
  topic('git', 'Git', 'Git', 'foundation', [], 'История изменений, ветки, слияния и работа с удалённым репозиторием. Прогресс один для всех направлений.');
  topic('terminal', 'Терминал', '>_', 'foundation');
  topic('debugging', 'Отладка', 'Bug', 'foundation', ['programming']);
  topic('javascript', 'JavaScript', 'JS', 'javascript', ['programming'], 'Общая технология для frontend и Node.js backend. Вершина одна, даже когда её требуют разные профессии.');
  topic('typescript', 'TypeScript', 'TS', 'javascript', ['javascript']);
  topic('async', 'Асинхронность JavaScript', 'async', 'javascript', ['javascript']);
  topic('http', 'HTTP', 'HTTP', 'protocols');
  topic('rest', 'REST API', 'API', 'protocols', ['http']);
  topic('docker', 'Docker', 'Docker', 'protocols', ['terminal']);
  topic('testing', 'Автоматизированные тесты', 'Test', 'protocols', ['programming']);
  topic('sql', 'SQL', 'SQL', 'data');
  topic('postgres', 'PostgreSQL', 'PG', 'data', ['sql']);
  topic('mysql', 'MySQL', 'MySQL', 'data', ['sql']);
  topic('redis', 'Redis', 'Redis', 'data');
  topic('html', 'HTML', 'HTML', 'web'); topic('css', 'CSS', 'CSS', 'web', ['html']);
  topic('a11y', 'Доступность интерфейса', 'A11y', 'web', ['html']);
  topic('react', 'React', 'React', 'react', ['javascript', 'html', 'css']);
  topic('router', 'Маршрутизация React', 'Router', 'react', ['react']);
  topic('state', 'Состояние интерфейса', 'State', 'react', ['react']);
  topic('node', 'Node.js', 'Node', 'node', ['javascript', 'async', 'http']);
  topic('nestjs', 'NestJS', 'Nest', 'node', ['node', 'typescript', 'rest']);
  topic('express', 'Express', 'Express', 'node', ['node']);
  topic('java', 'Java', 'Java', 'jvm', ['programming']);
  topic('kotlin', 'Kotlin', 'Kotlin', 'jvm', ['programming']);
  topic('jvm', 'Java Virtual Machine', 'JVM', 'jvm');
  topic('spring', 'Spring Boot', 'Spring', 'spring', ['java', 'rest']);
  topic('spring-data', 'Spring Data', 'Data', 'spring', ['spring', 'sql']);
  topic('python', 'Python', 'Py', 'python', ['programming']);
  topic('fastapi', 'FastAPI', 'FastAPI', 'python', ['python', 'rest']);
  topic('django', 'Django', 'Django', 'python', ['python']);
  topic('go', 'Go', 'Go', 'go', ['programming']);
  topic('go-http', 'HTTP-сервисы на Go', 'net/http', 'go', ['go', 'http']);
  topic('android', 'Android SDK', 'SDK', 'android', ['kotlin']);
  topic('compose', 'Jetpack Compose', 'Compose', 'android', ['android']);
  topic('swift', 'Swift', 'Swift', 'ios', ['programming']);
  topic('swiftui', 'SwiftUI', 'SwiftUI', 'ios', ['swift']);
  topic('dart', 'Dart', 'Dart', 'flutter', ['programming']);
  topic('flutter', 'Flutter', 'Flutter', 'flutter', ['dart']);
  const shared = ['programming', 'git', 'debugging'];
  const roles: Role[] = [];
  function role(id: string, label: string, short: string, groupId: string, required: string[], aliases: string[], database = false, learningOrder?: string[], core = shared) {
    topics.push({ id, label, short, kind: 'role', prerequisites: [], description: 'Демонстрационная траектория. Требования в прототипе иллюстрируют связи, а не гарантируют трудоустройство.', position: { x: 0, y: 0 } });
    const requirements: Role['requirements'] = [{ id: id + ':core', mode: 'all', topics: core }, { id: id + ':profile', mode: 'all', topics: required }];
    if (database) requirements.splice(1, 0, { id: id + ':database', mode: 'one', topics: ['postgres', 'mysql'] });
    roles.push({ id, groupId, aliases, requirements, learningOrder });
  }
  const reactOrder = ['git', 'http', 'html', 'css', 'javascript', 'typescript', 'react'];
  role('role:frontend', 'Frontend-разработчик', 'FE', 'react', ['typescript', 'react', 'router', 'a11y', 'http', 'testing'], ['frontend', 'фронтенд'], false, reactOrder);
  role('role:react', 'React-разработчик', 'React', 'react', reactOrder, ['react', 'реакт', 'react разработчик', 'react developer'], false, reactOrder, []);
  role('role:node', 'Node.js-разработчик', 'Node', 'node', ['terminal', 'nestjs', 'testing'], ['node', 'nodejs', 'node.js', 'javascript backend'], true);
  role('role:java', 'Java-разработчик', 'Java', 'spring', ['terminal', 'spring-data', 'testing'], ['java', 'java инженер', 'java developer'], true);
  role('role:python', 'Python-разработчик', 'Py', 'python', ['terminal', 'fastapi', 'testing'], ['python', 'питон', 'python backend'], true);
  role('role:go', 'Go-разработчик', 'Go', 'go', ['terminal', 'go-http', 'testing'], ['golang', 'go backend'], true);
  role('role:android', 'Android-разработчик', 'Android', 'android', ['compose', 'http', 'testing'], ['android', 'kotlin', 'андроид']);
  role('role:ios', 'iOS-разработчик', 'iOS', 'ios', ['swiftui', 'http', 'testing'], ['ios', 'swift', 'айос']);
  role('role:flutter', 'Flutter-разработчик', 'Flutter', 'flutter', ['flutter', 'http', 'testing'], ['flutter', 'dart', 'флаттер']);
  if (targetCount) {
    const needed = Math.max(0, targetCount - topics.length);
    const fillGroups = groups.filter(item => item.kind !== 'foundation');
    for (let index = 0; index < needed; index++) {
      const parent = fillGroups[index % fillGroups.length];
      const base = topics.find(item => item.groupId === parent.id && !item.synthetic)!;
      topic('sample:' + index, 'Учебная тема ' + (index + 1), String(index + 1), parent.id, [base.id]);
      topics.at(-1)!.synthetic = true;
    }
  }
  const relations: Catalog['relations'] = [];
  for (const item of topics) for (const source of item.prerequisites) relations.push({ id: source + '>' + item.id, source, target: item.id, kind: 'prerequisite' });
  for (const item of roles) for (const requirement of item.requirements) for (const source of requirement.topics)
    relations.push({ id: source + '>' + item.id, source, target: item.id, kind: 'requirement' });
  const catalog = { topics, groups, roles, relations };
  arrangeCatalog(catalog);
  validateCatalog(catalog);
  return catalog;
}
