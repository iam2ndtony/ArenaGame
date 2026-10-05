import React from 'react';

export default function VietnamLandmarksIllustration() {
  return (
    <div style={{
      position: 'absolute',
      bottom: '62px',
      left: 0,
      right: 0,
      height: '180px',
      pointerEvents: 'none',
      overflow: 'hidden',
      zIndex: 0,
      opacity: 0.35,
    }}>
      {/* Sunset dusk sky gradient */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        background: 'linear-gradient(to top, rgba(180, 83, 9, 0.4) 0%, rgba(120, 53, 15, 0.15) 50%, transparent 100%)',
      }} />

      {/* SVG Landmarks and Waving National Flag */}
      <svg
        viewBox="0 0 600 200"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <linearGradient id="landmarkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2a1215" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#140608" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="flagGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="50%" stopColor="#ef4444" />
            <stop offset="100%" stopColor="#b91c1c" />
          </linearGradient>
        </defs>

        {/* Distant building silhouettes */}
        <g fill="url(#landmarkGrad)">
          {/* Left landmark - Van Mieu / Khue Van Cac style */}
          <path d="M 40,200 L 40,140 L 50,140 L 50,125 L 35,125 L 60,105 L 85,125 L 70,125 L 70,140 L 80,140 L 80,200 Z" />
          <path d="M 90,200 L 90,150 L 120,150 L 120,200 Z" />
          <path d="M 130,200 L 130,135 L 140,125 L 150,135 L 150,200 Z" />

          {/* Center landmark - Lang Bac (Mausoleum colonnade & tiers) */}
          <path d="M 230,200 L 230,120 L 240,120 L 240,105 L 250,105 L 250,90 L 350,90 L 350,105 L 360,105 L 360,120 L 370,120 L 370,200 Z" />
          {/* Columns of Mausoleum */}
          <rect x="255" y="120" width="8" height="70" fill="#140608" />
          <rect x="273" y="120" width="8" height="70" fill="#140608" />
          <rect x="291" y="120" width="8" height="70" fill="#140608" />
          <rect x="309" y="120" width="8" height="70" fill="#140608" />
          <rect x="327" y="120" width="8" height="70" fill="#140608" />

          {/* Right landmark - Hanoi Flag Tower / Opera House style */}
          <path d="M 420,200 L 420,145 L 430,140 L 430,120 L 440,120 L 440,95 L 445,95 L 445,80 L 450,80 L 450,200 Z" />
          <path d="M 460,200 L 460,135 L 490,135 L 500,125 L 510,135 L 530,135 L 530,200 Z" />
          <path d="M 540,200 L 540,150 L 570,150 L 570,200 Z" />
        </g>

        {/* Flag Pole in center */}
        <line x1="300" y1="200" x2="300" y2="40" stroke="#94a3b8" strokeWidth="2.5" />
        <circle cx="300" cy="38" r="3" fill="#f59e0b" />

        {/* Waving Red Flag */}
        <path
          d="M 300,42 Q 330,34 360,46 Q 390,58 415,48 L 415,96 Q 390,108 360,94 Q 330,82 300,92 Z"
          fill="url(#flagGrad)"
          stroke="#b91c1c"
          strokeWidth="1"
        />

        {/* Yellow Star in Flag center */}
        <polygon
          points="355,56 358,66 368,66 360,72 363,82 355,76 347,82 350,72 342,66 352,66"
          fill="#facc15"
        />

        {/* Soft ground line */}
        <rect x="0" y="195" width="600" height="5" fill="#100405" />
      </svg>
    </div>
  );
}
