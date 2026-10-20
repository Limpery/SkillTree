import type { ElkNode } from 'elkjs/lib/elk-api.js';
import { planForRole, type Point } from './index.ts';
import type { KnowledgeCatalog } from './middle-react.ts';

export const KNOWLEDGE_NODE = { width: 196, height: 196, radius: 80 };
export type KnowledgeEdge = { id: string; source: string; target: string; path: string; points: Point[] };
export type KnowledgeLayout = { positions: Record<string, Point>; edges: KnowledgeEdge[]; width: number; height: number; levels: Record<string, number> };

function roundedPath(points: Point[], cornerRadius = 14): string {
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1], point = points[index], next = points[index + 1];
    const incoming = Math.hypot(point.x - previous.x, point.y - previous.y);
    const outgoing = Math.hypot(next.x - point.x, next.y - point.y);
    const radius = Math.min(cornerRadius, incoming / 2, outgoing / 2);
    if (!radius) continue;
    const before = { x: point.x - (point.x - previous.x) * radius / incoming, y: point.y - (point.y - previous.y) * radius / incoming };
    const after = { x: point.x + (next.x - point.x) * radius / outgoing, y: point.y + (next.y - point.y) * radius / outgoing };
    path += ` L ${before.x} ${before.y} Q ${point.x} ${point.y} ${after.x} ${after.y}`;
  }
  return path + ` L ${points.at(-1)!.x} ${points.at(-1)!.y}`;
}

export type MapDirection = { id: string; label: string; angle: number; active: boolean };
export type RadialKnowledgeLayout = KnowledgeLayout & { center: Point; outerRadius: number; directions: MapDirection[]; angles: Record<string, number> };
export type RadialLayoutOptions = { roleDirections?: Record<string, string>; directionAngles?: Record<string, number> };
/** Screen angles: right = 0, bottom = 90. These are geography hints, not prerequisite edges. */
export const MAP_DIRECTIONS: MapDirection[] = [
  { id: 'big-data', label: 'Big Data', angle: -90, active: false },
  { id: 'analytics', label: 'Аналитика', angle: -38, active: false },
  { id: 'databases', label: 'Базы данных', angle: 0, active: false },
  { id: 'backend', label: 'Бэкенд', angle: 43, active: false },
  { id: 'frontend', label: 'Фронтенд', angle: 90, active: true },
  { id: 'engineering', label: 'Инженерия и проектирование', angle: 180, active: false },
];

const degrees = (angle: number) => angle * Math.PI / 180;
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
function segmentDistance(point: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / (dx * dx + dy * dy || 1)));
  return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}

