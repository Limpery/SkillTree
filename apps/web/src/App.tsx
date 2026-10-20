import { memo, useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { Background, Handle, MarkerType, Position, ReactFlow, useNodesInitialized, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import { ArrowUpRight, BookOpen, ChevronRight, Compass, ExternalLink, GitBranch, Layers, Maximize2, Minus, Network, PanelRightClose, Plus, Search, Target, X } from 'lucide-react';
import type { KnowledgeTopic } from '@skilltree/graph-domain/middle-react';
import { createFrontendCatalog, trackMembership } from '@skilltree/graph-domain/frontend-catalog';
import { KNOWLEDGE_NODE } from '@skilltree/graph-domain/knowledge-layout';
import { fitCareerScene, type CareerNode } from '@skilltree/graph-domain/career-scene';
import { planForRole } from '@skilltree/graph-domain';
import { useCareerScene } from './useCareerScene';

type TopicNode = Node<{ item: CareerNode; selected: boolean; related: boolean; muted: boolean; active: boolean; branch: string; zoom: number }, 'knowledge'>;
const nodeOrigin: [number, number] = [.5, .5];
const nodeTypes = { knowledge: memo(KnowledgeNode) }, edgeTypes = { knowledge: memo(KnowledgeConnection) };
const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const motionDuration = (ms: number) => window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : ms;
const word = (count: number) => count % 10 === 1 && count % 100 !== 11 ? 'тема' : count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 12 || count % 100 > 14) ? 'темы' : 'тем';

function KnowledgeNode({ data }: NodeProps<TopicNode>) {
  const { item, zoom } = data, hub = item.start || item.careerId;
  const landmark = item.memberIds.some(id => ['react', 'vue', 'middle-project', 'vue-project'].includes(id));
  const style = { '--inverse-zoom': 1 / zoom, '--reveal-delay': `${Math.min(260, item.depth * 30)}ms` } as CSSProperties;
  return <div className={'knowledge-node branch-' + data.branch + (hub ? ' career-hub' : ' detail-node') + (item.start ? ' start-node' : '') + (item.careerId ? ' profession-node' : '') + (landmark ? ' is-landmark' : '') + (data.active ? ' is-active-career' : '') + (data.selected ? ' is-selected' : '') + (data.related ? ' is-related' : '') + (data.muted ? ' is-muted' : '') + (item.memberIds.length > 1 ? ' is-group' : '')} style={style} data-topic-id={item.id} data-member-ids={item.memberIds.join(',')} data-career-id={item.careerId} data-branch={data.branch}>
    <Handle type="target" position={Position.Left} className="knowledge-handle" isConnectable={false} />
    <button className="knowledge-orb nodrag" type="button" title={item.label} aria-label={item.label}>
      <span className="knowledge-symbol">{item.start ? <GitBranch size={28} /> : item.careerId ? <Compass size={28} /> : item.short}</span>
      <span className={'knowledge-title' + (item.label.split(/\s+/).some(part => part.length > 14) ? ' has-long-word' : '')}>{hub ? <><strong>{item.start ? 'Начало' : item.short}</strong><small>{item.start ? 'Выбери цель' : `${item.count} ${word(item.count!)}`}</small></> : zoom < .35 ? item.short : item.label}</span>
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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [query, setQuery] = useState(''), [searchOpen, setSearchOpen] = useState(false);
  const [zoom, setZoom] = useState(.6);
  const [tab, setTab] = useState<'overview' | 'connections'>('overview');
  const flow = useReactFlow<TopicNode>(), initialized = useNodesInitialized({ includeHiddenNodes: true });
  const graphElement = useRef<HTMLElement>(null), detailElement = useRef<HTMLElement>(null);
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
    void flow.setViewport(fitCareerScene(scene.bounds, clientWidth, clientHeight), { duration: motionDuration(600) });
  }, [scene, flow]);
  // Bounds are known before DOM measurement; fit once per scene to avoid camera restarts.
  useEffect(() => { if (scene) fitScene(); }, [scene, fitScene]);
  const resizeAction = useRef(fitScene);
  useEffect(() => { resizeAction.current = fitScene; }, [fitScene]);
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
  useEffect(() => { detailElement.current?.scrollTo({ top: 0 }); }, [selectedId, drawerOpen]);
  const selectTopic = useCallback((id: string) => {
    setSelectedId(id); setDrawerOpen(true); setTab('overview'); setQuery(''); setSearchOpen(false);
    const nodeId = scene?.nodeIdByTopic.get(id), position = nodeId ? scene?.positions[nodeId] : undefined;
    if (position) void flow.setCenter(position.x, position.y, { zoom: Math.max(.65, Math.min(flow.getZoom(), 1)), duration: motionDuration(350) });
  }, [scene, flow]);
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
    if (changed && version === selectionVersion.current) { setSelectedId(topicId); setDrawerOpen(true); setTab('overview'); }
  }, [catalog, scene, topics, plans, openCareer, selectTopic, switchTo, phase, requestedRoleId]);
  // A search that opens another career focuses its topic after that scene has committed.
  useEffect(() => {
    if (!selectedId || phase !== 'idle') return;
    const id = scene?.nodeIdByTopic.get(selectedId), position = id ? scene?.positions[id] : undefined;
    if (position) void flow.setCenter(position.x, position.y, { zoom: Math.max(.65, flow.getZoom()), duration: motionDuration(350) });
  }, [selectedId, scene, phase, flow]);
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
    data: { item, zoom, branch: branchFor(item.memberIds), active: item.careerId === scene.roleId && Boolean(scene.roleId), selected: Boolean(selectedId && item.memberIds.includes(selectedId)),
      related: item.memberIds.some(id => neighbours?.has(id)), muted: Boolean(neighbours) && !item.start && !item.careerId && !item.memberIds.some(id => neighbours?.has(id)) },
  })) ?? [], [scene, zoom, branchFor, selectedId, neighbours]);
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

  return <div className="app-shell middle-workspace">
    <aside className="sidebar"><a className="brand" href="/" aria-label="SkillTree — главная"><span className="brand-symbol"><GitBranch size={25} strokeWidth={1.6} /></span><span>skilltree<span className="brand-period">.</span></span></a><div className="workspace-label">ТВОЯ ТРАЕКТОРИЯ</div>
      <nav className="main-nav" aria-label="Основная навигация"><button className="nav-item nav-active" onClick={() => void openCareer()}><Network size={18} /><span>Выбор профессии</span></button>{catalog.tracks.map(track => <button key={track.id} className="nav-item" onClick={() => void openCareer(track.roleId)}><Target size={18} /><span>{track.label}</span></button>)}</nav>
      <div className="sidebar-note"><span className="tiny-sprout">✳</span><p>Одна цель.<br />Полная траектория.<br /><em>Твой следующий шаг.</em></p></div><div className="prototype-card"><span className="status-dot" />React + Vue<span>Выбери свой путь</span></div><div className="profile-preview"><span className="avatar">S</span><div><strong>Пространство SkillTree</strong><small>Карта профессионального развития</small></div></div>
    </aside>
    <main className="main-space"><header className="topbar"><div className="breadcrumb">Моё развитие <ChevronRight size={13} /><span>Карта профессий</span></div><div className="topbar-right"><span className="online-dot" />От цели к знаниям <GitBranch size={14} /></div></header>
      <section className="page-heading"><div><div className="eyebrow">ВЫБЕРИ, КЕМ ХОЧЕШЬ СТАТЬ</div><h1>Одна цель. <em>Твоя траектория.</em></h1><p>Нажми на специальность — её технологии появятся на карте. Переключайся и исследуй свой путь.</p></div><div className="map-counter"><span>{scene?.roleId ? scene.topicCount : catalog.roles.length}</span><div>{scene?.roleId ? 'тем в твоей' : 'специальности'}<br />{scene?.roleId ? 'траектории' : 'для старта'}</div></div></section>
      <nav className="track-nav" aria-label="Специальности"><button aria-pressed={!requestedRoleId} onClick={() => void openCareer()}><GitBranch size={15} />Выбор профессии</button>{catalog.tracks.map(track => <button key={track.id} className={'track-' + track.id} aria-pressed={requestedRoleId === track.roleId} onClick={() => void openCareer(track.roleId)}><span className="track-dot" />{track.label}</button>)}<span>На карте — одна траектория</span></nav>
      <div className="toolbar"><div className="search-wrap"><Search size={18} /><input aria-label="Найти компетенцию" placeholder="Профессия или технология…" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === 'Enter' && searchResults[0]) void choose(searchResults[0].id); if (event.key === 'Escape') setSearchOpen(false); }} /><kbd>↵</kbd>
        {searchOpen && query && <div className="search-results" role="listbox" aria-label="Результаты поиска">{searchResults.length ? searchResults.map(topic => <button role="option" aria-selected={false} key={topic.id} onClick={() => void choose(topic.id)}><BookOpen size={15} /><div>{topic.label}<small>{topic.kind === 'role' ? 'Специальность' : catalog.stages.find(stage => stage.id === topic.stageId)?.title}</small></div><ArrowUpRight size={14} /></button>) : <div className="search-empty">Попробуй другое название темы.</div>}</div>}</div>
        <button className="overview-button" onClick={fitScene}><Maximize2 size={16} />Вписать в экран</button><button className="icon-button drawer-toggle" onClick={() => setDrawerOpen(value => !value)} aria-label={drawerOpen ? 'Скрыть карточку' : 'Показать карточку'}><PanelRightClose size={18} /></button></div>
      <div className={'workspace' + (!drawerOpen ? ' drawer-hidden' : '')}>
        <section ref={graphElement} className={'graph-surface graph-knowledge career-map' + (scene?.roleId ? ' has-career' : '') + ' scene-' + phase + (zoom < .35 ? ' scene-overview' : '') + (zoom < .12 ? ' scene-small' : '')} aria-label="Карта траектории" aria-busy={busy} data-active-career={scene?.roleId ?? ''} data-phase={phase}>
          <div className="canvas-heading"><span className="canvas-kicker">{selected?.label ?? activeCareer?.label ?? 'НАЧНИ С ВЫБОРА ПРОФЕССИИ'}</span><span className="canvas-badge"><GitBranch size={12} />{scene?.roleId ? `${scene.topicCount} ${word(scene.topicCount)}` : '2 специальности'}</span></div>
          {error && <div className="graph-message" role="alert">{error}</div>}
          {busy && <div className="scene-status is-visible" role="status" aria-live="polite">{phase === 'leaving' ? 'Скрываем предыдущую траекторию…' : phase === 'preparing' ? 'Прокладываем путь…' : phase === 'entering' ? 'Раскрываем траекторию…' : 'Подготавливаем карту…'}</div>}
          <ReactFlow<TopicNode> colorMode="dark" nodes={displayNodes} edges={displayEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} nodeOrigin={nodeOrigin} onNodeClick={(_event, node) => void choose(node.id)} onMove={(_event, viewport) => setZoom(viewport.zoom)} nodesDraggable={false} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false} minZoom={.02} maxZoom={1.5} panOnScroll zoomOnScroll={false} zoomOnDoubleClick={false}><Background gap={30} size={1} color="var(--graph-grid)" /></ReactFlow>
          <div className="knowledge-controls"><button onClick={() => void openCareer()}><Compass size={14} />Специальности</button><button onClick={() => { setSelectedId(undefined); fitScene(); }}><Maximize2 size={14} />{scene?.roleId ? 'Вся траектория' : 'Вся карта'}</button></div>
          <div className="canvas-footer"><div className="legend"><span><i className="line-key" />Порядок изучения</span>{selected && <span><i className="line-key is-bright" />Соседние шаги</span>}</div><div className="viewport-controls"><button aria-label="Отдалить" onClick={() => void flow.zoomOut({ duration: motionDuration(180) })}><Minus size={16} /></button><output aria-label="Масштаб">{Math.round(zoom * 100)}%</output><button aria-label="Приблизить" onClick={() => void flow.zoomIn({ duration: motionDuration(180) })}><Plus size={16} /></button></div></div><div className="canvas-tip">{scene?.roleId ? 'От основ к проекту. Параллельные блоки входят в путь; темы открываются вкладками.' : 'Нажми на специальность, чтобы раскрыть её траекторию.'}</div>
        </section>
        {drawerOpen && <aside ref={detailElement} className="detail-panel knowledge-details" aria-label="Карточка компетенции" data-testid="detail-panel">
          {selected ? <>
            {selectedGroup && <div className="group-details"><span className="detail-section-label">ГРУППА · {selectedGroup.memberIds.length} {word(selectedGroup.memberIds.length).toUpperCase()}</span><h3>{selectedGroup.label}</h3><GroupTabs ids={selectedGroup.memberIds} topics={topics} selectedId={selected.id} choose={id => void choose(id)} /></div>}
            <div id="group-topic-panel" role={selectedGroup ? 'tabpanel' : undefined} aria-labelledby={selectedGroup ? 'member-tab-' + selected.id : undefined}><div className="detail-topline"><span>ТВОЯ ТРАЕКТОРИЯ · ТЕМА</span><button className="icon-button" onClick={() => setSelectedId(undefined)} aria-label="Назад к траектории"><X size={16} /></button></div><div className="detail-symbol">{selected.short}</div><h2 data-testid="selected-title">{selected.label}</h2><p className="detail-description">{selected.description}</p>
              <div className="detail-tabs" role="tablist" aria-label="Детали компетенции"><button role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>Обзор</button><button role="tab" aria-selected={tab === 'connections'} onClick={() => setTab('connections')}>Связи <span>{selected.prerequisites.length + nextTopics.length}</span></button></div>
              {tab === 'overview' && <><div className="detail-section-label">ЧТО НУЖНО УМЕТЬ</div><p className="competency-outcome">{selected.outcome}</p><div className="detail-section-label">ОФИЦИАЛЬНЫЕ МАТЕРИАЛЫ</div>{selected.resources.map(material => <a className="material-link" key={material.url} href={material.url} target="_blank" rel="noreferrer"><BookOpen size={15} /><span>{material.title}</span><ExternalLink size={13} /></a>)}</>}
              <div className="detail-section-label">ПЕРЕД ИЗУЧЕНИЕМ · ВСЕ ТЕМЫ</div>{selected.prerequisites.length ? selected.prerequisites.map(id => <TopicLink key={id} topic={topics.get(id)!} choose={id => void choose(id)} />) : <p className="quiet-copy">Можно начинать без других тем.</p>}
              <div className="detail-section-label">СЛЕДУЮЩИЕ ТЕМЫ ЭТОЙ ТРАЕКТОРИИ</div>{nextTopics.length ? nextTopics.map(topic => <TopicLink key={topic.id} topic={topic} choose={id => void choose(id)} />) : <p className="quiet-copy">Практический результат завершает этот путь.</p>}
            </div>
          </> : <><div className="detail-topline"><span>{activeCareer ? 'ТВОЯ ЦЕЛЬ' : 'ОТ ЦЕЛИ К ЗНАНИЯМ'}</span><Compass size={19} /></div><h2 className="welcome-title">{activeCareer ? activeCareer.label : <>Начни с цели.<br /><em>Открой свой путь.</em></>}</h2><p className="detail-description">{activeCareer ? activeCareer.description : 'В центре — начало. Вокруг — специальности. Выбери одну, чтобы увидеть все необходимые технологии.'}</p>
            {activeCareer && <div className="plan-summary"><span>{scene!.topicCount}</span><div>{word(scene!.topicCount)} в траектории<small>Основы, инструменты и практика</small></div></div>}
            <div className="branch-explanation"><GitBranch size={23} /><p>{activeCareer ? 'Короткие переходы ведут от основ к проекту. Параллельные блоки входят в траекторию. Внутри блока — темы по порядку; все предпосылки и материалы находятся в карточке.' : 'При смене специальности предыдущая ветка плавно исчезает. Новая раскрывается отдельно, а масштаб подбирается под её размер.'}</p></div>
            {activeCareer && <><div className="detail-section-label">ОТКРЫТЬ ТЕМУ</div>{['react', 'vue', 'fetch', 'middle-project', 'vue-project'].filter(id => activePlan?.has(id)).map(id => <TopicLink key={id} topic={topics.get(id)!} choose={id => void choose(id)} />)}</>}
            <div className="detail-section-label">ВЫБЕРИ СПЕЦИАЛЬНОСТЬ</div>{catalog.tracks.map(track => <button className="suggested-role" key={track.id} onClick={() => void openCareer(track.roleId)}><Compass size={17} /><span>{topics.get(track.roleId)!.label}</span><ArrowUpRight size={14} /></button>)}
          </>}
          <div className="panel-bottom-note"><Layers size={13} />{scene?.roleId ? `${scene.topicCount} ${word(scene.topicCount)} · одна открытая траектория` : 'Выбери специальность на карте'}</div>
        </aside>}
      </div><footer className="page-footer"><span>SKILLTREE <span className="footer-separator">/</span> знания складываются в профессию</span><span>React + Vue · Middle</span></footer>
    </main>
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
