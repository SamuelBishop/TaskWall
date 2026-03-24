import { useRef, useEffect } from 'react';

interface PopoverProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Popover({ open, onClose, children, className = '' }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      // Skip if click is inside the popover itself
      if (ref.current && ref.current.contains(e.target as Node)) return;
      // Skip if click is on the trigger button (parent container of the popover)
      // This prevents the race where outside-click closes then button-click re-opens
      const parent = ref.current?.parentElement;
      if (parent && parent.contains(e.target as Node)) return;
      onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`absolute z-50 bg-white border border-wall-border rounded-lg shadow-lg ${className}`}
    >
      {children}
    </div>
  );
}
