import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Background, Handle, MarkerType, Position, ReactFlow, useNodesInitialized, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import { ArrowUpRight, BookOpen, ChevronRight, Code2, Compass, ExternalLink, FolderKanban, GitBranch, GraduationCap, Layers, Maximize2, Minus, Network, Plus, Search, UserRound, Users, X } from 'lucide-react';
import type { KnowledgeTopic } from '@skilltree/graph-domain/middle-react';
import { createFrontendCatalog, trackMembership } from '@skilltree/graph-domain/frontend-catalog';
import { KNOWLEDGE_NODE } from '@skilltree/graph-domain/knowledge-layout';
import { fitCareerScene, type CareerNode } from '@skilltree/graph-domain/career-scene';
import { planForRole } from '@skilltree/graph-domain';
import { useCareerScene } from './useCareerScene';

type TopicNode = Node<{ item: CareerNode; selected: boolean; related: boolean; muted: boolean; active: boolean; branch: string }, 'knowledge'>;
const nodeOrigin: [number, number] = [.5, .5];
const nodeTypes = { knowledge: memo(KnowledgeNode) }, edgeTypes = { knowledge: memo(KnowledgeConnection) };
const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const motionDuration = (ms: number) => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
const word = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'тема' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'темы' : 'тем';
const modules = [
  { id: 'map', label: 'Карта', icon: Network },
  { id: 'graphs', label: 'Мои графы', icon: FolderKanban },
  { id: 'community', label: 'Сообщество', icon: Users },
  { id: 'courses', label: 'Курсы', icon: GraduationCap },
  { id: 'projects', label: 'Пет-проекты', icon: Code2 },
  { id: 'profile', label: 'Профиль', icon: UserRound },
] as const;
const currentModule = () => modules.find(module => window.location.hash === '#/' + module.id)?.id ?? 'map';

function KnowledgeNode({ data }: NodeProps<TopicNode>) {
  const { item } = data, hub = item.start || item.careerId;
  const style = { '--reveal-delay': `${Math.min(260, item.depth * 30)}ms` } as CSSProperties;
  return <div className={'knowledge-node branch-' + data.branch + (hub ? ' career-hub' : ' detail-node') + (item.start ? ' start-node' : '') + (item.careerId ? ' profession-node' : '') + (data.active ? ' is-active-career' : '') + (data.selected ? ' is-selected' : '') + (data.related ? ' is-related' : '') + (data.muted ? ' is-muted' : '') + (item.memberIds.length > 1 ? ' is-group' : '')} style={style} data-topic-id={item.id} data-member-ids={item.memberIds.join(',')} data-career-id={item.careerId} data-branch={data.branch}>
    <Handle type="target" position={Position.Left} className="knowledge-handle" isConnectable={false} />
    <button className="knowledge-orb nodrag" type="button" title={item.label} aria-label={item.label}>
      <span className="knowledge-symbol">{item.start ? <GitBranch size={28} /> : item.careerId ? <Compass size={28} /> : item.short}</span>
      <span className={'knowledge-title' + (item.label.split(/\s+/).some(part => part.length > 14) ? ' has-long-word' : '')}>{hub ? <><strong>{item.start ? 'Начало' : item.short}</strong><small>{item.start ? 'Выбери цель' : `${item.count} ${word(item.count!)}`}</small></> : item.label}</span>
      {!hub && item.memberIds.length > 1 && <span className="group-count"><Layers size={12} />{item.memberIds.length}</span>}
    </button>
    <Handle type="source" position={Position.Right} className="knowledge-handle" isConnectable={false} />
  </div>;
}
function KnowledgeConnection(props: EdgeProps) {
  return <path d={String(props.data?.path ?? '')} className="react-flow__edge-path" pathLength={1} markerEnd={props.markerEnd} style={{ '--reveal-delay': `${props.data?.delay ?? 0}ms`, strokeWidth: Number(props.data?.strokeWidth ?? 1.5) } as CSSProperties} />;
}

