import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 135 68"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-label="Teach-Back Engine Logo"
  >
    <defs>
      <linearGradient id="logo-gradient" x1="117.5" y1="4.5" x2="68" y2="63" gradientUnits="userSpaceOnUse">
        <stop stopColor="#25A2C4"/>
        <stop offset="1" stopColor="#0073B0"/>
      </linearGradient>
    </defs>
    
    {/* Blue C-shape */}
    <path
      d="M109.1,38.6c-4.1,9.8-14.2,16.5-25.9,16.5C65.5,55.1,51,42.9,51,27.1S65.5,9.1,83.2,9.1 c12,0,22.4,5.9,26.9,14.6"
      stroke="url(#logo-gradient)"
      strokeWidth="11"
      strokeLinecap="round"
    />
    <circle cx="83.2" cy="62.1" r="5" fill="#0073B0"/>
    <circle cx="95.2" cy="62.1" r="2.5" fill="#0073B0"/>

    {/* The 'B' character */}
    <text
      x="84"
      y="45"
      fontFamily="'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif"
      fontSize="30"
      fontWeight="700"
      fill="#25A2C4"
      textAnchor="middle"
    >
      B
    </text>

    {/* Teal speech bubble shape */}
    <path
      d="M60.4 44.5c0 8.3-9.5 15-21.2 15-3.3 0-6.5-.6-9.4-1.7l-7.8 2.5 4.8-3.9c-4.7-3.3-7.7-7.8-7.7-12.9 0-8.3 9.5-15 21.2-15 11.7 0 21.1 6.7 21.1 15z"
      fill="#1D5969"
    />

    {/* The 'T' character */}
    <text
      x="39.5"
      y="49"
      fontFamily="'Segoe UI', 'Roboto', 'Helvetica Neue', sans-serif"
      fontSize="22"
      fontWeight="700"
      fill="white"
      textAnchor="middle"
    >
      T
    </text>
  </svg>
);
