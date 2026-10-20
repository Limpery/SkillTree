import type { CareerCatalog } from './frontend-catalog.ts';
import { backendBlocks } from './backend-curriculum.ts';

export type LearningBlock = { id: string; label: string; short: string; memberIds: string[]; preferredStep: number };
export type BlockSpec = { id: string; step: number; members?: string[]; label?: string; short?: string };

// Presentation blocks and learning preferences do not add prerequisites to the catalogue.
const blocks: BlockSpec[] = [
  { id: 'group:environment', step: 1 },
  { id: 'programming', step: 1 },
  { id: 'group:web', step: 1, members: ['web-basics', 'http'], label: 'Как устроен веб', short: 'Web / HTTP' },
  { id: 'html', step: 2 },
  { id: 'group:css', step: 2 },
  { id: 'group:javascript', step: 3 },
  { id: 'group:language', step: 4, members: ['modules', 'js-deep', 'async'], label: 'Модули и асинхронность', short: 'JS+' },
  { id: 'group:typescript', step: 5 },
  { id: 'group:browser', step: 5, members: ['browser-api', 'security', 'debugging'], label: 'Браузер и безопасность', short: 'Browser' },
  { id: 'group:react', step: 6 },
  { id: 'group:vue', step: 6 },
  { id: 'group:api', step: 6, members: ['fetch', 'rest', 'typed-api'], label: 'Запросы и API', short: 'API' },
  { id: 'group:ui', step: 7, members: ['design-basics', 'accessibility', 'styling', 'design-system'], label: 'Интерфейс и UI-компоненты', short: 'UI / a11y' },
  { id: 'group:react-app', step: 7, members: ['router', 'global-state'], label: 'Приложение на React', short: 'Routes / Store' },
  { id: 'group:vue-app', step: 7, members: ['vue-router', 'vue-pinia'], label: 'Приложение на Vue', short: 'Router / Pinia' },
  { id: 'group:data', step: 8, members: ['server-state', 'forms', 'auth'], label: 'Данные и формы', short: 'Data / Forms' },
  { id: 'group:architecture', step: 8, members: ['architecture', 'ssr'], label: 'Архитектура и рендеринг', short: 'Arch / SSR' },
  { id: 'group:teamwork', step: 8, members: ['git-workflow', 'teamwork'], label: 'Командная работа', short: 'Team / Git' },
  { id: 'group:quality', step: 9, members: ['performance', 'resilience'], label: 'Надёжность и скорость', short: 'Quality' },
  { id: 'group:testing', step: 9, members: ['unit-tests', 'component-tests', 'e2e', 'vue-testing'] },
  { id: 'group:release', step: 10, members: ['build', 'ci', 'deploy'], label: 'Сборка и CI/CD', short: 'CI / CD' },
  { id: 'group:production', step: 11, members: ['observability', 'delivery'], label: 'Сопровождение и выпуск', short: 'Production' },
  { id: 'middle-project', step: 12 },
  { id: 'vue-project', step: 12 },
];

/** Each required topic belongs to exactly one block; tabs retain prerequisite order. */
export function learningBlocks(catalog: CareerCatalog, topicIds: string[], roleId?: string): LearningBlock[] {
  const allowed = new Set(topicIds), assigned = new Set<string>();
  const priority = new Map(topicIds.map((id, index) => [id, index]));
  const topics = new Map(catalog.topics.map(topic => [topic.id, topic]));
  const groups = new Map(catalog.vertexGroups.map(group => [group.id, group]));
  const result: LearningBlock[] = [];
  const track = catalog.tracks.find(track => track.roleId === roleId);
  const specs = track && !['react', 'vue'].includes(track.id) ? backendBlocks : blocks;
  for (const spec of specs) {
    const group = groups.get(spec.id), topic = topics.get(spec.id);
    const memberIds = (spec.members ?? group?.members ?? [spec.id]).filter(id => allowed.has(id));
    if (!memberIds.length) continue;
    for (const id of memberIds) {
      if (assigned.has(id)) throw new Error('Тема повторяется в учебных блоках: ' + id);
      assigned.add(id);
    }
    memberIds.sort((a, b) => priority.get(a)! - priority.get(b)!);
    result.push({ id: spec.id, label: spec.label ?? group?.label ?? topic!.label, short: spec.short ?? group?.short ?? topic!.short, memberIds, preferredStep: spec.step });
  }
  // Future catalogue additions remain visible until a dedicated block is authored.
  for (const id of topicIds) if (!assigned.has(id)) {
    const topic = topics.get(id)!;
    result.push({ id, label: topic.label, short: topic.short, memberIds: [id], preferredStep: 1 });
  }
  return result;
}