/** Radial geography is independent of the curriculum. Shared IDs and prerequisites stay intact. */
export async function layoutRadialKnowledgeGraph(catalog: KnowledgeCatalog, options: RadialLayoutOptions = {}): Promise<RadialKnowledgeLayout> {
  const roleDirection = (id: string) => options.roleDirections?.[id] ?? 'frontend';
  const directions = MAP_DIRECTIONS.map(direction => ({ ...direction, angle: options.directionAngles?.[direction.id] ?? direction.angle, active: catalog.roles.some(role => roleDirection(role.id) === direction.id) }));
  const levels: Record<string, number> = {}, byId = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const levelOf = (id: string): number => levels[id] ??= Math.max(-1, ...byId.get(id)!.prerequisites.map(levelOf)) + 1;
  catalog.topics.forEach(topic => levelOf(topic.id));
  const plans = catalog.roles.map(role => new Set([...planForRole(catalog, role.id).topicIds, role.id]));
  const owners = new Map(catalog.topics.map(topic => [topic.id, plans.flatMap((plan, index) => plan.has(topic.id) ? [index] : [])]));
  const positions: Record<string, Point> = {}, anchors: Record<string, Point> = {};
  const shared = catalog.topics.filter(topic => owners.get(topic.id)!.length > 1 || topic.kind === 'foundation');
  const sharedMax = Math.max(1, ...shared.map(topic => levels[topic.id]));
  shared.forEach((topic, index) => {
    const radius = topic.kind === 'foundation' ? 240 : 440 + 710 * levels[topic.id] / sharedMax;
    const angle = degrees(index * 137.507764 - 45);
    positions[topic.id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
  });
  const branchBase = 1380, branchStep = 240;
  catalog.roles.forEach((role, track) => {
    const exclusive = catalog.topics.filter(topic => owners.get(topic.id)!.length === 1 && owners.get(topic.id)![0] === track && !positions[topic.id]);
    const localLevels: Record<string, number> = {};
    const localLevel = (id: string): number => localLevels[id] ??= Math.max(-1, ...byId.get(id)!.prerequisites.filter(parent => owners.get(parent)!.length === 1 && owners.get(parent)![0] === track).map(localLevel)) + 1;
    exclusive.forEach(topic => localLevel(topic.id));
    const max = Math.max(1, ...Object.values(localLevels));
    const direction = directions.find(item => item.id === roleDirection(role.id));
    if (!direction) throw new Error('Неизвестное направление профессии: ' + roleDirection(role.id));
    const peers = catalog.roles.filter(item => roleDirection(item.id) === direction.id), peerIndex = peers.findIndex(item => item.id === role.id);
    const middle = direction.angle + (peers.length === 1 ? 0 : 22 - peerIndex * 44 / (peers.length - 1));
    for (let level = 0; level <= max; level++) {
      const band = exclusive.filter(topic => localLevels[topic.id] === level);
      band.forEach((topic, index) => {
        const angle = degrees(middle + (band.length > 1 ? (index / (band.length - 1) - .5) * 30 : 0));
        const radius = branchBase + branchStep * level;
        positions[topic.id] = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
      });
    }
  });
  // Also supports a single-role catalog: topics not assigned above belong to its branch.
  catalog.topics.forEach((topic, index) => {
    positions[topic.id] ??= { x: Math.cos(index * 2.4) * (400 + levels[topic.id] * 130), y: Math.sin(index * 2.4) * (400 + levels[topic.id] * 130) };
    anchors[topic.id] = { ...positions[topic.id] };
  });
  const ids = catalog.topics.map(topic => topic.id), separation = 264;
  // Soft anchors retain sectors; pair repulsion removes incidental overlaps without a Cartesian grid.
  for (let iteration = 0; iteration < 240; iteration++) {
    const spring = iteration < 160 ? .015 : 0;
    for (const id of ids) { positions[id].x += (anchors[id].x - positions[id].x) * spring; positions[id].y += (anchors[id].y - positions[id].y) * spring; }
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const a = positions[ids[i]], b = positions[ids[j]], dx = b.x - a.x, dy = b.y - a.y, length = Math.hypot(dx, dy);
      if (length >= separation) continue;
      const amount = (separation - length) / 2 + .01, nx = length ? dx / length : 1, ny = length ? dy / length : 0;
      a.x -= nx * amount; a.y -= ny * amount; b.x += nx * amount; b.y += ny * amount;
    }
  }
  const outerRadius = Math.max(...ids.map(id => Math.hypot(positions[id].x, positions[id].y))) + 140;
  const size = 2 * (outerRadius + 380), center = { x: size / 2, y: size / 2 };
  const angles: Record<string, number> = {};
  for (const id of ids) { angles[id] = Math.atan2(positions[id].y, positions[id].x) * 180 / Math.PI; positions[id].x += center.x; positions[id].y += center.y; }

  const edges = routeKnowledgeEdges(positions, essentialRelations(catalog));
  return { positions, edges, levels, angles, center, outerRadius, width: size, height: size, directions };
}

export function routeKnowledgeEdges(positions: Record<string, Point>, relations: import('./index.ts').Relation[]): KnowledgeEdge[] {
  const ids = Object.keys(positions);
  const obstacles = ids.map(id => ({ ...positions[id], id }));
  const clearance = KNOWLEDGE_NODE.radius + 18;
  const clear = (a: Point, b: Point, ignoreA = '', ignoreB = '') => obstacles.every(obstacle => obstacle.id === ignoreA || obstacle.id === ignoreB ||
    obstacle.x < Math.min(a.x, b.x) - clearance || obstacle.x > Math.max(a.x, b.x) + clearance ||
    obstacle.y < Math.min(a.y, b.y) - clearance || obstacle.y > Math.max(a.y, b.y) + clearance || segmentDistance(obstacle, a, b) > clearance);
  // A visibility graph around inflated circles gives routes with no right-angle table corridors.
  const waypoints = obstacles.flatMap(obstacle => Array.from({ length: 8 }, (_, index) => ({ x: obstacle.x + Math.cos(index * Math.PI / 4) * (KNOWLEDGE_NODE.radius + 42), y: obstacle.y + Math.sin(index * Math.PI / 4) * (KNOWLEDGE_NODE.radius + 42) })));
  let adjacency: { index: number; cost: number }[][] | undefined;
  function route(source: string, target: string): Point[] {
    const start = positions[source], end = positions[target];
    if (clear(start, end, source, target)) return [{ ...start }, { ...end }];
    if (!adjacency) {
      adjacency = waypoints.map(() => []);
      for (let i = 0; i < waypoints.length; i++) for (let j = i + 1; j < waypoints.length; j++) if (clear(waypoints[i], waypoints[j])) {
        const cost = distance(waypoints[i], waypoints[j]); adjacency[i].push({ index: j, cost }); adjacency[j].push({ index: i, cost });
      }
    }
    const costs = waypoints.map(point => clear(start, point, source) ? distance(start, point) : Infinity);
    const endCosts = waypoints.map(point => clear(point, end, target) ? distance(point, end) : Infinity);
    const previous = waypoints.map(() => -1), closed = waypoints.map(() => false);
    let best = Infinity, last = -1;
    while (true) {
      let current = -1, score = best;
      for (let i = 0; i < waypoints.length; i++) if (!closed[i] && costs[i] + distance(waypoints[i], end) < score) { current = i; score = costs[i] + distance(waypoints[i], end); }
      if (current === -1) break;
      closed[current] = true;
      if (costs[current] + endCosts[current] < best) { best = costs[current] + endCosts[current]; last = current; }
      for (const next of adjacency[current]) if (!closed[next.index] && costs[current] + next.cost < costs[next.index]) { costs[next.index] = costs[current] + next.cost; previous[next.index] = current; }
    }
    if (last === -1) throw new Error(`Не удалось проложить связь ${source} → ${target}`);
    const result = [{ ...end }];
    for (let index = last; index !== -1; index = previous[index]) result.push({ ...waypoints[index] });
    result.push({ ...start }); return result.reverse();
  }
  const edges = relations.map(edge => {
    const points = route(edge.source, edge.target);
    const trim = (index: number, neighbour: number) => { const a = points[index], b = points[neighbour], length = distance(a, b); const scale = KNOWLEDGE_NODE.radius / length; points[index] = { x: a.x + (b.x - a.x) * scale, y: a.y + (b.y - a.y) * scale }; };
    trim(0, 1); trim(points.length - 1, points.length - 2);
    return { ...edge, points, path: roundedPath(points, 8) };
  });
  return edges;
}

