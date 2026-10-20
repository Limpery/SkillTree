import test from 'node:test';
import assert from 'node:assert/strict';
import { planForRole } from '../src/index.ts';
import { createMiddleReactCatalog, MIDDLE_REACT_ROLE } from '../src/middle-react.ts';
import { essentialRelations, KNOWLEDGE_NODE, layoutKnowledgeGraph } from '../src/knowledge-layout.ts';

const catalog = createMiddleReactCatalog();
const catalogSnapshot = JSON.stringify(catalog);
const result = layoutKnowledgeGraph(catalog);

test('одна цель Middle React включает все компетенции и практический результат', () => {
  assert.equal(catalog.roles.length, 1);
  assert.equal(catalog.roles[0].id, MIDDLE_REACT_ROLE);
  const plan = planForRole(catalog, MIDDLE_REACT_ROLE);
  assert.equal(plan.topicIds.length, catalog.topics.length - 1);
  assert(plan.topicIds.includes('middle-project'));
  assert(catalog.topics.every(topic => topic.description.length > 30 && topic.outcome.length > 30 && topic.resources.length > 0));
  assert.equal(new Set(catalog.topics.map(topic => topic.id)).size, catalog.topics.length);
});

test('независимые HTML CSS JS не образуют искусственную цепочку и стоят вровень', async () => {
  const layout = await result;
  const ids = ['html', 'css', 'javascript'];
  assert.equal(new Set(ids.map(id => layout.positions[id].y)).size, 1);
  assert.equal(new Set(ids.map(id => layout.positions[id].x)).size, 3);
  for (const topic of catalog.topics.filter(topic => ids.includes(topic.id))) assert(!topic.prerequisites.some(id => ids.includes(id)));
});

test('React объединяет три ветви, API объединяет HTTP и асинхронность', () => {
  assert.deepEqual(catalog.topics.find(topic => topic.id === 'react')!.prerequisites, ['html', 'css', 'javascript']);
  assert.deepEqual(catalog.topics.find(topic => topic.id === 'fetch')!.prerequisites, ['http', 'async']);
  const edges = essentialRelations(catalog);
  assert(edges.filter(edge => edge.target === 'react').length >= 3);
  assert(edges.filter(edge => edge.source === 'http').length >= 2);
});

test('прореживание линий сохраняет достижимость каждой исходной зависимости', () => {
  const edges = essentialRelations(catalog);
  for (const original of catalog.relations) {
    const pending = [original.source], visited = new Set<string>();
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id); pending.push(...edges.filter(edge => edge.source === id).map(edge => edge.target));
    }
    assert(visited.has(original.target), original.id);
  }
});

test('новая раскладка не меняет предметные данные и направляет зависимости вниз', async () => {
  const layout = await result;
  assert.equal(JSON.stringify(catalog), catalogSnapshot);
  for (const edge of layout.edges) assert(layout.positions[edge.source].y < layout.positions[edge.target].y, edge.id);
});

test('круги не накладываются, каждый отрезок соединения обходит посторонние вершины', async () => {
  const layout = await result, ids = Object.keys(layout.positions);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = layout.positions[ids[i]], b = layout.positions[ids[j]];
    assert(Math.hypot(a.x - b.x, a.y - b.y) > 2 * KNOWLEDGE_NODE.radius + 30, `${ids[i]} / ${ids[j]}`);
  }
  for (const edge of layout.edges) for (let i = 1; i < edge.points.length; i++) {
    const a = edge.points[i - 1], b = edge.points[i];
    const dx = b.x - a.x, dy = b.y - a.y;
    for (const id of ids) {
      if (id === edge.source || id === edge.target) continue;
      const p = layout.positions[id];
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 3, `${edge.id} пересекает ${id}`);
    }
  }
});
