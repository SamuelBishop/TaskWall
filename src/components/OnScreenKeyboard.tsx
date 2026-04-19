import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface OnScreenKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

const ALPHA_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm'],
];

const NUM_SYMBOLS = [
  ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
  ['-', '/', ':', ';', '(', ')', '$', '&', '@', '"'],
  ['.', ',', '?', '!', "'", '#', '%', '+', '='],
];

const KEY = 'h-[64px] rounded-lg bg-white border border-gray-200 text-wall-text text-base font-medium hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-sm flex items-center justify-center';
const ACTION_KEY = 'h-[64px] rounded-lg border text-sm font-medium transition-colors shadow-sm flex items-center justify-center';
// Letter key width: 80% of 1280px = 1024px, minus 9 gaps of 5px = 979px, / 10 keys ≈ 97px
const LETTER_KEY_W = 'w-[97px] flex-shrink-0';
const MODIFIER_W = 'w-[120px] flex-shrink-0';

export default function OnScreenKeyboard({ value, onChange, onClose }: OnScreenKeyboardProps) {
  const [shifted, setShifted] = useState(false);
  const [numMode, setNumMode] = useState(false);

  const press = useCallback(
    (key: string) => {
      onChange(value + (shifted ? key.toUpperCase() : key));
      if (shifted) setShifted(false);
    },
    [value, onChange, shifted]
  );

  const backspace = useCallback(() => onChange(value.slice(0, -1)), [value, onChange]);
  const space = useCallback(() => onChange(value + ' '), [value, onChange]);

  const rows = numMode ? NUM_SYMBOLS : ALPHA_ROWS;

  const portalTarget = document.getElementById('taskwall-root');

  const keyboard = (
    <div
      className="absolute inset-0 z-[100] bg-wall-bg flex flex-col"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Input + Back button */}
      <div className="flex gap-3 px-6 pt-5 pb-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type task name…"
          className="flex-1 h-[64px] bg-white border border-wall-border rounded-lg px-4 text-lg text-wall-text outline-none focus:border-wall-today"
          autoFocus
        />
        <button
          type="button"
          onPointerDown={(e) => { e.preventDefault(); onClose(); }}
          className="h-[64px] px-5 rounded-lg bg-gray-100 border border-gray-300 text-wall-text text-sm font-semibold hover:bg-gray-200 active:bg-gray-300 transition-colors flex items-center gap-1.5"
        >
          ← Back
        </button>
      </div>

      {/* Keyboard */}
      <div className="flex-1 flex flex-col justify-end items-center px-3 pb-3 gap-[6px]">
        {rows.map((row, i) => {
          // Stagger: row 0 = no offset, row 1 = half-key offset, row 2 = shift key acts as offset
          const isMiddleRow = i === 1 && !numMode;
          return (
            <div key={i} className="flex gap-[5px] w-[80%]">
              {/* Half-key spacer for A-row stagger */}
              {isMiddleRow && <div className="w-[40px] flex-shrink-0" />}

              {i === 2 && !numMode && (
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); setShifted((s) => !s); }}
                  className={`${ACTION_KEY} ${MODIFIER_W} -ml-[20px] ${shifted ? 'bg-wall-today text-white border-blue-600' : 'bg-gray-100 text-wall-text border-gray-200 hover:bg-gray-200'}`}
                >
                  ⇧
                </button>
              )}
              {row.map((key) => (
                <button
                  key={key}
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); press(key); }}
                  className={`${KEY} ${LETTER_KEY_W}`}
                >
                  {numMode ? key : shifted ? key.toUpperCase() : key}
                </button>
              ))}
              {i === 2 && (
                <button
                  type="button"
                  onPointerDown={(e) => { e.preventDefault(); backspace(); }}
                  className={`${ACTION_KEY} ${numMode ? LETTER_KEY_W : `${MODIFIER_W} -mr-[20px]`} bg-gray-100 text-wall-text border-gray-200 hover:bg-gray-200 active:bg-gray-300`}
                >
                  ⌫
                </button>
              )}

              {/* Half-key spacer for A-row stagger (right side) */}
              {isMiddleRow && <div className="w-[40px] flex-shrink-0" />}
            </div>
          );
        })}

        {/* Bottom row */}
        <div className="flex gap-[5px] w-[80%]">
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); setNumMode((n) => !n); }}
            className={`${ACTION_KEY} ${MODIFIER_W} bg-gray-100 text-wall-text border-gray-200 hover:bg-gray-200`}
          >
            {numMode ? 'ABC' : '123'}
          </button>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); space(); }}
            className={`${KEY} w-[686px] flex-shrink-0`}
          >
            space
          </button>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onChange(value + '.'); }}
            className={`${KEY} ${LETTER_KEY_W}`}
          >
            .
          </button>
          <button
            type="button"
            onPointerDown={(e) => { e.preventDefault(); onClose(); }}
            className={`${ACTION_KEY} ${LETTER_KEY_W} bg-wall-today text-white border-blue-600 hover:bg-blue-700 active:bg-blue-800`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return portalTarget ? createPortal(keyboard, portalTarget) : keyboard;
}