/** Remove only redundant drawings; every original prerequisite stays in the catalog. */
export function essentialRelations(catalog: KnowledgeCatalog) {
  const outgoing = new Map(catalog.topics.map(topic => [topic.id, catalog.relations.filter(edge => edge.source === topic.id).map(edge => edge.target)]));
  return catalog.relations.filter(edge => {
    const visited = new Set<string>();
    const queue = (outgoing.get(edge.source) ?? []).filter(id => id !== edge.target);
    while (queue.length) {
      const id = queue.pop()!;
      if (id === edge.target) return false;
      if (visited.has(id)) continue;
      visited.add(id); queue.push(...outgoing.get(id) ?? []);
    }
    return true;
  });
}

export async function layoutKnowledgeGraph(catalog: KnowledgeCatalog): Promise<KnowledgeLayout> {
  const { default: ELK } = await import('elkjs/lib/elk.bundled.js');
  const elk = new ELK();
  const relations = essentialRelations(catalog);
  const levels: Record<string, number> = {};
  const byId = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const levelOf = (id: string): number => levels[id] ??= Math.max(-1, ...byId.get(id)!.prerequisites.map(levelOf)) + 1;
  catalog.topics.forEach(topic => levelOf(topic.id));
  const graph: ElkNode = {
    id: 'competency-map',
    layoutOptions: {
      'elk.algorithm': 'layered', 'elk.direction': 'DOWN', 'elk.edgeRouting': 'ORTHOGONAL',
      'elk.spacing.nodeNode': '80', 'elk.layered.spacing.nodeNodeBetweenLayers': '110',
      'elk.layered.spacing.edgeNodeBetweenLayers': '28', 'elk.spacing.edgeNode': '30',
      'elk.spacing.edgeEdge': '20', 'elk.layered.spacing.edgeEdgeBetweenLayers': '22',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.layering.strategy': 'LONGEST_PATH_SOURCE',
      'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
      'elk.layered.crossingMinimization.forceNodeModelOrder': catalog.roles.length > 1 ? 'true' : 'false',
      'elk.layered.mergeEdges': 'true', 'elk.randomSeed': '17',
      'elk.padding': '[top=50,left=60,bottom=50,right=60]',
    },
    children: catalog.topics.map(topic => ({ id: topic.id, width: KNOWLEDGE_NODE.width, height: KNOWLEDGE_NODE.height,
      layoutOptions: { 'elk.portConstraints': 'FIXED_SIDE' },
      ports: [{ id: topic.id + ':in', width: 0, height: 0, layoutOptions: { 'elk.port.side': 'NORTH' } },
        { id: topic.id + ':out', width: 0, height: 0, layoutOptions: { 'elk.port.side': 'SOUTH' } }] })),
    edges: relations.map(edge => ({ id: edge.id, sources: [edge.source + ':out'], targets: [edge.target + ':in'] })),
  };
  const result = await elk.layout(graph);
  const positions: Record<string, Point> = Object.fromEntries(result.children!.map(node => [node.id, { x: node.x! + node.width! / 2, y: node.y! + node.height! / 2 }]));
  const edges = result.edges!.map(edge => {
    const original = relations.find(item => item.id === edge.id)!;
    const section = edge.sections![0];
    const points = [section.startPoint, ...section.bendPoints ?? [], section.endPoint].map(point => ({ ...point }));
    // Ports are on the node's outer box; extend through its padding to the circle.
    points[0].y -= KNOWLEDGE_NODE.height / 2 - KNOWLEDGE_NODE.radius;
    points.at(-1)!.y += KNOWLEDGE_NODE.height / 2 - KNOWLEDGE_NODE.radius;
    return { id: edge.id, source: original.source, target: original.target, points,
      path: roundedPath(points) };
  });
  return { positions, edges, width: result.width!, height: result.height!, levels };
}
