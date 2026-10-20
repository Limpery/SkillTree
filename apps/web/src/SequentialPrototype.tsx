// Historical prototype, superseded by the competency DAG in App.tsx.
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Background, BaseEdge, Handle, MarkerType, Position, ReactFlow, getStraightPath, useNodesInitialized, useNodesState, useReactFlow, type Edge, type EdgeProps, type Node, type NodeProps } from '@xyflow/react';
import { Activity, ArrowDownLeft, ArrowUpRight, BookOpen, ChevronRight, Compass, Eye, GitBranch, Layers, Maximize2, Minus, Network, PanelRightClose, Plus, Search, Settings2, X } from 'lucide-react';
import { planForRole, projectCatalog, relatedRoles, type Topic, type VisibleNode } from '@skilltree/graph-domain';
import { createCatalog } from '@skilltree/graph-domain/catalog';

type DisplayMode = 'auto' | 'collapsed' | 'expanded';
type TopicNode = Node<{ topic: VisibleNode; selected: boolean; dimmed: boolean }, 'topic'>;
type Snapshot = {
  dataset: number; mode: DisplayMode; canonicalCount: number; visibleCount: number; renderedCount: number; edgeCount: number;
  groupCount: number; selectedId: string | null; roleId: string | null; readyKey: string; firstInteractionMs: number;
  catalogMs: number; projectionMs: number; zoom: number; heapBytes: number | null;
  layoutReady: boolean;
};
declare global {
  interface Window {
    __skillTreePrototype?: {
      snapshot(): Snapshot; dataset(count: number): void; mode(mode: DisplayMode): void;
      select(id: string): void; clear(): void; viewport(x: number, y: number, zoom: number): Promise<boolean>; fit(): Promise<boolean>; getViewport(): { x: number; y: number; zoom: number };
    };
  }
}

const nodeTypes = { topic: memo(TopicView) };
const edgeTypes = { knowledge: memo(KnowledgeEdge) };
const defaultEdgeOptions = { type: 'knowledge', selectable: false };
const fitOptions = { padding: .4, minZoom: .01, maxZoom: .62 };
const nodeOrigin: [number, number] = [.5, .5];
const proOptions = { hideAttribution: false };
const graphBackground = <Background gap={28} size={1} color="var(--graph-grid)" />;
const normalize = (value: string) => value.toLocaleLowerCase('ru').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();

function TopicView({ data }: NodeProps<TopicNode>) {
  const { topic, selected, dimmed } = data;
  return <div className={'topic-node node--' + topic.kind + (selected ? ' is-selected' : '') + (topic.active ? ' is-active' : '') + (dimmed ? ' is-dimmed' : '')} data-topic-id={topic.id} data-step={topic.step}>
    <Handle type="target" position={Position.Top} isConnectable={false} className="center-handle" />
    <Handle type="source" position={Position.Bottom} isConnectable={false} className="center-handle" />
    <button type="button" className="topic-orb nodrag" aria-label={topic.kind === 'group' ? 'Раскрыть группу: ' + topic.label : topic.kind === 'role' ? 'Специальность: ' + topic.label : topic.label}>
      {topic.kind === 'group' && <><span className="orb-part part-a" /><span className="orb-part part-b" /><span className="orb-part part-c" /></>}
      <span className="orb-symbol">{topic.kind === 'role' ? <Compass size={29} strokeWidth={1.4} /> : topic.short}</span>
      {topic.kind === 'group' && <span className="orb-count">{topic.count}</span>}
    </button>
    <span className={'topic-label label--' + (topic.labelPosition ?? 'below')}>{topic.step && <span className="step-number">{topic.kind === 'role' ? 'ЦЕЛЬ' : 'ШАГ ' + String(topic.step).padStart(2, '0')}</span>}{topic.label}{topic.kind === 'group' && <small>{topic.count} темы</small>}{topic.kind === 'role' && !topic.step && <small>специальность <ArrowUpRight size={10} /></small>}</span>
  </div>;
}

function KnowledgeEdge(props: EdgeProps) {
  const path = typeof props.data?.path === 'string' ? props.data.path : getStraightPath(props)[0];
  return <BaseEdge path={path} markerEnd={props.markerEnd} interactionWidth={0} style={props.style} />;
}

