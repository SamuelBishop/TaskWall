import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { onSpeech, LINES } from '../hooks/useLive2D';

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const IDLE_INTERVAL = 5000;

export default function SpeechBubble() {
  const [text, setText] = useState<string | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const showMessage = (msg: string, duration = 6500) => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setText(msg);
    hideTimer.current = setTimeout(() => setText(null), duration);
  };

  // Listen for programmatic speak() calls
  useEffect(() => {
    const unsub = onSpeech(showMessage);
    return unsub;
  }, []);

  // Idle cycling messages
  useEffect(() => {
    // Show first message after a short delay
    const first = setTimeout(() => {
      showMessage(pick(LINES.idle));
    }, 3000);

    idleTimer.current = setInterval(() => {
      // Only show idle if nothing is currently showing
      setText((current) => {
        if (!current) showMessage(pick(LINES.idle));
        return current;
      });
    }, IDLE_INTERVAL);

    return () => {
      clearTimeout(first);
      if (idleTimer.current) clearInterval(idleTimer.current);
    };
  }, []);

  if (!text) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        // Sit to the left of Shizuku's stage (260px wide, docked right)
        right: '270px',
        bottom: '200px',
        zIndex: 99999,
        maxWidth: '200px',
        pointerEvents: 'none',
      }}
    >
      {/* Bubble body */}
      <div
        style={{
          background: '#1e0d3e',
          border: '2px solid #ff1155',
          borderRadius: '14px',
          padding: '12px 15px',
          fontSize: '12.5px',
          lineHeight: '1.65',
          color: '#f0e0ff',
          wordBreak: 'break-word',
          boxShadow: '0 0 18px #ff115555',
          position: 'relative',
        }}
      >
        {text}

        {/* Tail pointing RIGHT toward her */}
        <span style={{
          position: 'absolute',
          right: '-14px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '8px solid transparent',
          borderBottom: '8px solid transparent',
          borderLeft: '14px solid #ff1155',
        }} />
        {/* Inner tail fill */}
        <span style={{
          position: 'absolute',
          right: '-10px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderLeft: '11px solid #1e0d3e',
          zIndex: 1,
        }} />
      </div>
    </div>,
    document.body
  );
}
