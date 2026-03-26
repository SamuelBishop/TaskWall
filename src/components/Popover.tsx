import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
}

export default function Popover({ open, onClose, children, className = '', align = 'left' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [ready, setReady] = useState(false);

  const updatePos = useCallback(() => {
    const parent = anchorRef.current?.parentElement;
    if (!parent || !ref.current) return;
    const rect = parent.getBoundingClientRect();
    const popRect = ref.current.getBoundingClientRect();

    let top = rect.bottom + 4;
    let left = align === 'right' ? rect.right - popRect.width : rect.left;

    // Keep within viewport
    if (top + popRect.height > window.innerHeight - 8) {
      top = Math.max(8, window.innerHeight - popRect.height - 8);
    }
    if (left + popRect.width > window.innerWidth - 8) {
      left = window.innerWidth - popRect.width - 8;
    }
    if (left < 8) left = 8;

    setPos({ top, left });
  }, [align]);

  useEffect(() => {
    if (!open) { setReady(false); return; }
    const rafId = requestAnimationFrame(() => {
      updatePos();
      setReady(true);
    });
    window.addEventListener('scroll', updatePos, true);
    window.addEventListener('resize', updatePos);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', updatePos, true);
      window.removeEventListener('resize', updatePos);
    };
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && ref.current.contains(e.target as Node)) return;
      const parent = anchorRef.current?.parentElement;
      if (parent && parent.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  const anchor = <span ref={anchorRef} style={{ display: 'none' }} />;

  if (!open) return anchor;

  // Strip positional classes (top-*, left-*, right-*, bottom-*) — handled via computed style
  const styleClassName = className.replace(/\b(top|bottom|left|right)-\S+/g, '').trim();

  return (
    <>
      {anchor}
      {createPortal(
        <div
          ref={ref}
          style={{ top: pos.top, left: pos.left, visibility: ready ? 'visible' : 'hidden' }}
          className={`fixed z-50 bg-white border border-wall-border rounded-lg shadow-lg ${styleClassName}`}
        >
          {children}
        </div>,
        document.body
      )}
    </>
  );
}
