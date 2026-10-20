import { planForRole, type Point, type Relation } from './index.ts';
import type { CareerCatalog } from './frontend-catalog.ts';
import type { KnowledgeTopic } from './middle-react.ts';
import { KNOWLEDGE_NODE, type KnowledgeEdge } from './knowledge-layout.ts';
import { learningBlocks } from './career-curriculum.ts';

export const START_NODE_ID = 'map:start';
export const CAREER_SPACING = { step: 300, parallel: KNOWLEDGE_NODE.radius * 2 + 64, scatter: 30, maxLinkLength: 640 } as const;
export const CAREER_FLOAT = { radius: 8, minPeriodMs: 14000, maxPeriodMs: 22000, fadeInMs: 2000 } as const;
export type CareerNode = { id: string; label: string; short: string; memberIds: string[]; topic?: KnowledgeTopic; careerId?: string; start?: boolean; count?: number; depth: number };
export type CareerRelation = Relation & { originalRelations: Relation[]; navigation?: boolean };
export type CareerStep = { id: string; source: string; target: string; kind: 'navigation' | 'learning-step' };
export type SceneBounds = { x: number; y: number; width: number; height: number };
export type CareerScene = {
  roleId?: string; nodes: CareerNode[]; edges: KnowledgeEdge[]; connections: CareerRelation[]; steps: CareerStep[];
  positions: Record<string, Point>; nodeIdByTopic: Map<string, string>; bounds: SceneBounds; topicCount: number;
};

/** Visual offsets never alter the stored layout; nodes and straight edges share one frame. */
export function createCareerFloat(scene: CareerScene) {
  const unit = (key: string) => (noise(key) + 1) / 2;
  const orbits = scene.nodes.map(node => ({
    id: node.id, anchor: scene.positions[node.id],
    radius: CAREER_FLOAT.radius * (.65 + .35 * unit(node.id + ':radius')),
    period: CAREER_FLOAT.minPeriodMs + (CAREER_FLOAT.maxPeriodMs - CAREER_FLOAT.minPeriodMs) * unit(node.id + ':period'),
    phase: unit(node.id + ':phase') * Math.PI * 2,
    direction: unit(node.id + ':direction') < .5 ? -1 : 1,
    ellipse: .6 + .3 * unit(node.id + ':ellipse'),
  }));
  return (elapsedMs: number): Pick<CareerScene, 'positions' | 'edges'> => {
    const time = Math.max(0, elapsedMs);
    const fade = Math.sin(Math.min(1, time / CAREER_FLOAT.fadeInMs) * Math.PI / 2) ** 2;
    const positions: Record<string, Point> = {};
    for (const orbit of orbits) {
      const angle = orbit.phase + orbit.direction * time * Math.PI * 2 / orbit.period;
      positions[orbit.id] = {
        x: orbit.anchor.x + Math.cos(angle) * orbit.radius * fade,
        y: orbit.anchor.y + Math.sin(angle) * orbit.radius * orbit.ellipse * fade,
      };
    }
    return { positions, edges: scene.steps.map(edge => straightConnection(edge, positions)) };
  };
}

function boundsOf(positions: Record<string, Point>): SceneBounds {
  const values = Object.values(positions), margin = KNOWLEDGE_NODE.width / 2 + 50;
  const x = Math.min(...values.map(p => p.x)) - margin, y = Math.min(...values.map(p => p.y)) - margin;
  return { x, y, width: Math.max(...values.map(p => p.x)) - x + margin, height: Math.max(...values.map(p => p.y)) - y + margin };
}

/** Fits the actual scene, including labels, rather than a fixed catalogue size. */
export function fitCareerScene(bounds: SceneBounds, width: number, height: number, padding = { top: 100, bottom: 70 }) {
  const zoom = Math.max(.02, Math.min(.95, Math.max(100, width - 90) / bounds.width, Math.max(100, height - padding.top - padding.bottom) / bounds.height));
  return { x: width / 2 - (bounds.x + bounds.width / 2) * zoom, y: (height + padding.top - padding.bottom) / 2 - (bounds.y + bounds.height / 2) * zoom, zoom };
}

