import test from 'node:test';
import assert from 'node:assert/strict';
import { planForRole } from '../src/index.ts';
import { MIDDLE_REACT_ROLE } from '../src/middle-react.ts';
import { createFrontendCatalog, MIDDLE_VUE_ROLE, trackMembership } from '../src/frontend-catalog.ts';
import { KNOWLEDGE_NODE, layoutKnowledgeGraph } from '../src/knowledge-layout.ts';

const catalog = createFrontendCatalog();
const snapshot = JSON.stringify(catalog);
const layoutResult = layoutKnowledgeGraph(catalog);

test('две самостоятельные профессии не требуют знания чужого фреймворка', () => {
  assert.equal(catalog.roles.length, 2);
  const membership = trackMembership(catalog);
  const react = planForRole(catalog, MIDDLE_REACT_ROLE).topicIds;
  const vue = planForRole(catalog, MIDDLE_VUE_ROLE).topicIds;
  assert(react.includes('middle-project') && react.includes('react-effects'));
  assert(vue.includes('vue-project') && vue.includes('vue-testing'));
  assert(!react.some(id => id === 'vue' || id.startsWith('vue-')));
  assert(!vue.some(id => membership.get(id)!.length === 1 && membership.get(id)![0] === 'react'));
  assert(catalog.topics.every(topic => membership.get(topic.id)!.length > 0), 'Не должно быть тем вне обеих профессий');
});

test('общие технологии и методологии существуют один раз и входят в оба пути', () => {
  const membership = trackMembership(catalog);
  for (const id of ['html', 'css', 'javascript', 'typescript', 'git', 'fetch', 'typed-api', 'server-state', 'component-tests', 'ci', 'deploy']) {
    assert.equal(catalog.topics.filter(topic => topic.id === id).length, 1);
    assert.deepEqual(membership.get(id), ['react', 'vue'], id);
  }
  assert.deepEqual(catalog.topics.find(topic => topic.id === 'react')!.prerequisites, catalog.topics.find(topic => topic.id === 'vue')!.prerequisites);
  assert(catalog.topics.every(topic => topic.resources.length && topic.outcome.length > 30));
});

test('две ветви стоят на общем уровне, зависимости сохранены, данные неизменны', async () => {
  const layout = await layoutResult;
  assert.equal(layout.positions.react.y, layout.positions.vue.y);
  assert.notEqual(layout.positions.react.x, layout.positions.vue.x);
  assert.equal(JSON.stringify(catalog), snapshot);
  for (const original of catalog.relations) {
    const pending = [original.source], visited = new Set<string>();
    while (pending.length) {
      const id = pending.pop()!;
      if (visited.has(id)) continue;
      visited.add(id); pending.push(...layout.edges.filter(edge => edge.source === id).map(edge => edge.target));
    }
    assert(visited.has(original.target), original.id);
    assert(layout.positions[original.source].y < layout.positions[original.target].y, original.id);
  }
});

test('геометрия общей карты: круги разделены, линии обходят обе ветви', async () => {
  const layout = await layoutResult, ids = Object.keys(layout.positions);
  for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
    const a = layout.positions[ids[i]], b = layout.positions[ids[j]];
    assert(Math.hypot(a.x - b.x, a.y - b.y) > 2 * KNOWLEDGE_NODE.radius + 30, `${ids[i]} / ${ids[j]}`);
  }
  for (const edge of layout.edges) for (let i = 1; i < edge.points.length; i++) {
    const a = edge.points[i - 1], b = edge.points[i], dx = b.x - a.x, dy = b.y - a.y;
    for (const id of ids) {
      if (id === edge.source || id === edge.target) continue;
      const p = layout.positions[id];
      const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
      assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 3, `${edge.id} пересекает ${id}`);
    }
  }
});
