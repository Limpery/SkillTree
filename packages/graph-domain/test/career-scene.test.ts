import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrontendCatalog, Vertex } from '../src/frontend-catalog.ts';
import { CAREER_FLOAT, CAREER_SPACING, createCareerFloat, createCareerScene, fitCareerScene, START_NODE_ID } from '../src/career-scene.ts';
import { assembleVertices, type VertexInput } from '../src/vertex.ts';
import { planForRole } from '../src/index.ts';
import { KNOWLEDGE_NODE } from '../src/knowledge-layout.ts';
import type { Point } from '../src/index.ts';

const catalog = createFrontendCatalog(), snapshot = JSON.stringify(catalog);
const scenes = Promise.all(catalog.roles.map(role => createCareerScene(catalog, role.id)));
const input = (id: string, prerequisites: string[] = []): VertexInput => ({ id, label: id, short: id, stageId: 'web', description: 'Описание', outcome: 'Результат', resources: [], prerequisites });

test('в начале видны только центральная вершина и специальности', async () => {
  const scene = await createCareerScene(catalog);
  assert.equal(scene.nodes.length, catalog.roles.length + 1);
  assert.equal(scene.edges.length, catalog.roles.length);
  assert.deepEqual(scene.positions[START_NODE_ID], { x: 0, y: 0 });
  assert(scene.nodes.every(node => node.start || node.careerId));
  assert(scene.edges.every(edge => edge.source === START_NODE_ID));
});

test('каждая ветка содержит все требования своей профессии и не включает чужие технологии', async () => {
  for (const scene of await scenes) {
    const actual = new Set(scene.nodes.filter(node => !node.careerId && !node.start).flatMap(node => node.memberIds));
    const expected = new Set(planForRole(catalog, scene.roleId!).topicIds);
    assert.deepEqual(actual, expected);
    assert.equal(scene.nodes.filter(node => !node.careerId && !node.start).flatMap(node => node.memberIds).length, expected.size, 'Нет потерянных или дублирующихся тем');
    for (const node of scene.nodes) for (const id of node.memberIds) assert.equal(scene.nodeIdByTopic.get(id), node.id);
    assert.equal(scene.topicCount, expected.size);
    assert.equal(scene.nodes.filter(node => node.careerId).length, 2, 'Другую специальность можно выбрать на карте');
  }
  const [react, vue] = await scenes;
  assert(!react.nodeIdByTopic.has('vue'));
  assert(!vue.nodeIdByTopic.has('react'));
  assert.equal(react.topicCount, 51); assert.equal(vue.topicCount, 52);
});

test('у каждого блока есть вход и продолжение до итогового проекта, тупиков нет', async () => {
  for (const scene of await scenes) {
    const project = scene.nodeIdByTopic.get(scene.roleId === 'role:middle-react' ? 'middle-project' : 'vue-project')!;
    const detail = scene.nodes.filter(node => !node.start && !node.careerId);
    assert.deepEqual(detail.filter(node => !scene.edges.some(edge => edge.source === node.id)).map(node => node.id), [project]);
    const reached = new Set<string>(), pending = [scene.roleId!];
    while (pending.length) {
      const id = pending.pop()!;
      if (reached.has(id)) continue;
      reached.add(id); pending.push(...scene.edges.filter(edge => edge.source === id).map(edge => edge.target));
    }
    assert(detail.every(node => reached.has(node.id)));
    const leadsToProject = new Set<string>(), reverse = [project];
    while (reverse.length) {
      const id = reverse.pop()!;
      if (leadsToProject.has(id)) continue;
      leadsToProject.add(id); reverse.push(...scene.edges.filter(edge => edge.target === id).map(edge => edge.source));
    }
    assert(detail.every(node => leadsToProject.has(node.id)));
    for (const edge of scene.steps.filter(edge => edge.kind === 'learning-step')) {
      const source = scene.nodes.find(node => node.id === edge.source)!, target = scene.nodes.find(node => node.id === edge.target)!;
      assert.equal(target.depth, source.depth + 1, 'Переход пропускает шаг: ' + edge.id);
    }
    assert(scene.steps.every(step => scene.edges.some(edge => edge.id === step.id)));
  }
});

