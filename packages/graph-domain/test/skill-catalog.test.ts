import test from 'node:test';
import assert from 'node:assert/strict';
import { createSkillCatalog, backendTracks } from '../src/skill-catalog.ts';
import { createFrontendCatalog, trackMembership } from '../src/frontend-catalog.ts';
import { planForRole, type Point } from '../src/index.ts';
import { CAREER_FLOAT, CAREER_SPACING, createCareerFloat, createCareerScene, fitCareerScene } from '../src/career-scene.ts';
import { KNOWLEDGE_NODE } from '../src/knowledge-layout.ts';

const catalog = createSkillCatalog(), snapshot = JSON.stringify(catalog);
const scenes = Promise.all(catalog.roles.map(role => createCareerScene(catalog, role.id)));
const profiles = [
  { id: 'nodejs', required: ['nodejs', 'nodejs-io', 'nodejs-event-loop', 'typescript-deep', 'nestjs', 'prisma', 'nodejs-testing'] },
  { id: 'python', required: ['python', 'python-typing', 'python-packaging', 'python-async', 'fastapi', 'pydantic', 'sqlalchemy', 'python-testing'] },
  { id: 'java', required: ['java', 'java-oop', 'java-collections', 'java-build', 'jvm', 'java-concurrency', 'spring-boot', 'spring-web', 'spring-data', 'java-testing'] },
];

test('полный каталог содержит пять профессий, исходные фронтенд-темы сохранены', () => {
  assert.equal(catalog.roles.length, 5);
  assert.deepEqual(catalog.tracks.map(track => track.id), ['react', 'vue', 'nodejs', 'python', 'java']);
  assert.equal(new Set(catalog.topics.map(topic => topic.id)).size, catalog.topics.length);
  const original = createFrontendCatalog();
  for (const vertex of original.vertices) assert.deepEqual(catalog.vertices.find(item => item.id === vertex.id)!.toJSON(), vertex.toJSON());
  const required = new Set(catalog.roles.flatMap(role => planForRole(catalog, role.id).topicIds));
  assert(catalog.topics.every(topic => topic.kind === 'role' || required.has(topic.id)), 'Новая тема должна входить хотя бы в один путь');
  assert(catalog.topics.every(topic => topic.resources.length && topic.outcome.length > 30));
});

test('в обзоре только начало и пять разделённых специальностей', async () => {
  const scene = await createCareerScene(catalog);
  assert.equal(scene.nodes.length, 6);
  assert.equal(scene.edges.length, 5);
  assert(scene.nodes.every(node => node.start || node.careerId));
  const angles = scene.nodes.filter(node => node.careerId).map(node => Math.atan2(scene.positions[node.id].y, scene.positions[node.id].x));
  assert.equal(new Set(angles).size, 5);
});

for (const profile of profiles) test(`${profile.id}: полный собственный стек без чужих языков и браузерных зависимостей`, async () => {
  const plan = new Set(planForRole(catalog, 'role:middle-' + profile.id).topicIds);
  for (const id of [...profile.required, 'git', 'terminal', 'http', 'sql', 'postgresql', 'db-transactions', 'backend-auth', 'backend-security', 'docker', 'redis', 'message-queues', 'backend-testing', 'backend-ci', 'backend-observability', profile.id + '-project']) assert(plan.has(id), id);
  for (const other of profiles.filter(item => item.id !== profile.id)) for (const id of other.required) assert(!plan.has(id), 'Чужая технология ' + id);
  for (const id of ['react', 'vue', 'html', 'css', 'dom', 'fetch', 'security']) assert(!plan.has(id), 'Браузерная зависимость ' + id);
  if (profile.id !== 'nodejs') for (const id of ['javascript', 'typescript', 'nodejs']) assert(!plan.has(id));
  assert(catalog.topics.find(topic => topic.id === profile.id + '-project')!.practice);
});

test('общие компетенции используют единые ID во всех подходящих профессиях', () => {
  const membership = trackMembership(catalog);
  for (const id of ['git', 'terminal', 'http', 'programming']) {
    assert.equal(catalog.topics.filter(topic => topic.id === id).length, 1);
    assert.equal(membership.get(id)!.length, 5);
  }
  for (const id of ['postgresql', 'sql', 'redis', 'docker', 'backend-auth']) assert.deepEqual(membership.get(id), backendTracks.map(track => track.id));
  assert.deepEqual(membership.get('typescript'), ['react', 'vue', 'nodejs']);
});

