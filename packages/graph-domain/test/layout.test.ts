import test from 'node:test';
import assert from 'node:assert/strict';
import { createCatalog } from '../src/catalog.ts';
import { planForRole, projectCatalog, type Point, type VisibleEdge, type VisibleNode } from '../src/index.ts';

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
}

function checkGeometry(view: { nodes: VisibleNode[]; edges: VisibleEdge[] }) {
  for (let i = 0; i < view.nodes.length; i++) for (let j = i + 1; j < view.nodes.length; j++) {
    const a = view.nodes[i], b = view.nodes[j];
    assert(Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y) >= 140,
      `Перекрытие вершин: ${a.id} / ${b.id}`);
  }
  for (const edge of view.edges) {
    const [ax, ay, bx, by] = edge.path!.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi)!.map(Number);
    for (const node of view.nodes) {
      if (node.id === edge.source || node.id === edge.target) continue;
      assert(distanceToSegment(node.position, { x: ax, y: ay }, { x: bx, y: by }) > 62,
        `Линия ${edge.source} -> ${edge.target} пересекает ${node.id}`);
    }
  }
}

test('React следует порядку Git HTTP HTML CSS JS TS React с сохранением реальных предпосылок', () => {
  const catalog = createCatalog();
  const plan = planForRole(catalog, 'role:react');
  assert.deepEqual(plan.topicIds.filter(id => id !== 'programming'), ['git', 'http', 'html', 'css', 'javascript', 'typescript', 'react']);
  assert(plan.topicIds.indexOf('programming') < plan.topicIds.indexOf('javascript'));
  assert.deepEqual(catalog.topics.find(topic => topic.id === 'http')!.prerequisites, []);
  for (const topic of catalog.topics.filter(topic => plan.topicIds.includes(topic.id))) {
    for (const prerequisite of topic.prerequisites) assert(plan.topicIds.indexOf(prerequisite) < plan.topicIds.indexOf(topic.id));
  }
});

test('порядок обучения не может нарушить предварительные требования', () => {
  const catalog = createCatalog();
  catalog.roles.find(role => role.id === 'role:react')!.learningOrder!.reverse();
  const plan = planForRole(catalog, 'role:react');
  assert(plan.topicIds.indexOf('programming') < plan.topicIds.indexOf('javascript'));
  assert(plan.topicIds.indexOf('javascript') < plan.topicIds.indexOf('typescript'));
  assert(plan.topicIds.indexOf('html') < plan.topicIds.indexOf('react'));
});

test('любая профессия отображается одной цепочкой без лишних связей и изменения каталога', () => {
  const catalog = createCatalog(), original = JSON.stringify(catalog);
  for (const role of catalog.roles) {
    const view = projectCatalog(catalog, { expandedGroups: new Set(), roleId: role.id });
    assert.deepEqual(view.nodes.map(node => node.id), [...view.plan!.topicIds, role.id]);
    assert.equal(view.edges.length, view.nodes.length - 1);
    assert.equal(new Set(view.nodes.map(node => node.id)).size, view.nodes.length);
    checkGeometry(view);
  }
  assert.equal(JSON.stringify(catalog), original);
});

for (const count of [100, 300, 800]) test(`вершины и линии не пересекаются при ${count} темах`, () => {
  const catalog = createCatalog(count);
  for (const expandedGroups of [new Set<string>(), new Set(['foundation', 'javascript', 'react']), new Set(catalog.groups.map(group => group.id))]) {
    checkGeometry(projectCatalog(catalog, { expandedGroups }));
  }
});
