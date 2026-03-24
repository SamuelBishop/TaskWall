import { useRef, useEffect, useCallback } from 'react';

/**
 * Enables drag-to-scroll on a container, so pointer-based touch displays
 * (like RPi touchscreens) can scroll by holding and swiping vertically.
 */
export function useDragScroll<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const state = useRef({ dragging: false, startY: 0, scrollTop: 0 });

  const onPointerDown = useCallback((e: PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    // Only handle primary button / touch
    if (e.button !== 0) return;
    // Don't intercept clicks on interactive elements
    const tag = (e.target as HTMLElement).closest('button, a, input, select, textarea');
    if (tag) return;
    state.current = { dragging: true, startY: e.clientY, scrollTop: el.scrollTop };
    el.setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!state.current.dragging) return;
    const el = ref.current;
    if (!el) return;
    const dy = e.clientY - state.current.startY;
    el.scrollTop = state.current.scrollTop - dy;
  }, []);

  const onPointerUp = useCallback((e: PointerEvent) => {
    if (!state.current.dragging) return;
    state.current.dragging = false;
    ref.current?.releasePointerCapture(e.pointerId);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
    };
  }, [onPointerDown, onPointerMove, onPointerUp]);

  return ref;
}
