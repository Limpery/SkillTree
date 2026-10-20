import { createFrontendCatalog, type CareerCatalog, type CareerTrack } from './frontend-catalog.ts';
import { assembleVertices, Vertex } from './vertex.ts';
import { validateCatalog, type Role } from './index.ts';
import { createBackendSharedVertices } from './nodes/backend-shared.ts';
import { createNodejsVertices } from './nodes/backend-nodejs.ts';
import { createPythonVertices } from './nodes/backend-python.ts';
import { createJavaVertices } from './nodes/backend-java.ts';

export const backendTracks: CareerTrack[] = [
  { id: 'nodejs', label: 'Node.js · Middle', roleId: 'role:middle-nodejs', entryId: 'nodejs' },
  { id: 'python', label: 'Python · Middle', roleId: 'role:middle-python', entryId: 'python' },
  { id: 'java', label: 'Java · Middle', roleId: 'role:middle-java', entryId: 'java' },
];

/** Full catalogue; the two-role frontend fixture remains available for historical layouts. */
export function createSkillCatalog(): CareerCatalog {
  const frontend = createFrontendCatalog();
  const stages = [...frontend.stages, { id: 'backend', title: 'Серверная разработка', short: 'Бэкенд' }, { id: 'backend-data', title: 'Базы данных и хранение', short: 'Данные' }];
  const tracks = [...frontend.tracks, ...backendTracks.map(track => ({ ...track }))];
  const roles: Role[] = [...frontend.roles, ...backendTracks.map(track => ({
    id: track.roleId, groupId: 'practice', aliases: [track.id, track.id === 'nodejs' ? 'node.js' : track.id, `${track.id} разработчик`, `middle ${track.id}`, `backend ${track.id}`, `бэкенд ${track.id}`],
    requirements: [{ id: track.id + ':all', mode: 'all' as const, topics: [track.id + '-project'] }],
  }))];
  // Recreate entities before assembly; immutable vertices belong to one assembled catalogue.
  const vertices = [...frontend.vertices.map(vertex => new Vertex(vertex.toJSON())), ...createBackendSharedVertices(), ...createNodejsVertices(), ...createPythonVertices(), ...createJavaVertices()];
  const vertexGroups = frontend.vertexGroups;
  const relations = assembleVertices(vertices, vertexGroups);
  const catalog: CareerCatalog = {
    vertices, vertexGroups, relations, roles, tracks, stages,
    topics: vertices.map(vertex => vertex.toTopic(roles.some(role => role.id === vertex.id))),
    groups: stages.map(stage => ({ id: stage.id, label: stage.title, short: stage.short, description: stage.title, kind: stage.id === 'foundation' ? 'foundation' : 'direction', position: { x: 0, y: 0 } })),
  };
  validateCatalog(catalog);
  return catalog;
}
