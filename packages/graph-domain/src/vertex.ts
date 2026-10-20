import type { Relation } from './index.ts';
import type { KnowledgeTopic, Material } from './middle-react.ts';

export type VertexInput = {
  id: string; label: string; short: string; stageId: string;
  description: string; outcome: string; prerequisites: readonly string[];
  resources: readonly Readonly<Material>[]; groupingId?: string;
};
export type VertexGroup = {
  id: string; label: string; short: string; members: readonly string[];
};
export type VertexConnections = { readonly incoming: readonly Readonly<Relation>[]; readonly outgoing: readonly Readonly<Relation>[] };
const connections = new WeakMap<Vertex, VertexConnections>();

/** Domain entity; React components and coordinates are separate from this model. */
export class Vertex {
  readonly #data: Readonly<VertexInput>;
  constructor(data: VertexInput) {
    if (!data) throw new Error('Отсутствуют данные вершины');
    for (const key of ['id', 'label', 'short', 'stageId', 'description', 'outcome'] as const)
      if (typeof data[key] !== 'string' || !data[key].trim()) throw new Error('Пустое поле вершины: ' + key);
    if (!Array.isArray(data.prerequisites) || data.prerequisites.some(id => typeof id !== 'string' || !id) || new Set(data.prerequisites).size !== data.prerequisites.length)
      throw new Error('Некорректные связи вершины: ' + data.id);
    if (!Array.isArray(data.resources) || data.resources.some(item => !item || typeof item.title !== 'string' || typeof item.url !== 'string'))
      throw new Error('Некорректные материалы вершины: ' + data.id);
    if (data.groupingId !== undefined && (typeof data.groupingId !== 'string' || !data.groupingId.trim())) throw new Error('Пустой идентификатор группировки');
    this.#data = Object.freeze({ id: data.id, label: data.label, short: data.short, stageId: data.stageId, description: data.description,
      outcome: data.outcome, groupingId: data.groupingId, prerequisites: Object.freeze([...data.prerequisites]), resources: Object.freeze(data.resources.map(item => Object.freeze({ title: item.title, url: item.url }))) });
    Object.freeze(this);
  }
  get id() { return this.#data.id; }
  get label() { return this.#data.label; }
  get short() { return this.#data.short; }
  get stageId() { return this.#data.stageId; }
  get description() { return this.#data.description; }
  get outcome() { return this.#data.outcome; }
  get resources() { return this.#data.resources; }
  get groupingId() { return this.#data.groupingId; }
  get prerequisites() { return this.#data.prerequisites; }
  get connections(): VertexConnections {
    const value = connections.get(this);
    if (!value) throw new Error('Вершина ещё не включена в граф: ' + this.id);
    return value;
  }
  toJSON(): VertexInput { return { ...this.#data, prerequisites: [...this.prerequisites], resources: this.#data.resources.map(item => ({ ...item })) }; }
  /** Adapter for existing curriculum algorithms; DTO edits cannot mutate the entity. */
  toTopic(specialty = false): KnowledgeTopic {
    const { groupingId: _groupingId, ...data } = this.toJSON();
    return { ...data, prerequisites: [...data.prerequisites], resources: data.resources.map(item => ({ ...item })),
      kind: specialty ? 'role' : !data.prerequisites.length ? 'foundation' : 'technology', practice: data.id === 'middle-project' || data.id === 'vue-project', groupId: data.stageId, position: { x: 0, y: 0 } };
  }
}

/** Prerequisite IDs are the single source of truth for both incoming and outgoing links. */
export function assembleVertices(vertices: Vertex[], groups: readonly VertexGroup[]): Relation[] {
  const byId = new Map(vertices.map(vertex => [vertex.id, vertex]));
  if (byId.size !== vertices.length) throw new Error('Повторный идентификатор вершины');
  if (vertices.some(vertex => connections.has(vertex))) throw new Error('Вершина уже включена в граф');
  const relations: Relation[] = [];
  for (const vertex of vertices) for (const id of vertex.prerequisites) {
    const parent = byId.get(id);
    if (!parent) throw new Error('Неизвестная связанная вершина: ' + id);
    relations.push({ id: id + '>' + vertex.id, source: id, target: vertex.id, kind: 'prerequisite' });
  }
  const visited = new Set<string>(), visiting = new Set<string>();
  function visit(vertex: Vertex) {
    if (visiting.has(vertex.id)) throw new Error('Цикл зависимостей: ' + vertex.id);
    if (visited.has(vertex.id)) return;
    visiting.add(vertex.id); vertex.prerequisites.forEach(id => visit(byId.get(id)!));
    visiting.delete(vertex.id); visited.add(vertex.id);
  }
  vertices.forEach(visit);
  const memberOf = new Map<string, string>(), groupIds = new Set<string>();
  for (const group of groups) {
    if (groupIds.has(group.id) || byId.has(group.id)) throw new Error('Повторный идентификатор группы: ' + group.id);
    groupIds.add(group.id);
    if (group.members.length < 2) throw new Error('Группа должна содержать минимум две вершины');
    for (const id of group.members) {
      const vertex = byId.get(id);
      if (!vertex) throw new Error('Неизвестная вершина группы: ' + id);
      if (memberOf.has(id)) throw new Error('Вершина включена в группу повторно: ' + id);
      if (vertex.groupingId !== group.id) throw new Error('Поле groupingId не соответствует группе: ' + id);
      memberOf.set(id, group.id);
    }
  }
  for (const vertex of vertices) if (vertex.groupingId !== memberOf.get(vertex.id)) throw new Error('Не найдена группировка вершины: ' + vertex.id);
  const frozenRelations = relations.map(edge => Object.freeze({ ...edge }));
  for (const vertex of vertices) connections.set(vertex, Object.freeze({
    incoming: Object.freeze(frozenRelations.filter(edge => edge.target === vertex.id)),
    outgoing: Object.freeze(frozenRelations.filter(edge => edge.source === vertex.id)),
  }));
  return relations;
}