export function App() {
  const catalog = useMemo(createFrontendCatalog, []);
  const { scene, phase, requestedRoleId, error, switchTo } = useCareerScene(catalog);
  const topics = useMemo(() => new Map(catalog.topics.map(topic => [topic.id, topic])), [catalog]);
  const membership = useMemo(() => trackMembership(catalog), [catalog]);
  const plans = useMemo(() => new Map(catalog.roles.map(role => [role.id, new Set(planForRole(catalog, role.id).topicIds)])), [catalog]);
  const [selectedId, setSelectedId] = useState<string>();
  const [activeModule, setActiveModule] = useState(currentModule);
  const [query, setQuery] = useState(''), [searchOpen, setSearchOpen] = useState(false);
  const [zoom, setZoom] = useState(.6);
  const [tab, setTab] = useState<'overview' | 'connections'>('overview');
  const flow = useReactFlow<TopicNode>(), initialized = useNodesInitialized({ includeHiddenNodes: true });
  const graphElement = useRef<HTMLElement>(null), detailElement = useRef<HTMLElement>(null);
  const toolbarElement = useRef<HTMLDivElement>(null);
  const selectionVersion = useRef(0);
  const selected = selectedId ? topics.get(selectedId) : undefined;
  const selectedView = scene?.nodes.find(node => selectedId && node.memberIds.includes(selectedId));
  const selectedGroup = selectedView && selectedView.memberIds.length > 1 ? selectedView : undefined;
  const activePlan = scene?.roleId ? plans.get(scene.roleId) : undefined;
  const nextTopics = selected ? catalog.topics.filter(topic => topic.prerequisites.includes(selected.id) && activePlan?.has(topic.id)) : [];
  const neighbours = useMemo(() => {
    if (!scene || !selectedView) return undefined;
    const adjacent = new Set([selectedView.id, ...scene.steps.filter(step => step.source === selectedView.id || step.target === selectedView.id).flatMap(step => [step.source, step.target])]);
    return new Set(scene.nodes.filter(node => adjacent.has(node.id)).flatMap(node => node.memberIds));
  }, [scene, selectedView]);
  const fitScene = useCallback(() => {
    if (!scene || !graphElement.current) return;
    const { clientWidth, clientHeight } = graphElement.current;
    if (!clientWidth || !clientHeight) return;
    void flow.setViewport(fitCareerScene(scene.bounds, clientWidth, clientHeight), { duration: motionDuration(600) });
  }, [scene, flow]);
  const focusSelected = useCallback(() => {
    if (!selectedId || !scene || !graphElement.current || activeModule !== 'map' || phase !== 'idle') return;
    const id = scene.nodeIdByTopic.get(selectedId), point = id ? scene.positions[id] : undefined;
    if (!point) return;
    const canvas = graphElement.current.getBoundingClientRect(), toolbar = toolbarElement.current?.getBoundingClientRect();
    if (!canvas.width || !canvas.height) return;
    const left = 24, top = toolbar ? toolbar.bottom - canvas.top + 20 : 100;
    let right = canvas.width - 24, bottom = canvas.height - 76;
    const drawer = detailElement.current?.getBoundingClientRect();
    if (drawer) {
      if (drawer.width > canvas.width * .7) bottom = Math.min(bottom, drawer.top - canvas.top - 18);
      else right = Math.min(right, drawer.left - canvas.left - 18);
    }
    const width = Math.max(100, right - left), height = Math.max(100, bottom - top);
    const currentZoom = flow.getZoom();
    const nextZoom = Math.min(1, Math.max(.65, Number.isFinite(currentZoom) ? currentZoom : .65), width / 260, height / 260);
    void flow.setViewport({ x: left + width / 2 - point.x * nextZoom, y: top + height / 2 - point.y * nextZoom, zoom: nextZoom }, { duration: motionDuration(350) });
  }, [selectedId, scene, flow, phase, activeModule]);
  // Bounds are known before DOM measurement; fit once per scene to avoid camera restarts.
  useEffect(() => { if (scene && activeModule === 'map') fitScene(); }, [scene, fitScene, activeModule]);
  const resizeAction = useRef(fitScene);
  useEffect(() => { resizeAction.current = selectedId ? focusSelected : fitScene; }, [fitScene, focusSelected, selectedId]);
  useEffect(() => {
    const update = () => { setActiveModule(currentModule()); setSearchOpen(false); };
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  const closeTopic = useCallback(() => { selectionVersion.current++; setSelectedId(undefined); setSearchOpen(false); }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') closeTopic(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [closeTopic]);
  useEffect(() => {
    const element = graphElement.current; if (!element) return;
    let width = element.clientWidth, height = element.clientHeight, frame = 0;
    const observer = new ResizeObserver(() => {
      if (Math.abs(width - element.clientWidth) < 2 && Math.abs(height - element.clientHeight) < 2) return;
      width = element.clientWidth; height = element.clientHeight;
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => resizeAction.current());
    });
    observer.observe(element); return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);
  useEffect(() => { detailElement.current?.scrollTo({ top: 0 }); }, [selectedId]);
  const selectTopic = useCallback((id: string) => {
    setSelectedId(id); setTab('overview'); setQuery(''); setSearchOpen(false);
  }, []);
  const openCareer = useCallback(async (roleId?: string) => {
    const same = scene?.roleId === roleId;
    selectionVersion.current++; setSelectedId(undefined); setQuery(''); setSearchOpen(false);
    const changed = await switchTo(roleId);
    if (changed && same) resizeAction.current();
  }, [switchTo, scene]);
  const choose = useCallback(async (id: string) => {
    if (id === 'map:start') { await openCareer(); return; }
    if (catalog.roles.some(role => role.id === id)) { await openCareer(id); return; }
    const node = scene?.nodes.find(node => node.id === id);
    const topicId = topics.has(id) ? id : node?.memberIds[0]; if (!topicId) return;
    if (scene?.roleId && phase === 'idle' && scene.nodeIdByTopic.has(topicId)) { selectionVersion.current++; selectTopic(topicId); return; }
    const role = catalog.roles.find(role => role.id === requestedRoleId && plans.get(role.id)!.has(topicId)) ?? catalog.roles.find(role => plans.get(role.id)!.has(topicId)); if (!role) return;
    const version = ++selectionVersion.current;
    setSelectedId(undefined); setQuery(''); setSearchOpen(false);
    const changed = await switchTo(role.id);
    if (changed && version === selectionVersion.current) { setSelectedId(topicId); setTab('overview'); }
  }, [catalog, scene, topics, plans, openCareer, selectTopic, switchTo, phase, requestedRoleId]);
  // Focus in the unobscured part of the canvas after the in-map drawer has mounted.
  useEffect(() => {
    if (!selectedId || phase !== 'idle' || activeModule !== 'map') return;
    const frame = requestAnimationFrame(focusSelected);
    return () => cancelAnimationFrame(frame);
  }, [selectedId, phase, activeModule, focusSelected]);
  const searchResults = useMemo(() => {
    const text = normalize(query); if (!text) return [];
    const score = (topic: KnowledgeTopic) => Math.max(...[topic.label, topic.short, ...(catalog.roles.find(role => role.id === topic.id)?.aliases ?? [])].map(normalize).map(value => value === text ? 100 : value.startsWith(text) ? 60 : value.includes(text) ? 20 : 0));
    return catalog.topics.filter(topic => score(topic) > 0).sort((a, b) => score(b) - score(a)).slice(0, 7);
  }, [catalog, query]);
  const branchFor = useCallback((ids: string[]) => {
    const tracks = [...new Set(ids.flatMap(id => membership.get(id) ?? []))];
    return tracks.length === 1 ? tracks[0] : 'shared';
  }, [membership]);
  const displayNodes = useMemo<TopicNode[]>(() => scene?.nodes.map(item => ({
    id: item.id, type: 'knowledge', position: scene.positions[item.id], width: KNOWLEDGE_NODE.width, height: KNOWLEDGE_NODE.height,
    style: { width: KNOWLEDGE_NODE.width, height: KNOWLEDGE_NODE.height }, draggable: false, connectable: false, ariaLabel: item.label,
    data: { item, branch: branchFor(item.memberIds), active: item.careerId === scene.roleId && Boolean(scene.roleId), selected: Boolean(selectedId && item.memberIds.includes(selectedId)),
      related: item.memberIds.some(id => neighbours?.has(id)), muted: Boolean(neighbours) && !item.start && !item.careerId && !item.memberIds.some(id => neighbours?.has(id)) },
  })) ?? [], [scene, branchFor, selectedId, neighbours]);
  const displayEdges = useMemo<Edge[]>(() => scene ? scene.edges.map(edge => {
    const source = scene.nodes.find(node => node.id === edge.source)!, target = scene.nodes.find(node => node.id === edge.target)!;
    const navigation = scene.steps.find(step => step.id === edge.id)?.kind === 'navigation';
    const active = Boolean(selectedView && (edge.source === selectedView.id || edge.target === selectedView.id));
    const branch = branchFor(target.memberIds), color = branch === 'react' ? '#8ebbd8' : branch === 'vue' ? '#77c7ad' : '#9dbb82';
    return { id: edge.id, source: edge.source, target: edge.target, type: 'knowledge', selectable: false,
      data: { path: edge.path, delay: Math.min(260, target.depth * 30), strokeWidth: Math.max(1.5, (active ? 1.4 : .9) / zoom) },
      className: (source.start ? 'hub-edge' : 'detail-edge') + (navigation ? ' navigation-edge' : '') + (active ? ' is-path-active' : neighbours ? ' knowledge-edge-muted' : ''),
      markerEnd: navigation ? undefined : { type: MarkerType.ArrowClosed, color: active ? '#c9dfb2' : color, width: 10, height: 10 },
    };
  }) : [], [scene, selectedView, branchFor, neighbours, zoom]);
  const busy = !scene || !initialized || phase !== 'idle';
  const activeCareer = scene?.roleId ? topics.get(scene.roleId) : undefined;

  const module = modules.find(item => item.id === activeModule)!;
  return <div className="platform-shell">
    <header className="platform-header">
      <a className="brand" href="#/map" aria-label="SkillTree — главная" onClick={() => void openCareer()}><span className="brand-symbol"><GitBranch size={23} strokeWidth={1.8} /></span><span>skilltree<span className="brand-period">.</span></span></a>
      <nav className="platform-nav" aria-label="Модули платформы">{modules.map(item => <a key={item.id} href={'#/' + item.id} aria-current={activeModule === item.id ? 'page' : undefined}><item.icon size={17} /><span>{item.label}</span></a>)}</nav>
    </header>
    <div className="platform-content">
    <main className={'map-screen' + (activeModule !== 'map' ? ' is-inactive' : '')} aria-hidden={activeModule !== 'map'} inert={activeModule !== 'map'}>
      <section ref={graphElement} className={'career-map' + (scene?.roleId ? ' has-career' : '') + ' scene-' + phase + (zoom < .35 ? ' scene-overview' : '')} aria-label="Карта траектории" aria-busy={busy} data-active-career={scene?.roleId ?? ''} data-phase={phase}>
        <ReactFlow<TopicNode> colorMode="dark" nodes={displayNodes} edges={displayEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodeOrigin={nodeOrigin} onNodeClick={(_event, node) => void choose(node.id)} onPaneClick={closeTopic} onMove={(_event, viewport) => { if (Number.isFinite(viewport.zoom) && viewport.zoom > 0) setZoom(viewport.zoom); }} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false} minZoom={.02} maxZoom={1.5} panOnScroll zoomOnScroll={false} zoomOnDoubleClick={false}><Background gap={30} size={1} color="var(--graph-grid)" /></ReactFlow>
        <div ref={toolbarElement} className="map-toolbar">
          <div className="map-heading"><h1>{activeCareer?.label ?? 'Карта профессий'}</h1><nav className="track-nav" aria-label="Специальности"><button aria-pressed={!requestedRoleId} onClick={() => void openCareer()}><Compass size={15} />Специальности</button>{catalog.tracks.map(track => <button key={track.id} className={'track-' + track.id} aria-pressed={requestedRoleId === track.roleId} onClick={() => void openCareer(track.roleId)}><span className="track-dot" />{track.label}</button>)}</nav></div>
          <div className="search-wrap"><Search size={18} /><input aria-label="Найти компетенцию" placeholder="Профессия или технология…" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === 'Enter' && searchResults[0]) void choose(searchResults[0].id); if (event.key === 'Escape') setSearchOpen(false); }} />{query && <button className="search-clear" aria-label="Очистить поиск" onClick={() => { setQuery(''); setSearchOpen(false); }}><X size={15} /></button>}
            {searchOpen && query && <div className="search-results" role="listbox" aria-label="Результаты поиска">{searchResults.length ? searchResults.map(topic => <button role="option" aria-selected={false} key={topic.id} onClick={() => void choose(topic.id)}><BookOpen size={15} /><div>{topic.label}<small>{topic.kind === 'role' ? 'Специальность' : catalog.stages.find(stage => stage.id === topic.stageId)?.title}</small></div><ArrowUpRight size={14} /></button>) : <div className="search-empty">Ничего не найдено.</div>}</div>}
          </div>
        </div>
        {error && <div className="graph-message" role="alert">{error}</div>}
        {busy && <div className="scene-status" role="status" aria-live="polite">{phase === 'leaving' ? 'Скрываем траекторию…' : phase === 'entering' ? 'Раскрываем траекторию…' : 'Загружаем карту…'}</div>}
        <p className="map-hint">{scene?.roleId ? 'Выбери вершину, чтобы открыть материалы. Параллельные блоки входят в траекторию.' : 'Выбери специальность, чтобы открыть её траекторию.'}</p>
        <div className="viewport-controls"><button aria-label={scene?.roleId ? 'Вся траектория' : 'Вся карта'} title="Вписать в экран" onClick={() => { closeTopic(); fitScene(); }}><Maximize2 size={17} /></button><span className="control-divider" /><button aria-label="Отдалить" title="Отдалить" onClick={() => void flow.zoomOut({ duration: motionDuration(180) })}><Minus size={17} /></button><output aria-label="Масштаб">{Math.round(zoom * 100)}%</output><button aria-label="Приблизить" title="Приблизить" onClick={() => void flow.zoomIn({ duration: motionDuration(180) })}><Plus size={17} /></button></div>
        {selected && <aside ref={detailElement} className="node-drawer" aria-label="Карточка компетенции" data-testid="detail-panel">
          <header className="drawer-header"><div><h2 id="selected-title" data-testid="selected-title">{selected.label}</h2>{selectedGroup && <p>{selectedGroup.label}</p>}</div><button className="icon-button" onClick={closeTopic} aria-label="Закрыть карточку" title="Закрыть · Esc"><X size={19} /></button></header>
          <div className="drawer-content">
            {selectedGroup && <GroupTabs ids={selectedGroup.memberIds} topics={topics} selectedId={selected.id} choose={id => void choose(id)} />}
            <div id="group-topic-panel" role={selectedGroup ? 'tabpanel' : undefined} aria-labelledby={selectedGroup ? 'member-tab-' + selected.id : undefined}>
              <p className="detail-description">{selected.description}</p>
              <div className="detail-tabs" role="tablist" aria-label="Детали компетенции"><button role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>Обзор</button><button role="tab" aria-selected={tab === 'connections'} onClick={() => setTab('connections')}>Связи <span>{selected.prerequisites.length + nextTopics.length}</span></button></div>
              {tab === 'overview' && <><h3 className="detail-section-label">Что нужно уметь</h3><p className="competency-outcome">{selected.outcome}</p><h3 className="detail-section-label">Материалы</h3>{selected.resources.map(material => <a className="material-link" key={material.url} href={material.url} target="_blank" rel="noreferrer"><BookOpen size={15} /><span>{material.title}</span><ExternalLink size={13} /></a>)}</>}
              <h3 className="detail-section-label">Перед изучением</h3>{selected.prerequisites.length ? selected.prerequisites.map(id => <TopicLink key={id} topic={topics.get(id)!} choose={id => void choose(id)} />) : <p className="quiet-copy">Можно начинать без других тем.</p>}
              <h3 className="detail-section-label">Следующие темы</h3>{nextTopics.length ? nextTopics.map(topic => <TopicLink key={topic.id} topic={topic} choose={id => void choose(id)} />) : <p className="quiet-copy">Завершение траектории.</p>}
            </div>
          </div>
        </aside>}
      </section>
    </main>
    {activeModule !== 'map' && <main className="module-placeholder" aria-labelledby="module-title"><module.icon size={32} strokeWidth={1.4} /><h1 id="module-title">{module.label}</h1><p>Раздел пока в разработке.</p><a href="#/map">Вернуться к карте <ArrowUpRight size={16} /></a></main>}
    </div>
  </div>;
}
function TopicLink({ topic, choose }: { topic: KnowledgeTopic; choose(id: string): void }) { return <button className="topic-link" onClick={() => choose(topic.id)}><span className="small-topic-dot" />{topic.label}<ChevronRight size={14} /></button>; }
function GroupTabs({ ids, topics, selectedId, choose }: { ids: string[]; topics: Map<string, KnowledgeTopic>; selectedId: string; choose(id: string): void }) {
  return <div className="group-member-tabs" role="tablist" aria-label="Темы группы" onKeyDown={event => {
    const current = ids.indexOf(selectedId), next = event.key === 'ArrowRight' ? (current + 1) % ids.length : event.key === 'ArrowLeft' ? (current + ids.length - 1) % ids.length : event.key === 'Home' ? 0 : event.key === 'End' ? ids.length - 1 : -1;
    if (next < 0) return;
    event.preventDefault(); choose(ids[next]); document.getElementById('member-tab-' + ids[next])?.focus();
  }}>{ids.map(id => <button type="button" role="tab" key={id} id={'member-tab-' + id} aria-controls="group-topic-panel" aria-selected={id === selectedId} tabIndex={id === selectedId ? 0 : -1} onClick={() => choose(id)}>{topics.get(id)!.label}</button>)}</div>;
}