test('дальние предпосылки сохранены в данных, внутри блоков темы идут по порядку', async () => {
  for (const scene of await scenes) for (const topicId of planForRole(catalog, scene.roleId!).topicIds) {
    const nodeId = scene.nodeIdByTopic.get(topicId)!;
    for (const relation of catalog.relations.filter(edge => edge.target === topicId)) {
      const source = scene.nodeIdByTopic.get(relation.source)!;
      if (source === nodeId) {
        const members = scene.nodes.find(node => node.id === nodeId)!.memberIds;
        assert(members.indexOf(relation.source) < members.indexOf(topicId), relation.id);
      } else assert(scene.connections.some(edge => edge.originalRelations.some(item => item.id === relation.id)));
    }
  }
  assert.equal(JSON.stringify(catalog), snapshot);
});

test('вершины отделены, линии обходят круги в обеих траекториях', async () => {
  for (const scene of await scenes) {
    const ids = Object.keys(scene.positions);
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = scene.positions[ids[i]], b = scene.positions[ids[j]];
      assert(Math.hypot(a.x - b.x, a.y - b.y) > 2 * KNOWLEDGE_NODE.radius + 30, ids[i] + '/' + ids[j]);
    }
    for (const edge of scene.edges) for (let i = 1; i < edge.points.length; i++) {
      const a = edge.points[i - 1], b = edge.points[i], dx = b.x - a.x, dy = b.y - a.y;
      for (const id of ids) {
        if (id === edge.source || id === edge.target) continue;
        const p = scene.positions[id], t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
        assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 17, edge.id + '/' + id);
      }
    }
  }
});

test('все связи — прямые отрезки от края до края кругов, включая обзор', async () => {
  for (const scene of [await createCareerScene(catalog), ...await scenes]) for (const edge of scene.edges) {
    assert.equal(edge.points.length, 2, edge.id);
    const [start, end] = edge.points, source = scene.positions[edge.source], target = scene.positions[edge.target];
    assert.match(edge.path, /^M [-\d.e]+ [-\d.e]+ L [-\d.e]+ [-\d.e]+$/i, edge.id);
    const dx = target.x - source.x, dy = target.y - source.y, length = Math.hypot(dx, dy);
    assert(Math.abs(Math.hypot(start.x - source.x, start.y - source.y) - KNOWLEDGE_NODE.radius) < 1e-6);
    assert(Math.abs(Math.hypot(end.x - target.x, end.y - target.y) - KNOWLEDGE_NODE.radius) < 1e-6);
    for (const point of edge.points) assert(Math.abs((point.x - source.x) * dy - (point.y - source.y) * dx) < 1e-6, 'Отрезок отклоняется от направления между центрами: ' + edge.id);
    assert(Math.abs(Math.hypot(end.x - start.x, end.y - start.y) - (length - KNOWLEDGE_NODE.radius * 2)) < 1e-6);
  }
});

test('разброс координат сохраняет порядок от основ к сложному и параллельные блоки', async () => {
  for (const scene of await scenes) {
    const anchor = scene.positions[scene.roleId!], length = Math.hypot(anchor.x, anchor.y);
    const along = (p: Point) => ((p.x - anchor.x) * anchor.x + (p.y - anchor.y) * anchor.y) / length;
    const cross = (p: Point) => (-(p.x - anchor.x) * anchor.y + (p.y - anchor.y) * anchor.x) / length;
    const detail = scene.nodes.filter(node => !node.start && !node.careerId);
    for (const node of detail) assert(Math.abs(along(scene.positions[node.id]) - node.depth * CAREER_SPACING.step) <= CAREER_SPACING.scatter + 1e-6);
    for (const edge of scene.connections) {
      assert(along(scene.positions[edge.target]) > along(scene.positions[edge.source]), edge.id);
    }
    const layers = [...new Set(detail.map(node => node.depth))].map(depth => detail.filter(node => node.depth === depth));
    assert(layers.some(layer => layer.length > 1), 'Разветвления не превращены в одну последовательную цепочку');
    for (const layer of layers) {
      const coordinates = layer.map(node => cross(scene.positions[node.id])).sort((a, b) => a - b);
      for (let index = 1; index < coordinates.length; index++) assert(coordinates[index] - coordinates[index - 1] >= CAREER_SPACING.parallel - 1e-6);
    }
    const parallel = layers.filter(layer => layer.length > 1);
    assert(parallel.some(layer => Math.max(...layer.map(node => along(scene.positions[node.id]))) - Math.min(...layer.map(node => along(scene.positions[node.id]))) > 10), 'Координаты не должны оставаться строгой сеткой');
    const stepOf = (id: string) => detail.find(node => node.memberIds.includes(id))!.depth;
    const framework = scene.roleId === 'role:middle-react' ? 'react' : 'vue';
    assert(stepOf('html') < stepOf('javascript') && stepOf('javascript') < stepOf('typescript'));
    assert(stepOf('typescript') < stepOf(framework) && stepOf(framework) < stepOf('e2e'));
    for (const edge of scene.edges.filter(edge => edge.source !== START_NODE_ID)) {
      for (let i = 1; i < edge.points.length; i++) assert(along(edge.points[i]) >= along(edge.points[i - 1]) - 1e-6, 'Линия идёт назад: ' + edge.id);
      assert(Math.abs(Math.hypot(edge.points[0].x - scene.positions[edge.source].x, edge.points[0].y - scene.positions[edge.source].y) - KNOWLEDGE_NODE.radius) < 1e-6);
      const end = edge.points.at(-1)!;
      assert(Math.abs(Math.hypot(end.x - scene.positions[edge.target].x, end.y - scene.positions[edge.target].y) - KNOWLEDGE_NODE.radius) < 1e-6);
    }
  }
});

