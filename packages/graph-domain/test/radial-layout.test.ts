import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrontendCatalog } from '../src/frontend-catalog.ts';
import { essentialRelations, KNOWLEDGE_NODE, layoutRadialKnowledgeGraph } from '../src/knowledge-layout.ts';

const catalog = createFrontendCatalog(), snapshot = JSON.stringify(catalog);
const layoutResult = layoutRadialKnowledgeGraph(catalog);
test('радиальная карта сохраняет все вершины, предметные связи и исходный каталог', async () => {
  const layout = await layoutResult;
  assert.deepEqual(Object.keys(layout.positions).sort(), catalog.topics.map(topic => topic.id).sort());
  assert.deepEqual(layout.edges.map(edge => edge.id).sort(), essentialRelations(catalog).map(edge => edge.id).sort());
  assert.equal(JSON.stringify(catalog), snapshot);
});
test('профессии находятся на периферии фронтенд-сектора, общая база окружает центр', async () => {
  const layout = await layoutResult;
  const radius = (id: string) => Math.hypot(layout.positions[id].x - layout.center.x, layout.positions[id].y - layout.center.y);
  const roles = catalog.roles.map(role => role.id);
  for (const role of roles) {
    assert(layout.positions[role].y > layout.center.y);
    assert(layout.angles[role] > 50 && layout.angles[role] < 130);
    assert(radius(role) > Math.max(...catalog.topics.filter(topic => topic.kind !== 'role').map(topic => radius(topic.id))));
  }
  const roots = catalog.topics.filter(topic => !topic.prerequisites.length);
  assert(roots.some(topic => layout.positions[topic.id].y < layout.center.y));
  assert(roots.some(topic => layout.positions[topic.id].y > layout.center.y));
  assert(roots.every(topic => radius(topic.id) < 450));
  assert(layout.positions.react.x !== layout.positions.vue.x);
});
test('радиальные круги не перекрываются, линии обходят посторонние вершины', async () => {
  const layout = await layoutResult, ids = Object.keys(layout.positions);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = layout.positions[ids[i]], b = layout.positions[ids[j]];
    assert(Math.hypot(a.x - b.x, a.y - b.y) > KNOWLEDGE_NODE.radius * 2 + 30, `${ids[i]} / ${ids[j]}`);
  }
  for (const edge of layout.edges) {
    for (const id of [edge.source, edge.target]) {
      const p = layout.positions[id], end = id === edge.source ? edge.points[0] : edge.points.at(-1)!;
      assert(Math.abs(Math.hypot(p.x - end.x, p.y - end.y) - KNOWLEDGE_NODE.radius) < .001, edge.id);
    }
    for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1], b = edge.points[i], dx = b.x - a.x, dy = b.y - a.y;
      for (const id of ids) {
        if (id === edge.source || id === edge.target) continue;
        const p = layout.positions[id], t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
        assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 17, `${edge.id} пересекает ${id}`);
      }
    }
  }
});

test('направление профессии задаётся отдельно от её зависимостей', async () => {
  const layout = await layoutRadialKnowledgeGraph(catalog, { roleDirections: { 'role:middle-vue': 'backend' }, directionAngles: { backend: 40 } });
  assert(Math.abs(layout.angles['role:middle-vue'] - 40) < 1);
  assert(layout.directions.find(direction => direction.id === 'backend')!.active);
  assert.equal(JSON.stringify(catalog), snapshot);
});