export function App() {
  const initial = useMemo(() => new URLSearchParams(location.search), []);
  const initialCount = Number(initial.get('count'));
  const [dataset, setDataset] = useState([100, 300, 800].includes(initialCount) ? initialCount : 0);
  const [mode, setMode] = useState<DisplayMode>(['collapsed', 'expanded'].includes(initial.get('mode') ?? '') ? initial.get('mode') as DisplayMode : 'auto');
  const [selectedId, setSelectedId] = useState<string>();
  const [roleId, setRoleId] = useState<string>();
  const [manualGroups, setManualGroups] = useState<Set<string>>(() => new Set());
  const [autoExpanded, setAutoExpanded] = useState(false);
  const [nearGroups, setNearGroups] = useState<Set<string>>(() => new Set());
  const [zoom, setZoom] = useState(.4);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState(initial.has('count'));
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [tab, setTab] = useState<'overview' | 'connections'>('overview');
  const startRef = useRef(performance.now());
  const [ready, setReady] = useState({ key: '', ms: 0 });
  const flow = useReactFlow<TopicNode>();
  const initialized = useNodesInitialized();
  const fittedKey = useRef('');
  const graphElement = useRef<HTMLElement>(null);
  const catalogResult = useMemo(() => { const start = performance.now(); return { catalog: createCatalog(dataset || undefined), ms: performance.now() - start }; }, [dataset]);
  const catalog = catalogResult.catalog;
  const expandedGroups = useMemo(() => mode === 'expanded' ? new Set(catalog.groups.map(group => group.id)) : mode === 'collapsed' ? new Set<string>() : new Set([...manualGroups, ...(autoExpanded ? nearGroups : [])]), [mode, autoExpanded, catalog, manualGroups, nearGroups]);
  const projection = useMemo(() => {
    const start = performance.now();
    const result = projectCatalog(catalog, { expandedGroups, selectedId, roleId, allRelations: mode === 'expanded' });
    return { ...result, ms: performance.now() - start };
  }, [catalog, expandedGroups, selectedId, roleId, mode]);
  const displayNodes = useMemo<TopicNode[]>(() => projection.nodes.map(topic => ({
    id: topic.id, type: 'topic', position: topic.position, data: { topic, selected: topic.id === selectedId, dimmed: Boolean(roleId || selectedId) && !topic.active && topic.id !== selectedId },
    style: { width: 112, height: 112 }, ariaLabel: topic.label, draggable: false, connectable: false
  })), [projection, selectedId, roleId]);
  const displayEdges = useMemo<Edge[]>(() => projection.edges.map(edge => ({ id: edge.id, source: edge.source, target: edge.target, data: { path: edge.path }, type: 'knowledge', className: edge.active ? 'edge-active' : edge.kind === 'direction' ? 'edge-direction' : 'edge-local',
    markerEnd: edge.kind === 'learning-step' ? { type: MarkerType.ArrowClosed, color: 'var(--edge-active)', width: 14, height: 14 } : undefined })), [projection]);
  const [nodes, setNodes, onNodesChange] = useNodesState<TopicNode>(displayNodes);
  useEffect(() => { setNodes(displayNodes); }, [displayNodes, setNodes]);
  const selected = catalog.topics.find(topic => topic.id === selectedId);
  const plan = projection.plan;
  const usersOfTopic = useMemo(() => selected && selected.kind !== 'role' ? relatedRoles(catalog, selected.id) : [], [catalog, selected]);
  const readyKey = dataset + ':' + mode;
  const layoutKey = readyKey + ':' + (roleId ?? 'overview');
  const layoutCommitted = nodes.length === displayNodes.length && nodes.every((node, index) => {
    const expected = displayNodes[index];
    return node.id === expected.id && node.position.x === expected.position.x && node.position.y === expected.position.y;
  });
  const fitGraph = useCallback(() => {
    const element = graphElement.current;
    if (roleId && element) {
      const height = Math.max(1, projection.nodes.at(-1)!.position.y);
      const routeZoom = Math.max(.06, Math.min(.7, (element.clientHeight - 200) / height));
      return flow.setViewport({ x: Math.min(element.clientWidth * .25, 180), y: 100, zoom: routeZoom }, { duration: 0 });
    }
    return flow.fitView(fitOptions);
  }, [flow, roleId, projection.nodes]);

  useEffect(() => {
    if (mode !== 'auto') return;
    if (zoom >= .82) setAutoExpanded(true);
    else if (zoom <= .66) setAutoExpanded(false);
  }, [zoom, mode]);

  useEffect(() => {
    if (!initialized || !layoutCommitted || (fittedKey.current === layoutKey && ready.key === readyKey)) return;
    let cancelled = false;
    async function measure() {
      if (fittedKey.current !== layoutKey) await fitGraph();
      await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!cancelled) {
        fittedKey.current = layoutKey;
        setReady(previous => previous.key === readyKey ? previous : { key: readyKey, ms: performance.now() - startRef.current });
      }
    }
    void measure();
    return () => { cancelled = true; };
  }, [initialized, layoutCommitted, ready.key, readyKey, layoutKey, displayNodes.length, fitGraph]);

  const choose = useCallback((id: string) => {
    const topic = catalog.topics.find(item => item.id === id);
    if (!topic) return;
    setSelectedId(id); setRoleId(previous => topic.kind === 'role' ? id : previous && planForRole(catalog, previous).topicIds.includes(id) ? previous : undefined); setDrawerOpen(true); setSearchOpen(false); setQuery(''); setTab('overview');
    if (topic.groupId) setManualGroups(previous => new Set([...previous, topic.groupId!]));
  }, [catalog]);
  const clear = useCallback(() => { setRoleId(undefined); setSelectedId(undefined); setManualGroups(new Set()); }, []);
  const changeDataset = useCallback((count: number) => { startRef.current = performance.now(); fittedKey.current = ''; setReady({ key: '', ms: 0 }); setDataset(count); clear(); }, [clear]);
  const changeMode = useCallback((next: DisplayMode) => { startRef.current = performance.now(); fittedKey.current = ''; setReady({ key: '', ms: 0 }); setMode(next); }, []);
  const onMove = useCallback((_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
    setZoom(previous => Math.abs(previous - viewport.zoom) >= .015 ? viewport.zoom : previous);
    const element = graphElement.current;
    if (mode !== 'auto' || !element || (viewport.zoom < .82 && !autoExpanded)) return;
    const margin = 70;
    const left = -viewport.x / viewport.zoom - margin, top = -viewport.y / viewport.zoom - margin;
    const right = (element.clientWidth - viewport.x) / viewport.zoom + margin, bottom = (element.clientHeight - viewport.y) / viewport.zoom + margin;
    const next = new Set(catalog.groups.filter(group => group.position.x >= left && group.position.x <= right && group.position.y >= top && group.position.y <= bottom).map(group => group.id));
    setNearGroups(previous => previous.size === next.size && [...next].every(id => previous.has(id)) ? previous : next);
  }, [mode, autoExpanded, catalog]);
  const onNodeClick = useCallback((_event: unknown, node: TopicNode) => {
    if (node.data.topic.kind === 'group') { const id = node.data.topic.groupId!; setManualGroups(previous => new Set([...previous, id])); if (mode !== 'auto') changeMode('auto'); const members = catalog.topics.filter(topic => topic.groupId === id); const focus = members[Math.min(1, members.length - 1)].position; void flow.setCenter(focus.x, focus.y, { zoom: .85, duration: 200 }); }
    else choose(node.id);
  }, [choose, mode, changeMode, catalog, flow]);
  const searchResults = useMemo(() => {
    const text = normalize(query); if (!text) return [];
    const score = (topic: Topic) => {
      const names = [topic.label, ...(catalog.roles.find(role => role.id === topic.id)?.aliases ?? [])].map(normalize);
      return Math.max(...names.map(name => name === text || name.startsWith(text + ' ') ? 100 : name.includes(text) ? 30 : 0)) + (topic.kind === 'role' ? 10 : 0);
    };
    return catalog.topics.filter(topic => !topic.synthetic && score(topic) > (topic.kind === 'role' ? 10 : 0)).sort((a, b) => score(b) - score(a)).slice(0, 7);
  }, [query, catalog]);

  useEffect(() => {
    window.__skillTreePrototype = {
      snapshot: () => ({ dataset, mode, canonicalCount: catalog.topics.length, visibleCount: projection.nodes.length,
        renderedCount: document.querySelectorAll('.react-flow__node').length, edgeCount: projection.edges.length, groupCount: catalog.groups.length,
        selectedId: selectedId ?? null, roleId: roleId ?? null, readyKey: ready.key, firstInteractionMs: ready.ms,
        catalogMs: catalogResult.ms, projectionMs: projection.ms, zoom: flow.getZoom(), layoutReady: initialized,
        heapBytes: (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? null }),
      dataset: changeDataset, mode: changeMode, select: choose, clear,
      viewport: (x, y, nextZoom) => flow.setViewport({ x, y, zoom: nextZoom }, { duration: 0 }), fit: fitGraph, getViewport: () => flow.getViewport()
    };
    return () => { delete window.__skillTreePrototype; };
  }, [dataset, mode, catalog, projection, selectedId, roleId, ready, catalogResult.ms, initialized, flow, changeDataset, changeMode, choose, clear, fitGraph]);

  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="/" aria-label="SkillTree — главная"><span className="brand-symbol"><GitBranch size={25} strokeWidth={1.6} /></span><span>skilltree<span className="brand-period">.</span></span></a>
      <div className="workspace-label">ЛИЧНОЕ ПРОСТРАНСТВО</div>
      <nav className="main-nav" aria-label="Основная навигация">
        <button className="nav-item nav-active" onClick={clear}><Network size={18} /><span>Карта навыков</span><span className="nav-active-dot" /></button>
        <span className="nav-item nav-future"><Layers size={18} /><span>Мои траектории</span><small>позже</small></span>
        <span className="nav-item nav-future"><Compass size={18} /><span>Сообщество</span><small>позже</small></span>
      </nav>
      <div className="sidebar-note"><span className="tiny-sprout">✳</span><p>Большой путь<br />начинается с одного<br /><em>нового навыка.</em></p></div>
      <div className="prototype-card"><span className="status-dot" />Технический прототип<span>Пункт 0 · граф и архитектура</span></div>
      <button className="diagnostic-button" onClick={() => setDiagnostics(value => !value)} aria-expanded={diagnostics}><Settings2 size={16} />Проверка графа</button>
      <div className="profile-preview"><span className="avatar">S</span><div><strong>Пространство SkillTree</strong><small>Локальный прототип</small></div></div>
    </aside>

    <main className="main-space">
      <header className="topbar"><div className="breadcrumb">Моё развитие <ChevronRight size={13} /><span>Карта навыков</span></div><div className="topbar-right"><span className="online-dot" />Создаём свой путь<ArrowUpRight size={14} /></div></header>
      <section className="page-heading"><div><div className="eyebrow">УЧИТЬСЯ С НАПРАВЛЕНИЕМ</div><h1>Твой следующий <em>шаг.</em></h1><p>От первых знаний — к профессии. Вся картина перед тобой.</p></div><div className="map-counter"><span>{catalog.topics.filter(topic => topic.kind !== 'role').length}</span><div>технологий<br />в этой карте</div></div></section>

      <div className="toolbar">
        <div className="search-wrap"><Search size={18} /><input aria-label="Найти профессию или технологию" value={query} onChange={event => { setQuery(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onKeyDown={event => { if (event.key === 'Enter' && searchResults[0]) choose(searchResults[0].id); if (event.key === 'Escape') setSearchOpen(false); }} placeholder="Кем хочешь стать? Или что изучить?" /><kbd>↵</kbd>
          {searchOpen && query && <div className="search-results" role="listbox" aria-label="Результаты поиска">{searchResults.length ? searchResults.map(topic => <button key={topic.id} role="option" aria-selected={false} onClick={() => choose(topic.id)}><span>{topic.kind === 'role' ? <Compass size={16} /> : <BookOpen size={16} />}</span><div>{topic.label}<small>{topic.kind === 'role' ? 'Специальность' : 'Технология'}</small></div><ArrowUpRight size={14} /></button>) : <div className="search-empty">В этом наборе пока нет совпадений.</div>}</div>}
        </div>
        <span className="toolbar-divider" />
        <button className={'overview-button' + (!selectedId ? ' chosen' : '')} onClick={clear}><Eye size={16} />Обзор карты</button>
        <button className="icon-button drawer-toggle" onClick={() => setDrawerOpen(value => !value)} aria-label={drawerOpen ? 'Скрыть карточку' : 'Показать карточку'}><PanelRightClose size={18} /></button>
      </div>

      {diagnostics && <section className="diagnostics" aria-label="Проверка производительности">
        <div><Activity size={16} /><strong>Проверка графа</strong><span>Измерения — в отчёте, не оценка устройства</span></div>
        <label>Набор<select aria-label="Нагрузочный набор" value={dataset} onChange={event => changeDataset(Number(event.target.value))}><option value="0">Основная карта</option><option value="100">100 вершин</option><option value="300">300 вершин</option><option value="800">800 вершин</option></select></label>
        <label>Представление<select aria-label="Режим отображения" value={mode} onChange={event => changeMode(event.target.value as DisplayMode)}><option value="auto">По масштабу</option><option value="collapsed">Группы свёрнуты</option><option value="expanded">Все вершины</option></select></label>
        <span className="diagnostic-count" data-testid="visible-count">{projection.nodes.length} видно / {catalog.topics.length} всего</span>
      </section>}

      <div className={'workspace' + (!drawerOpen ? ' drawer-hidden' : '')}>
        <section ref={graphElement} className={'graph-surface' + (roleId ? ' graph-route' : zoom < .75 ? ' graph-overview' : '')} style={{ '--label-scale': Math.min(roleId ? 16 : 8, 1 / zoom), '--route-height': Math.max(620, (projection.nodes.length - 1) * 82 + 220) + 'px' } as React.CSSProperties} aria-label={roleId ? 'Последовательная траектория обучения' : 'Радиальная карта технологий'} aria-busy={ready.key !== readyKey || !layoutCommitted || !initialized}>
          <div className="canvas-heading"><span className="canvas-kicker">{roleId ? 'ПОСЛЕДОВАТЕЛЬНОСТЬ ОБУЧЕНИЯ' : selectedId ? 'СВЯЗИ ТЕХНОЛОГИИ' : 'КАРТА ВОЗМОЖНОСТЕЙ'}</span><span className="canvas-badge"><span />{dataset ? 'Нагрузочный набор' : 'Разработка'}</span></div>
          {(roleId || selectedId) && <button className="focus-pill" onClick={clear}>{(roleId && catalog.topics.find(topic => topic.id === roleId)?.label) || selected?.label}<X size={13} /></button>}
          <ReactFlow<TopicNode> colorMode="dark" nodes={nodes} edges={displayEdges} nodeTypes={nodeTypes} edgeTypes={edgeTypes} onNodesChange={onNodesChange} onNodeClick={onNodeClick} onMove={onMove}
            nodeOrigin={nodeOrigin} minZoom={.01} maxZoom={1.8} nodesConnectable={false} nodesFocusable={false} edgesFocusable={false} elementsSelectable={false}
            onlyRenderVisibleElements defaultEdgeOptions={defaultEdgeOptions} proOptions={proOptions} panOnScroll={false} zoomOnScroll={!roleId} preventScrolling={!roleId} zoomOnDoubleClick={false}>
            {graphBackground}
          </ReactFlow>
          <div className="canvas-footer"><div className="legend"><span><i className="legend-line" />{roleId ? 'Следующий шаг' : 'Направление'}</span><span><i className="legend-dot" />{roleId ? 'В выбранном пути' : 'Группа технологий'}</span></div><div className="viewport-controls"><button onClick={() => void flow.zoomOut({ duration: 180 })} aria-label="Отдалить"><Minus size={16} /></button><output aria-label="Масштаб">{Math.round(zoom * 100)}%</output><button onClick={() => void flow.zoomIn({ duration: 180 })} aria-label="Приблизить"><Plus size={16} /></button><button onClick={() => void fitGraph()} aria-label="Показать весь граф"><Maximize2 size={16} /></button></div></div>
          <div className="canvas-tip"><span className="tip-dot" />{roleId ? 'Начни сверху и двигайся по стрелкам к профессии.' : 'Приближай, чтобы раскрыть группы. Выбирай профессию, чтобы увидеть её путь.'}</div>
        </section>

        {drawerOpen && <aside className="detail-panel" aria-label="Карточка выбранной вершины" data-testid="detail-panel">
          {selected ? <>
            <div className="detail-topline"><span>{selected.kind === 'role' ? 'СПЕЦИАЛЬНОСТЬ' : 'ТЕХНОЛОГИЯ'}</span><button className="icon-button" onClick={() => setDrawerOpen(false)} aria-label="Закрыть карточку"><X size={16} /></button></div>
            <div className={'detail-symbol' + (selected.kind === 'role' ? ' detail-role' : '')}>{selected.kind === 'role' ? <Compass size={29} /> : selected.short}</div>
            <h2 data-testid="selected-title">{selected.label}</h2>
            <p className="detail-description">{selected.description}</p>
            <div className="detail-tabs" role="tablist" aria-label="Детали вершины"><button role="tab" aria-selected={tab === 'overview'} onClick={() => setTab('overview')}>Обзор</button><button role="tab" aria-selected={tab === 'connections'} onClick={() => setTab('connections')}>Связи <span>{selected.kind === 'role' ? plan?.topicIds.length ?? 0 : usersOfTopic.length}</span></button></div>
            {plan && selected.kind === 'role' ? <RoleDetails topics={catalog.topics} ids={plan.topicIds} onSelect={choose} /> : tab === 'overview' ? <>
              <div className="detail-section-label">ПЕРЕД ИЗУЧЕНИЕМ</div>
              {selected.prerequisites.length ? selected.prerequisites.map(id => <button className="topic-link" key={id} onClick={() => choose(id)}><span className="small-topic-dot" />{catalog.topics.find(topic => topic.id === id)?.label}<ChevronRight size={14} /></button>) : <p className="quiet-copy">У этой темы нет обязательных предпосылок в демонстрационном каталоге.</p>}
              <div className="single-copy-note"><GitBranch size={18} /><div><strong>Одна технология — один прогресс</strong><span>Тема может входить в несколько направлений и остаётся одной вершиной.</span></div></div>
              <div className="detail-section-label">ВСТРЕЧАЕТСЯ В НАПРАВЛЕНИЯХ</div><div className="role-links">{usersOfTopic.length ? usersOfTopic.map(id => <button key={id} onClick={() => choose(id)}>{catalog.topics.find(topic => topic.id === id)?.label}<ArrowUpRight size={12} /></button>) : <p className="quiet-copy">Тема пока не включена в подготовленные профессии.</p>}</div>
            </> : <><div className="detail-section-label">ПРОФЕССИИ С ЭТОЙ ТЕМОЙ</div>{usersOfTopic.map(id => <button className="topic-link" key={id} onClick={() => choose(id)}><Compass size={15} />{catalog.topics.find(topic => topic.id === id)?.label}<ChevronRight size={14} /></button>)}</>}
          </> : <>
            <div className="detail-topline"><span>ТВОЙ ОРИЕНТИР</span><span className="welcome-star">✳</span></div>
            <h2 className="welcome-title">Профессия начинается<br />с <em>понятного пути.</em></h2>
            <p className="detail-description">В центре — общая база. Дальше — направления и технологии. На краях карты — специальности.</p>
            <div className="welcome-illustration"><span className="welcome-ring ring-1" /><span className="welcome-ring ring-2" /><span className="welcome-ring ring-3" /><span className="welcome-core"><GitBranch size={28} /></span><span className="welcome-satellite satellite-a" /><span className="welcome-satellite satellite-b" /><span className="welcome-satellite satellite-c" /></div>
            <div className="detail-section-label">ПОПРОБУЙ НАПРАВЛЕНИЕ</div>
            {['role:react', 'role:frontend', 'role:node', 'role:java'].map(id => <button className="suggested-role" key={id} onClick={() => choose(id)}><Compass size={16} /><span>{catalog.topics.find(topic => topic.id === id)?.label}</span><ArrowUpRight size={14} /></button>)}
            <div className="welcome-footnote"><ArrowDownLeft size={16} /><span>Нажми на составную вершину, чтобы рассмотреть технологии внутри.</span></div>
          </>}
          <div className="panel-bottom-note"><span className="status-dot" />Ранняя версия · проверяем устройство графа</div>
        </aside>}
      </div>
      <footer className="page-footer"><span>SKILLTREE <span className="footer-separator">/</span> расти в своём направлении</span><span>{catalog.roles.length} направлений <span className="footer-separator">·</span> общая база без повторов</span></footer>
    </main>
  </div>;
}

function RoleDetails({ topics, ids, onSelect }: { topics: Topic[]; ids: string[]; onSelect(id: string): void }) {
  return <div className="role-details"><div className="plan-summary"><span>{ids.length}</span><div>тем в демонстрационном пути<small>включая общие предпосылки</small></div></div><div className="detail-section-label">ПОРЯДОК ПО ЗАВИСИМОСТЯМ</div><ol className="plan-list">{ids.map((id, index) => <li key={id}><button onClick={() => onSelect(id)}><span>{String(index + 1).padStart(2, '0')}</span><strong>{topics.find(topic => topic.id === id)?.label}</strong><ChevronRight size={13} /></button></li>)}</ol><p className="quiet-copy">Состав маршрутов иллюстрирует работу прототипа. Экспертная проверка содержания — отдельный этап.</p></div>;
}
