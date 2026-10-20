import { planForRole, validateCatalog } from './index.ts';
import { MIDDLE_REACT_ROLE, type KnowledgeCatalog } from './middle-react.ts';
import { assembleVertices, type Vertex, type VertexGroup } from './vertex.ts';
import { createEnvironmentVertices } from './nodes/environment.ts';
import { createWebVertices } from './nodes/web.ts';
import { createLanguageVertices } from './nodes/language.ts';
import { createNetworkVertices } from './nodes/network.ts';
import { createFrameworksVertices } from './nodes/frameworks.ts';
import { createApplicationsVertices } from './nodes/applications.ts';
import { createQualityVertices } from './nodes/quality.ts';
import { createDeliveryVertices } from './nodes/delivery.ts';
import { createPracticeVertices } from './nodes/practice.ts';
import { stages, roles, vertexGroups } from './nodes/metadata.ts';

export { Vertex } from './vertex.ts';
export type { VertexGroup, VertexInput } from './vertex.ts';
export const MIDDLE_VUE_ROLE = 'role:middle-vue';
export type TrackId = 'react' | 'vue';
export type FrontendTrack = { id: TrackId; label: string; roleId: string; entryId: string };
export type FrontendCatalog = KnowledgeCatalog & { tracks: FrontendTrack[]; vertices: Vertex[]; vertexGroups: VertexGroup[] };

/** Main assembly point. Content is authored by subject in nodes/*.ts, without difficulty levels. */
export function createFrontendCatalog(): FrontendCatalog {
  const vertices = [...createEnvironmentVertices(), ...createWebVertices(), ...createLanguageVertices(), ...createNetworkVertices(), ...createFrameworksVertices(), ...createApplicationsVertices(), ...createQualityVertices(), ...createDeliveryVertices(), ...createPracticeVertices()];
  const groups = vertexGroups.map(group => ({ ...group, members: [...group.members] }));
  const relations = assembleVertices(vertices, groups);
  const catalog: FrontendCatalog = {
    vertices, vertexGroups: groups, topics: vertices.map(vertex => vertex.toTopic(roles.some(role => role.id === vertex.id))), relations,
    stages: stages.map(stage => ({ ...stage })), roles: structuredClone(roles),
    groups: stages.map(stage => ({ id: stage.id, label: stage.title, short: stage.short, description: stage.title,
      kind: stage.id === 'foundation' ? 'foundation' : 'direction', position: { x: 0, y: 0 } })),
    tracks: [{ id: 'react', label: 'React · Middle', roleId: MIDDLE_REACT_ROLE, entryId: 'react' }, { id: 'vue', label: 'Vue · Middle', roleId: MIDDLE_VUE_ROLE, entryId: 'vue' }],
  };
  validateCatalog(catalog);
  return catalog;
}

export function trackMembership(catalog: FrontendCatalog): Map<string, TrackId[]> {
  const membership = new Map(catalog.topics.map(topic => [topic.id, [] as TrackId[]]));
  for (const track of catalog.tracks) for (const id of [...planForRole(catalog, track.roleId).topicIds, track.roleId]) membership.get(id)!.push(track.id);
  return membership;
}
