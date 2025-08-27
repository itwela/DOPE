"use client";

import { usePostcard } from '../contexts/PostcardContext';

interface ModeSelectorProps {
  className?: string;
}

export default function ModeSelector({ className }: ModeSelectorProps) {
  const { demoMode, setDemoMode } = usePostcard();

  return (
    <div className={className} style={{ display: 'flex', alignItems: 'center', gap: 8, flexDirection: 'row-reverse' }}>
      <span
        className="text-xs select-none"
        style={{ color: demoMode ? '#ff3f17' : '#d4d4d4', fontWeight: demoMode ? 700 : 400, cursor: 'pointer', order: 2 }}
        onClick={() => setDemoMode(true)}
      >
        Demo Mode
      </span>
      <label style={{ display: 'inline-block', width: 32, height: 18, position: 'relative', cursor: 'pointer', order: 1 }}>
        <input type="checkbox" checked={!demoMode} onChange={() => setDemoMode(!demoMode)} style={{ display: 'none' }} />
        <span style={{ position: 'absolute', left: 0, top: 0, width: 32, height: 18, background: demoMode ? '#333' : '#ff3f17', borderRadius: 9, transition: 'background 0.2s' }}></span>
        <span style={{ position: 'absolute', left: demoMode ? 2 : 16, top: 2, width: 14, height: 14, background: '#fff', borderRadius: '50%', transition: 'left 0.2s' }}></span>
      </label>
      <span
        className="text-xs select-none"
        style={{ color: !demoMode ? '#ff3f17' : '#d4d4d4', fontWeight: !demoMode ? 700 : 400, cursor: 'pointer', order: 0 }}
        onClick={() => setDemoMode(false)}
      >
        URL Mode
      </span>
    </div>
  );
}
