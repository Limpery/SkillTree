import type { Catalog, Plan, Point, VisibleEdge, VisibleNode } from './index.ts';

export const STEP_SPACING = 220;
const BRANCH_RADIUS = 900;

const offset = (point: Point, direction: Point, distance: number): Point =>
  ({ x: point.x + direction.x * distance, y: point.y + direction.y * distance });

export function branchDirection(index: number, count: number): Point {
  const angle = -Math.PI / 2 + index * 2 * Math.PI / count;
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

/** Stable radial lanes. Expanding a lane never moves technologies into another lane. */
export function arrangeCatalog(catalog: Catalog): void {
  const branches = catalog.groups.filter(group => group.kind !== 'foundation');
  for (const group of catalog.groups) {
    const members = catalog.topics.filter(topic => topic.groupId === group.id);
    const direction = branchDirection(branches.indexOf(group), branches.length);
    group.position = group.kind === 'foundation' ? { x: 0, y: 0 } : offset({ x: 0, y: 0 }, direction, BRANCH_RADIUS);
    members.forEach((topic, index) => {
      topic.position = group.kind === 'foundation'
        ? { x: 0, y: (index - (members.length - 1) / 2) * STEP_SPACING }
        : offset(group.position, direction, index * STEP_SPACING);
    });
  }
}

function connect(nodes: Map<string, VisibleNode>, source: string, target: string, active: boolean, kind: VisibleEdge['kind']): VisibleEdge {
  const a = nodes.get(source)!.position, b = nodes.get(target)!.position;
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  const direction = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
  const start = offset(a, direction, 57), end = offset(b, direction, -62);
  return { id: `view:${kind}:${source}>${target}`, source, target, active, kind, originalIds: [],
    path: `M ${start.x} ${start.y} L ${end.x} ${end.y}` };
}

export function projectLearningPath(catalog: Catalog, plan: Plan): { nodes: VisibleNode[]; edges: VisibleEdge[]; plan: Plan } {
  const byId = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const ids = [...plan.topicIds, plan.roleId];
  const nodes: VisibleNode[] = ids.map((id, index) => {
    const topic = byId.get(id)!;
    return { id, label: topic.label, short: topic.short, kind: topic.kind, groupId: topic.groupId,
      position: { x: 0, y: index * STEP_SPACING }, active: true, step: index + 1, labelPosition: 'right' };
  });
  const visible = new Map(nodes.map(node => [node.id, node]));
  const edges = ids.slice(1).map((id, index) => connect(visible, ids[index], id, true, 'learning-step'));
  return { nodes, edges, plan };
}

/** Overview is a display tree. Cross-branch prerequisites remain in the catalog. */
export function projectOverview(catalog: Catalog, expanded: Set<string>, selectedId?: string, related: string[] = []): { nodes: VisibleNode[]; edges: VisibleEdge[] } {
  const nodes: VisibleNode[] = [], edges: VisibleEdge[] = [];
  const visible = new Map<string, VisibleNode>();
  const add = (node: VisibleNode) => { nodes.push(node); visible.set(node.id, node); };
  const members = new Map(catalog.groups.map(group => [group.id, catalog.topics.filter(topic => topic.groupId === group.id)]));
  const foundation = catalog.groups.find(group => group.kind === 'foundation')!;
  const rootMembers = members.get(foundation.id)!;
  const rootIds = expanded.has(foundation.id) ? rootMembers.map(topic => topic.id) : ['group:' + foundation.id];
  const branches = catalog.groups.filter(group => group.kind !== 'foundation');
  const branchEnds = new Map<string, string>();
  const branchActive = new Set(catalog.roles.filter(role => related.includes(role.id)).map(role => role.groupId));
  const addEdge = (source: string, target: string, active = false) => edges.push(connect(visible, source, target, active, 'direction'));

  for (const group of catalog.groups) {
    const topics = members.get(group.id)!;
    const direction = branchDirection(branches.indexOf(group), branches.length);
    const labelPosition = Math.abs(direction.y) > Math.abs(direction.x) || group.kind === 'foundation' ? 'right' : 'below';
    const active = group.kind === 'foundation' ? Boolean(selectedId) : branchActive.has(group.id) || topics.some(topic => topic.id === selectedId);
    if (expanded.has(group.id)) {
      for (const topic of topics) add({ id: topic.id, label: topic.label, short: topic.short, kind: topic.kind,
        position: topic.position, groupId: group.id, labelPosition, active: topic.id === selectedId });
      topics.slice(1).forEach((topic, index) => addEdge(topics[index].id, topic.id, active));
      branchEnds.set(group.id, topics.at(-1)!.id);
    } else {
      add({ id: 'group:' + group.id, label: group.label, short: group.short, kind: 'group', position: group.position,
        groupId: group.id, count: topics.length,
        labelPosition: group.kind === 'foundation' ? 'below' : Math.abs(direction.x) < .05 ? 'above' : direction.x < 0 ? 'left' : 'right', active });
      branchEnds.set(group.id, 'group:' + group.id);
    }
  }
  for (const group of branches) {
    const start = expanded.has(group.id) ? members.get(group.id)![0].id : 'group:' + group.id;
    // The outermost foundation node facing this branch prevents a line through its neighbours.
    const root = [...rootIds].sort((a, b) => {
      const x = visible.get(a)!.position, y = visible.get(b)!.position;
      return Math.hypot(x.x - group.position.x, x.y - group.position.y) - Math.hypot(y.x - group.position.x, y.y - group.position.y);
    })[0];
    addEdge(root, start, branchActive.has(group.id));
  }
  for (const role of catalog.roles) {
    const topic = catalog.topics.find(topic => topic.id === role.id)!;
    const group = catalog.groups.find(group => group.id === role.groupId)!;
    const direction = branchDirection(branches.indexOf(group), branches.length);
    const peers = catalog.roles.filter(item => item.groupId === role.groupId);
    const tangent = (peers.indexOf(role) - (peers.length - 1) / 2) * 700;
    const endId = branchEnds.get(group.id)!;
    const end = visible.get(endId)!.position;
    const outward = offset(end, direction, 600);
    add({ id: role.id, label: topic.label, short: topic.short, kind: 'role', active: related.includes(role.id),
      position: { x: outward.x - direction.y * tangent, y: outward.y + direction.x * tangent },
      labelPosition: outward.x < 0 ? 'left' : 'right' });
    addEdge(endId, role.id, related.includes(role.id));
  }
  return { nodes, edges };
}