test('на карте только короткие переходы, длинные зависимости не возвращаются на полотно', async () => {
  for (const scene of await scenes) for (const edge of scene.edges) {
    const length = edge.points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point.x - edge.points[i].x, point.y - edge.points[i].y), 0);
    const source = scene.positions[edge.source], target = scene.positions[edge.target];
    assert(Math.hypot(source.x - target.x, source.y - target.y) <= CAREER_SPACING.maxLinkLength, edge.id);
    assert(length <= CAREER_SPACING.maxLinkLength, edge.id + ': длина кривой ' + length);
    assert(scene.steps.some(step => step.id === edge.id));
  }
});

test('основные линии разных ветвей не пересекаются', async () => {
  const orientation = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const crosses = (a: Point, b: Point, c: Point, d: Point) => orientation(a, b, c) * orientation(a, b, d) < -1e-6 && orientation(c, d, a) * orientation(c, d, b) < -1e-6;
  for (const scene of await scenes) for (let i = 0; i < scene.edges.length; i++) for (let j = i + 1; j < scene.edges.length; j++) {
    const a = scene.edges[i], b = scene.edges[j];
    if ([a.source, a.target].some(id => id === b.source || id === b.target)) continue;
    for (let ai = 1; ai < a.points.length; ai++) for (let bi = 1; bi < b.points.length; bi++) {
      assert(!crosses(a.points[ai - 1], a.points[ai], b.points[bi - 1], b.points[bi]), a.id + '/' + b.id);
    }
  }
});

test('повторное раскрытие даёт те же позиции и линии без изменения каталога', async () => {
  for (const scene of await scenes) {
    const again = await createCareerScene(catalog, scene.roleId);
    assert.deepEqual(again.positions, scene.positions);
    assert.deepEqual(again.edges, scene.edges);
  }
  assert.equal(JSON.stringify(catalog), snapshot);
});

test('масштаб учитывает реальный размер ветки и доступный экран', async () => {
  const overview = await createCareerScene(catalog), [react, vue] = await scenes;
  for (const [width, height] of [[390, 600], [1200, 720]]) for (const scene of [overview, react, vue]) {
    const viewport = fitCareerScene(scene.bounds, width, height);
    assert(scene.bounds.width * viewport.zoom <= width - 80);
    assert(scene.bounds.height * viewport.zoom <= height - 150);
    assert(Number.isFinite(viewport.x) && Number.isFinite(viewport.y));
  }
  assert(fitCareerScene(overview.bounds, 1200, 720).zoom > fitCareerScene(react.bounds, 1200, 720).zoom);
  const larger = { ...react.bounds, width: react.bounds.width * 2, height: react.bounds.height * 2 };
  assert(fitCareerScene(larger, 1200, 720).zoom < fitCareerScene(react.bounds, 1200, 720).zoom);
});