/** The overview contains only Start and real specialties. A scene contains one full career path. */
export async function createCareerScene(catalog: CareerCatalog, roleId?: string): Promise<CareerScene> {
  if (roleId && !catalog.roles.some(role => role.id === roleId)) throw new Error('Неизвестная специальность: ' + roleId);
  const topics = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const nodes: CareerNode[] = [{ id: START_NODE_ID, label: 'Начало', short: 'SkillTree', memberIds: [], start: true, depth: 0 }];
  const positions: Record<string, Point> = { [START_NODE_ID]: { x: 0, y: 0 } };
  const navigation: CareerRelation[] = [];
  const nodeIdByTopic = new Map<string, string>();
  for (const [index, role] of catalog.roles.entries()) {
    const angle = Math.PI + index * 2 * Math.PI / catalog.roles.length;
    const topic = topics.get(role.id)!;
    const short = catalog.tracks.find(track => track.roleId === role.id)?.label.replace(/^(.*?) · Middle$/, 'Middle $1') ?? topic.short;
    nodes.push({ id: role.id, label: topic.label, short, memberIds: [role.id], topic, careerId: role.id, count: planForRole(catalog, role.id).topicIds.length, depth: 0 });
    positions[role.id] = { x: Math.cos(angle) * 300, y: Math.sin(angle) * 300 };
    navigation.push({ id: START_NODE_ID + '>' + role.id, source: START_NODE_ID, target: role.id, kind: 'requirement', navigation: true, originalRelations: [] });
    nodeIdByTopic.set(role.id, role.id);
  }
  const steps: CareerStep[] = navigation.map(edge => ({ id: edge.id, source: edge.source, target: edge.target, kind: 'navigation' }));
  if (!roleId) return { nodes, steps, edges: steps.map(edge => straightConnection(edge, positions)), connections: [], positions, nodeIdByTopic, bounds: boundsOf(positions), topicCount: 0 };

  const topicIds = planForRole(catalog, roleId).topicIds, allowed = new Set(topicIds);
  const blocks = learningBlocks(catalog, topicIds, roleId);
  for (const block of blocks) {
    for (const id of block.memberIds) nodeIdByTopic.set(id, block.id);
    nodes.push({ id: block.id, label: block.label, short: block.short, memberIds: block.memberIds, topic: topics.get(block.memberIds[0])!, depth: 0 });
  }
  const projectRelations = (relations: Relation[]) => {
    const result = new Map<string, CareerRelation>();
    for (const original of relations) if (allowed.has(original.source) && allowed.has(original.target)) {
      const source = nodeIdByTopic.get(original.source)!, target = nodeIdByTopic.get(original.target)!;
      if (source === target) continue;
      const id = source + '>' + target;
      const edge = result.get(id) ?? { id, source, target, kind: 'prerequisite', originalRelations: [] };
      edge.originalRelations.push(original); result.set(id, edge);
    }
    return [...result.values()];
  };
  const connections = projectRelations(catalog.relations);
  const detailNodes = nodes.filter(node => !node.start && !node.careerId);
  const indegree = new Map(detailNodes.map(node => [node.id, connections.filter(edge => edge.target === node.id).length]));
  const queue = detailNodes.filter(node => !indegree.get(node.id)).map(node => node.id), order: string[] = [];
  while (queue.length) {
    const id = queue.shift()!; order.push(id);
    for (const edge of connections.filter(edge => edge.source === id)) {
      indegree.set(edge.target, indegree.get(edge.target)! - 1);
      if (!indegree.get(edge.target)) queue.push(edge.target);
    }
  }
  if (order.length !== detailNodes.length) throw new Error('Учебные блоки образуют цикл: нужно изменить группировку');
  const preferred = new Map(blocks.map(block => [block.id, block.preferredStep]));
  const depth = new Map<string, number>();
  for (const id of order) {
    const afterPrerequisites = Math.max(0, ...connections.filter(edge => edge.target === id).map(edge => depth.get(edge.source)!)) + 1;
    depth.set(id, Math.max(preferred.get(id)!, afterPrerequisites));
  }
  const usedDepths = [...new Set(depth.values())].sort((a, b) => a - b);
  for (const node of detailNodes) node.depth = usedDepths.indexOf(depth.get(node.id)!) + 1;
  const layers = usedDepths.map((_value, index) => detailNodes.filter(node => node.depth === index + 1));
  let previous = [nodes.find(node => node.id === roleId)!];
  for (const layer of layers) {
    steps.push(...connectAdjacentSteps(previous, layer));
    previous = layer;
  }
  const anchor = positions[roleId];
  const angle = Math.atan2(anchor.y, anchor.x), forward = { x: Math.cos(angle), y: Math.sin(angle) }, side = { x: -forward.y, y: forward.x };
  positionLearningSteps(layers, positions, roleId, anchor, forward, side);
  const edges = steps.map(edge => straightConnection(edge, positions));
  return { roleId, nodes, edges, steps, connections, positions, nodeIdByTopic, bounds: boundsOf(positions), topicCount: allowed.size };
}