test('каждая из пяти траекторий сохраняет темы, вкладки, предпосылки и путь до проекта', async () => {
  for (const scene of await scenes) {
    const detail = scene.nodes.filter(node => !node.start && !node.careerId);
    const ids = detail.flatMap(node => node.memberIds);
    assert.deepEqual(new Set(ids), new Set(planForRole(catalog, scene.roleId!).topicIds));
    assert.equal(ids.length, new Set(ids).size);
    const reached = new Set<string>(), queue = [scene.roleId!];
    while (queue.length) { const id = queue.pop()!; if (reached.has(id)) continue; reached.add(id); queue.push(...scene.steps.filter(step => step.source === id).map(step => step.target)); }
    assert(detail.every(node => reached.has(node.id)));
    const ends = detail.filter(node => !scene.steps.some(step => step.source === node.id));
    assert.equal(ends.length, 1);
    assert(ends[0].memberIds[0].endsWith('-project'));
    for (const step of scene.steps.filter(step => step.kind === 'learning-step')) {
      assert.equal(scene.nodes.find(node => node.id === step.target)!.depth, scene.nodes.find(node => node.id === step.source)!.depth + 1);
    }
    for (const id of ids) for (const parent of catalog.topics.find(topic => topic.id === id)!.prerequisites) {
      const source = scene.nodeIdByTopic.get(parent)!, target = scene.nodeIdByTopic.get(id)!;
      if (source === target) { const members = detail.find(node => node.id === source)!.memberIds; assert(members.indexOf(parent) < members.indexOf(id)); }
      else assert(scene.connections.some(edge => edge.originalRelations.some(original => original.source === parent && original.target === id)));
    }
    for (const [width, height] of [[390, 600], [1440, 900]]) {
      const fit = fitCareerScene(scene.bounds, width, height);
      assert(scene.bounds.width * fit.zoom < width && scene.bounds.height * fit.zoom < height);
      const padded = fitCareerScene(scene.bounds, width, height, { top: 170, bottom: 70 });
      assert(scene.bounds.y * padded.zoom + padded.y >= 170 - 1e-6);
      assert((scene.bounds.y + scene.bounds.height) * padded.zoom + padded.y <= height - 70 + 1e-6);
    }
  }
  assert.equal(JSON.stringify(catalog), snapshot);
});

test('пять профессий: круги и линии разделены в статике и при плавании', async () => {
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (const scene of [await createCareerScene(catalog), ...await scenes]) {
    const sample = createCareerFloat(scene);
    for (let time = 0; time <= 120000; time += 5000) {
      const { positions, edges } = sample(time), ids = Object.keys(positions);
      for (const id of ids) assert(Math.hypot(positions[id].x - scene.positions[id].x, positions[id].y - scene.positions[id].y) <= CAREER_FLOAT.radius + 1e-6);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        assert(Math.hypot(positions[ids[i]].x - positions[ids[j]].x, positions[ids[i]].y - positions[ids[j]].y) > KNOWLEDGE_NODE.radius * 2 + 10, scene.roleId + ': ' + ids[i] + '/' + ids[j]);
      }
      for (const edge of edges) {
        const [a, b] = edge.points, source = positions[edge.source], target = positions[edge.target];
        assert.equal(edge.points.length, 2);
        assert(Math.abs(Math.hypot(a.x - source.x, a.y - source.y) - KNOWLEDGE_NODE.radius) < 1e-6);
        assert(Math.abs(Math.hypot(b.x - target.x, b.y - target.y) - KNOWLEDGE_NODE.radius) < 1e-6);
        assert(Math.hypot(source.x - target.x, source.y - target.y) <= CAREER_SPACING.maxLinkLength, edge.id);
        for (const id of ids) {
          if (id === edge.source || id === edge.target) continue;
          const p = positions[id], dx = b.x - a.x, dy = b.y - a.y;
          const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
          assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 1, scene.roleId + ': ' + edge.id + '/' + id);
        }
      }
      for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i], b = edges[j];
        if ([a.source, a.target].some(id => id === b.source || id === b.target)) continue;
        const [p, q] = a.points, [r, s] = b.points;
        assert(!(cross(p, q, r) * cross(p, q, s) < -1e-6 && cross(r, s, p) * cross(r, s, q) < -1e-6), scene.roleId + ': ' + a.id + '/' + b.id);
      }
    }
  }
});