test('класс больше не содержит типов сложности и уровней; проверки связей остаются', () => {
  assert(catalog.vertices.every(vertex => !('type' in vertex) && !('level' in vertex) && !('type' in vertex.toJSON())));
  assert.throws(() => assembleVertices([new Vertex(input('a', ['missing']))], []), /Неизвестная/);
  assert.throws(() => assembleVertices([new Vertex(input('a', ['b'])), new Vertex(input('b', ['a']))], []), /Цикл/);
  assert.throws(() => assembleVertices([new Vertex(input('a')), new Vertex(input('a'))], []), /Повторный/);
  const vertex = new Vertex(input('a'));
  const json = vertex.toJSON(); (json.prerequisites as string[]).push('outside');
  assert.deepEqual(vertex.prerequisites, []);
  const legacy = new Vertex(JSON.parse(JSON.stringify({ ...input('b'), type: 'hard', level: 3 })));
  assert(!('type' in legacy.toJSON()) && !('level' in legacy.toJSON()));
});

test('неизвестная специальность отклоняется без изменения каталога', async () => {
  await assert.rejects(createCareerScene(catalog, 'missing'), /Неизвестная специальность/);
  assert.equal(JSON.stringify(catalog), snapshot);
});

test('плавание ограничено радиусом, начинается плавно и не меняет исходную сцену', async () => {
  for (const scene of [await createCareerScene(catalog), ...await scenes]) {
    const snapshot = JSON.stringify(scene), sample = createCareerFloat(scene), again = createCareerFloat(scene);
    assert.deepEqual(sample(0).positions, scene.positions);
    const moved = sample(5000).positions;
    assert(scene.nodes.some(node => Math.hypot(moved[node.id].x - scene.positions[node.id].x, moved[node.id].y - scene.positions[node.id].y) > 1));
    const offsets = scene.nodes.map(node => [moved[node.id].x - scene.positions[node.id].x, moved[node.id].y - scene.positions[node.id].y]);
    assert(new Set(offsets.map(offset => offset.join(','))).size > 1, 'Вершины должны двигаться независимо');
    for (let time = 0; time <= 120000; time += 1000) {
      const current = sample(time), next = sample(time + 16);
      assert.deepEqual(current, again(time));
      for (const node of scene.nodes) {
        const point = current.positions[node.id], anchor = scene.positions[node.id];
        assert(Math.hypot(point.x - anchor.x, point.y - anchor.y) <= CAREER_FLOAT.radius + 1e-6);
        assert(Math.hypot(point.x - next.positions[node.id].x, point.y - next.positions[node.id].y) < .25, 'Движение должно быть медленным и без скачков');
      }
    }
    assert.equal(JSON.stringify(scene), snapshot);
  }
});

test('при плавании связи остаются прямыми и прикреплёнными к кругам, пересечений нет', async () => {
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  for (const scene of [await createCareerScene(catalog), ...await scenes]) {
    const sample = createCareerFloat(scene);
    for (let time = 0; time <= 120000; time += 1000) {
      const { positions, edges } = sample(time), ids = Object.keys(positions);
      assert.equal(edges.length, scene.edges.length);
      for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
        const a = positions[ids[i]], b = positions[ids[j]];
        assert(Math.hypot(a.x - b.x, a.y - b.y) > KNOWLEDGE_NODE.radius * 2 + 10);
      }
      for (const edge of edges) {
        assert.equal(edge.points.length, 2);
        const [a, b] = edge.points, source = positions[edge.source], target = positions[edge.target];
        assert(Math.abs(Math.hypot(a.x - source.x, a.y - source.y) - KNOWLEDGE_NODE.radius) < 1e-6);
        assert(Math.abs(Math.hypot(b.x - target.x, b.y - target.y) - KNOWLEDGE_NODE.radius) < 1e-6);
        for (const id of ids) {
          if (id === edge.source || id === edge.target) continue;
          const p = positions[id], dx = b.x - a.x, dy = b.y - a.y;
          const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
          assert(Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy) > KNOWLEDGE_NODE.radius + 1, edge.id + '/' + id);
        }
      }
      for (let i = 0; i < edges.length; i++) for (let j = i + 1; j < edges.length; j++) {
        const a = edges[i], b = edges[j];
        if ([a.source, a.target].some(id => id === b.source || id === b.target)) continue;
        const [p, q] = a.points, [r, s] = b.points;
        assert(!(cross(p, q, r) * cross(p, q, s) < -1e-6 && cross(r, s, p) * cross(r, s, q) < -1e-6), a.id + '/' + b.id);
      }
    }
  }
});
