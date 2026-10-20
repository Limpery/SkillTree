import { useLayoutEffect, useMemo, type RefObject } from 'react';
import { createCareerFloat, type CareerScene } from '@skilltree/graph-domain/career-scene';

/** One animation clock paints only node offsets and edge paths, without React renders per frame. */
export function useFloatingGraph(rootRef: RefObject<HTMLElement | null>, scene: CareerScene | undefined, enabled: boolean) {
  const animation = useMemo(() => scene ? { sample: createCareerFloat(scene), elapsedMs: 0 } : undefined, [scene]);
  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || !scene || !animation) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0, previousTime: number | undefined;
    let nodes = new Map<string, HTMLElement>(), edges = new Map<string, SVGPathElement>();
    const paint = () => {
      // React Flow mounts its internal nodes after its first store update.
      if (nodes.size !== scene.nodes.length || [...nodes.values()].some(node => !node.isConnected)) nodes = new Map(Array.from(root.querySelectorAll<HTMLElement>('.knowledge-node[data-topic-id]'), node => [node.dataset.topicId!, node]));
      if (edges.size !== scene.edges.length || [...edges.values()].some(edge => !edge.isConnected)) edges = new Map(Array.from(root.querySelectorAll<SVGPathElement>('[data-motion-edge-id]'), edge => [edge.dataset.motionEdgeId!, edge]));
      const current = animation.sample(animation.elapsedMs);
      for (const [id, element] of nodes) {
        const point = current.positions[id], anchor = scene.positions[id];
        if (point && anchor) element.style.translate = `${(point.x - anchor.x).toFixed(3)}px ${(point.y - anchor.y).toFixed(3)}px`;
      }
      for (const edge of current.edges) edges.get(edge.id)?.setAttribute('d', edge.path);
    };
    const tick = (time: number) => {
      if (previousTime !== undefined) animation.elapsedMs += Math.min(64, time - previousTime);
      previousTime = time;
      paint();
      frame = requestAnimationFrame(tick);
    };
    const update = () => {
      cancelAnimationFrame(frame);
      previousTime = undefined;
      if (reduced.matches) {
        animation.elapsedMs = 0;
        paint();
        root.dataset.motion = 'reduced';
      } else if (enabled && !document.hidden) {
        paint();
        root.dataset.motion = 'running';
        frame = requestAnimationFrame(tick);
      } else root.dataset.motion = 'paused';
    };
    update();
    reduced.addEventListener('change', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      cancelAnimationFrame(frame);
      reduced.removeEventListener('change', update);
      document.removeEventListener('visibilitychange', update);
      delete root.dataset.motion;
    };
  }, [rootRef, scene, animation, enabled]);
}
