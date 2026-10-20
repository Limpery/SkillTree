import { projectLearningPath, projectOverview } from './layout.ts';

export type Point = { x: number; y: number };
export type Topic = {
  id: string; label: string; short: string; description: string;
  kind: 'foundation' | 'technology' | 'role'; groupId?: string;
  prerequisites: string[]; position: Point; synthetic?: boolean;
};
export type TopicGroup = {
  id: string; label: string; short: string; description: string;
  kind: 'foundation' | 'shared' | 'direction'; position: Point;
};
export type Requirement = { id: string; mode: 'all' | 'one'; topics: string[] };
export type Role = { id: string; groupId: string; aliases: string[]; requirements: Requirement[]; learningOrder?: string[] };
export type Relation = { id: string; source: string; target: string; kind: 'prerequisite' | 'requirement' };
export type Catalog = { topics: Topic[]; groups: TopicGroup[]; roles: Role[]; relations: Relation[] };
export type Plan = { roleId: string; topicIds: string[]; decisions: { requirementId: string; selected: string }[] };
export type VisibleNode = {
  id: string; label: string; short: string; kind: Topic['kind'] | 'group';
  position: Point; groupId?: string; count?: number; active: boolean; step?: number; labelPosition?: 'right' | 'left' | 'above' | 'below';
};
export type VisibleEdge = { id: string; source: string; target: string; kind: 'direction' | 'learning-step' | Relation['kind']; active: boolean; originalIds: string[]; path?: string };
export type ViewOptions = { expandedGroups: Set<string>; roleId?: string; selectedId?: string; allRelations?: boolean };

export function planForRole(catalog: Catalog, roleId: string, known = new Set<string>(), choices: Record<string, string> = {}): Plan {
  const role = catalog.roles.find(item => item.id === roleId);
  if (!role) throw new Error('Неизвестная специальность: ' + roleId);
  const topics = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const visited = new Set<string>(), visiting = new Set<string>(), ordered: string[] = [];
  const decisions: Plan['decisions'] = [];
  function visit(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Цикл обязательных зависимостей: ' + id);
    const topic = topics.get(id);
    if (!topic || topic.kind === 'role') throw new Error('Неизвестная технология: ' + id);
    visiting.add(id); topic.prerequisites.forEach(visit); visiting.delete(id);
    visited.add(id); ordered.push(id);
  }
  for (const requirement of role.requirements) {
    if (requirement.mode === 'all') requirement.topics.forEach(visit);
    else {
      const explicit = choices[requirement.id];
      if (explicit && !requirement.topics.includes(explicit)) throw new Error('Недопустимый вариант: ' + explicit);
      const selected = explicit || requirement.topics.find(id => known.has(id)) || requirement.topics[0];
      if (!selected) throw new Error('Пустая группа альтернатив');
      decisions.push({ requirementId: requirement.id, selected }); visit(selected);
    }
  }
  if (role.learningOrder?.length) {
    // Learning order is a preference, not a fabricated prerequisite between unrelated topics.
    const preference = new Map(role.learningOrder.map((id, index) => [id, index]));
    const priority = (id: string, seen = new Set<string>()): number => {
      if (preference.has(id)) return preference.get(id)!;
      if (seen.has(id)) return Number.MAX_SAFE_INTEGER;
      seen.add(id);
      return Math.min(...ordered.filter(other => topics.get(other)!.prerequisites.includes(id)).map(other => priority(other, new Set(seen))), Number.MAX_SAFE_INTEGER);
    };
    const pending = new Set(ordered), completed = new Set<string>();
    const result: string[] = [];
    while (pending.size) {
      const available = [...pending].filter(id => topics.get(id)!.prerequisites.every(parent => completed.has(parent)));
      available.sort((a, b) => priority(a) - priority(b) || ordered.indexOf(a) - ordered.indexOf(b));
      if (!available.length) throw new Error('Цикл обязательных зависимостей');
      const next = available[0]; pending.delete(next); completed.add(next); result.push(next);
    }
    return { roleId, topicIds: result, decisions };
  }
  return { roleId, topicIds: ordered, decisions };
}

export function relatedRoles(catalog: Catalog, topicId: string): string[] {
  const byId = new Map(catalog.topics.map(topic => [topic.id, topic]));
  function includes(id: string, visited = new Set<string>()): boolean {
    if (id === topicId) return true;
    if (visited.has(id)) return false;
    visited.add(id);
    return byId.get(id)?.prerequisites.some(parent => includes(parent, visited)) ?? false;
  }
  return catalog.roles.filter(role => role.requirements.some(requirement => requirement.topics.some(id => includes(id)))).map(role => role.id);
}

export function projectCatalog(catalog: Catalog, options: ViewOptions): { nodes: VisibleNode[]; edges: VisibleEdge[]; plan?: Plan } {
  if (options.roleId) return projectLearningPath(catalog, planForRole(catalog, options.roleId));
  const expanded = new Set(options.expandedGroups);
  const selected = catalog.topics.find(topic => topic.id === options.selectedId);
  if (selected?.groupId) expanded.add(selected.groupId);
  return projectOverview(catalog, expanded, options.selectedId, options.selectedId ? relatedRoles(catalog, options.selectedId) : []);
}

export function validateCatalog(catalog: Catalog): void {
  const ids = catalog.topics.map(topic => topic.id);
  if (new Set(ids).size !== ids.length) throw new Error('Повторяющийся ID технологии');
  const groups = new Set(catalog.groups.map(group => group.id));
  if (groups.size !== catalog.groups.length) throw new Error('Повторяющийся ID группы');
  for (const topic of catalog.topics) {
    if (topic.groupId && !groups.has(topic.groupId)) throw new Error('Неизвестная группа');
    for (const id of topic.prerequisites) if (!ids.includes(id)) throw new Error('Отсутствует предпосылка: ' + id);
  }
  const byId = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const visited = new Set<string>(), visiting = new Set<string>();
  function checkCycle(id: string) {
    if (visited.has(id)) return;
    if (visiting.has(id)) throw new Error('Цикл обязательных зависимостей: ' + id);
    visiting.add(id); byId.get(id)!.prerequisites.forEach(checkCycle); visiting.delete(id); visited.add(id);
  }
  catalog.topics.forEach(topic => checkCycle(topic.id));
  for (const role of catalog.roles) {
    if (!ids.includes(role.id)) throw new Error('Отсутствует специальность');
    if (!groups.has(role.groupId)) throw new Error('Неизвестная группа специальности');
    for (const id of role.learningOrder ?? []) if (!ids.includes(id)) throw new Error('Неизвестный шаг обучения: ' + id);
    for (const requirement of role.requirements) for (const id of requirement.topics)
      if (!ids.includes(id)) throw new Error('Отсутствует требование: ' + id);
    planForRole(catalog, role.id);
  }
}
