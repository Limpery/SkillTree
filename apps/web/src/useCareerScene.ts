import { useCallback, useEffect, useRef, useState } from 'react';
import type { FrontendCatalog } from '@skilltree/graph-domain/frontend-catalog';
import { createCareerScene, type CareerScene } from '@skilltree/graph-domain/career-scene';

export type ScenePhase = 'idle' | 'leaving' | 'preparing' | 'entering';
function pause(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(new Error('cancelled')); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', cancel); resolve(); }, ms);
    if (signal.aborted) cancel(); else signal.addEventListener('abort', cancel, { once: true });
  });
}

/** A new request cancels every pending stage of the preceding transition. */
export function useCareerScene(catalog: FrontendCatalog) {
  const [scene, setScene] = useState<CareerScene>();
  const [phase, setPhase] = useState<ScenePhase>('preparing');
  const [requestedRoleId, setRequestedRoleId] = useState<string>();
  const [error, setError] = useState('');
  const current = useRef<CareerScene | undefined>(undefined);
  const pending = useRef<AbortController | undefined>(undefined);
  const cache = useRef(new Map<string, Promise<CareerScene>>());
  const requestVersion = useRef(0);
  const load = useCallback((roleId?: string) => {
    const key = roleId ?? 'overview';
    if (!cache.current.has(key)) cache.current.set(key, createCareerScene(catalog, roleId).catch(error => { cache.current.delete(key); throw error; }));
    return cache.current.get(key)!;
  }, [catalog]);
  useEffect(() => {
    let alive = true;
    void load().then(value => { if (alive && requestVersion.current === 0) { current.current = value; setScene(value); setPhase('idle'); } }).catch(() => { if (alive) { setError('Не удалось построить карту. Попробуй ещё раз.'); setPhase('idle'); } });
    return () => { alive = false; pending.current?.abort(); };
  }, [load]);
  const switchTo = useCallback(async (roleId?: string) => {
    const version = ++requestVersion.current;
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    const signal = controller.signal;
    setRequestedRoleId(roleId); setError('');
    if (current.current && current.current.roleId === roleId) { setPhase('idle'); return true; }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try {
      if (current.current?.roleId) { setPhase('leaving'); await pause(reduced ? 0 : 200, signal); }
      setPhase('preparing');
      // Yield once so the old scene can finish fading before layout calculation.
      await pause(0, signal);
      const value = await load(roleId);
      if (signal.aborted || version !== requestVersion.current) return false;
      current.current = value; setScene(value); setPhase('entering');
      await pause(reduced ? 0 : 720, signal);
      if (version !== requestVersion.current) return false;
      setPhase('idle'); return true;
    } catch {
      if (signal.aborted || version !== requestVersion.current) return false;
      setError('Не удалось построить траекторию. Выбери специальность повторно.'); setPhase('idle');
      setRequestedRoleId(current.current?.roleId); return false;
    }
  }, [load]);
  return { scene, phase, requestedRoleId, error, switchTo };
}
