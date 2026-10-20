import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog } from '../src/catalog.ts';
import { planForRole, projectCatalog, relatedRoles, validateCatalog } from '../src/index.ts';

test('общая технология имеет один ID и участвует в разных профессиях', () => {
  const catalog = createCatalog();
  assert.equal(catalog.topics.filter(topic => topic.id === 'javascript').length, 1);
  assert(relatedRoles(catalog, 'javascript').includes('role:frontend'));
  assert(relatedRoles(catalog, 'javascript').includes('role:node'));
  assert(!relatedRoles(catalog, 'javascript').includes('role:android'));
  assert(relatedRoles(catalog, 'mysql').includes('role:node'), 'альтернативная СУБД тоже связана с профессией');
});

test('маршрут собирает все предпосылки и не требует Git до первого языка', () => {
  const catalog = createCatalog(), plan = planForRole(catalog, 'role:frontend');
  for (const id of ['programming', 'javascript', 'html', 'css', 'react', 'git']) assert(plan.topicIds.includes(id));
  assert(plan.topicIds.indexOf('javascript') < plan.topicIds.indexOf('react'));
  assert.deepEqual(catalog.topics.find(topic => topic.id === 'javascript')!.prerequisites, ['programming']);
  assert(!plan.topicIds.includes('sql'));
});

test('альтернатива включает одну СУБД, учитывает знания и явный выбор', () => {
  const catalog = createCatalog();
  const initial = planForRole(catalog, 'role:node');
  assert(initial.topicIds.includes('postgres')); assert(!initial.topicIds.includes('mysql'));
  const known = planForRole(catalog, 'role:node', new Set(['mysql']));
  assert(known.topicIds.includes('mysql')); assert(!known.topicIds.includes('postgres'));
  const chosen = planForRole(catalog, 'role:node', new Set(['mysql']), { 'role:node:database': 'postgres' });
  assert(chosen.topicIds.includes('postgres'));
  assert.throws(() => planForRole(catalog, 'role:node', new Set(), { 'role:node:database': 'redis' }));
});

test('разворачивание меняет представление, сохраняя исходный каталог', () => {
  const catalog = createCatalog(), original = JSON.stringify(catalog);
  const collapsed = projectCatalog(catalog, { expandedGroups: new Set() });
  const expanded = projectCatalog(catalog, { expandedGroups: new Set(catalog.groups.map(group => group.id)), allRelations: true });
  assert(collapsed.nodes.some(node => node.id === 'group:javascript'));
  assert(!collapsed.nodes.some(node => node.id === 'javascript'));
  assert(expanded.nodes.some(node => node.id === 'javascript'));
  assert.equal(expanded.nodes.length, catalog.topics.length);
  assert.equal(JSON.stringify(catalog), original);
});

test('выбранная профессия раскрывает все шаги и соединяет только соседние', () => {
  const catalog = createCatalog();
  const view = projectCatalog(catalog, { expandedGroups: new Set(), roleId: 'role:node' });
  assert(view.plan?.topicIds.includes('git'));
  assert(view.plan?.topicIds.includes('javascript'));
  assert(view.nodes.find(node => node.id === 'git')?.active);
  assert(view.nodes.every(node => node.kind !== 'group'));
  assert.equal(view.edges.length, view.nodes.length - 1);
  view.edges.forEach((edge, index) => {
    assert.equal(edge.source, view.nodes[index].id);
    assert.equal(edge.target, view.nodes[index + 1].id);
    assert.equal(edge.kind, 'learning-step');
  });
});

test('выбор общей технологии раскрывает её группу и связи с профессиями', () => {
  const catalog = createCatalog();
  const view = projectCatalog(catalog, { expandedGroups: new Set(), selectedId: 'javascript' });
  assert(view.nodes.some(node => node.id === 'javascript'));
  assert(!view.nodes.some(node => node.id === 'group:javascript'));
  assert(view.nodes.find(node => node.id === 'role:node')?.active);
  assert(view.nodes.find(node => node.id === 'role:frontend')?.active);
  assert(!view.nodes.find(node => node.id === 'role:android')?.active);
  assert(view.edges.every(edge => edge.kind === 'direction'), 'на обзоре скрыты поперечные зависимости');
});

test('выбор общего навыка внутри траектории не включает связи остальных профессий', () => {
  const catalog = createCatalog();
  const view = projectCatalog(catalog, { expandedGroups: new Set(), roleId: 'role:node', selectedId: 'git' });
  assert(view.nodes.find(node => node.id === 'git')?.active);
  assert(!view.nodes.find(node => node.id === 'role:android')?.active);
  assert(!view.edges.some(edge => edge.source === 'git' && edge.target === 'role:android'));
});

test('цикл и отсутствующие зависимости отклоняются', () => {
  const catalog = createCatalog();
  catalog.topics.find(topic => topic.id === 'programming')!.prerequisites.push('react');
  assert.throws(() => validateCatalog(catalog), /Цикл/);
  const broken = createCatalog(); broken.topics[0].prerequisites.push('missing');
  assert.throws(() => validateCatalog(broken), /Отсутствует/);
  const unusedCycle = createCatalog();
  unusedCycle.topics.find(topic => topic.id === 'docker')!.prerequisites.push('redis');
  unusedCycle.topics.find(topic => topic.id === 'redis')!.prerequisites.push('docker');
  assert.throws(() => validateCatalog(unusedCycle), /Цикл/);
});

for (const count of [100, 300, 800]) test('воспроизводимый нагрузочный набор: ' + count, () => {
  const catalog = createCatalog(count); assert.equal(catalog.topics.length, count);
  assert.deepEqual(createCatalog(count), catalog);
  const view = projectCatalog(catalog, { expandedGroups: new Set(), allRelations: true });
  const nodeIds = new Set(view.nodes.map(node => node.id));
  assert(view.edges.every(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target) && edge.source !== edge.target));
  assert.equal(new Set(view.nodes.map(node => node.id)).size, view.nodes.length);
});