/** Every parallel block has both an entrance and an exit, without a complete bipartite mesh. */
function connectAdjacentSteps(previous: CareerNode[], next: CareerNode[]): CareerStep[] {
  const result: CareerStep[] = [];
  let source = 0, target = 0;
  while (true) {
    const a = previous[source].id, b = next[target].id;
    result.push({ id: 'step:' + a + '>' + b, source: a, target: b, kind: 'learning-step' });
    if (source === previous.length - 1 && target === next.length - 1) break;
    const advanceSource = (source + 1) * next.length, advanceTarget = (target + 1) * previous.length;
    if (advanceSource <= advanceTarget && source < previous.length - 1) source++;
    if (advanceTarget <= advanceSource && target < next.length - 1) target++;
  }
  return result;
}

/** Stable seeded offsets loosen the grid while keeping each topic after its prerequisites. */
function positionLearningSteps(layers: CareerNode[][], positions: Record<string, Point>, roleId: string, anchor: Point, forward: Point, side: Point) {
  for (const layer of layers) {
    const progress = layer[0].depth - 1;
    const bend = progress * 70 + Math.sin(progress * .7) * 130;
    const desired = layer.map((node, index) => ({ value: (index - (layer.length - 1) / 2) * (CAREER_SPACING.parallel + 28) + bend + noise(roleId + node.id + ':cross') * 52, weight: 1 }));
    const across = orderedSpacing(desired, CAREER_SPACING.parallel);
    layer.forEach((node, index) => {
      const along = node.depth * CAREER_SPACING.step + noise(roleId + node.id + ':along') * CAREER_SPACING.scatter;
      positions[node.id] = { x: anchor.x + forward.x * along + side.x * across[index], y: anchor.y + forward.y * along + side.y * across[index] };
    });
  }
}

function noise(id: string): number {
  let value = 2166136261;
  for (const character of id) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return (value >>> 0) / 0xffffffff * 2 - 1;
}

/** Weighted isotonic regression keeps the requested order with a guaranteed circle gap. */
function orderedSpacing(desired: { value: number; weight: number }[], gap: number): number[] {
  const blocks: { start: number; end: number; value: number; weight: number }[] = [];
  desired.forEach((item, index) => {
    blocks.push({ start: index, end: index, value: item.value - index * gap, weight: item.weight });
    while (blocks.length > 1 && blocks.at(-2)!.value > blocks.at(-1)!.value) {
      const right = blocks.pop()!, left = blocks.pop()!, weight = left.weight + right.weight;
      blocks.push({ start: left.start, end: right.end, weight, value: (left.value * left.weight + right.value * right.weight) / weight });
    }
  });
  const result: number[] = [];
  for (const block of blocks) for (let index = block.start; index <= block.end; index++) result[index] = block.value + index * gap;
  return result;
}

/** A single segment joins the circle boundaries along the line between their centres. */
function straightConnection(edge: CareerStep, positions: Record<string, Point>): KnowledgeEdge {
  const source = positions[edge.source], target = positions[edge.target];
  const dx = target.x - source.x, dy = target.y - source.y, distance = Math.hypot(dx, dy);
  if (distance <= KNOWLEDGE_NODE.radius * 2) throw new Error('Связанные вершины перекрываются: ' + edge.id);
  const inset = { x: dx / distance * KNOWLEDGE_NODE.radius, y: dy / distance * KNOWLEDGE_NODE.radius };
  const start = { x: source.x + inset.x, y: source.y + inset.y }, end = { x: target.x - inset.x, y: target.y - inset.y };
  return { ...edge, points: [start, end], path: `M ${start.x} ${start.y} L ${end.x} ${end.y}` };
}
