import React from 'react';

interface DabinLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'horizontal' | 'mark' | 'receipt';
  showSlogan?: boolean;
  sloganLanguage?: 'fr' | 'en' | 'both';
  lightMode?: boolean;
}

export const DabinLogo: React.FC<DabinLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'full',
  showSlogan = true,
  sloganLanguage = 'fr',
  lightMode = false,
}) => {
  // Brand color constants
  const burgundy = '#7B173B';
  const black = lightMode ? '#FFFFFF' : '#171719';
  const muted = lightMode ? '#D1D5DB' : '#4B5563';

  // Sizing mappings
  const heightMap = {
    xs: 'h-8',
    sm: 'h-10',
    md: 'h-14',
    lg: 'h-20',
    xl: 'h-28',
  };

  if (variant === 'mark') {
    return (
      <svg
        viewBox="0 0 200 200"
        className={`${heightMap[size]} w-auto ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="DABIN Fashion Emblem"
      >
        {/* Metal Hook */}
        <path
          d="M100 20 C100 12, 114 12, 114 24 C114 36, 100 38, 100 50"
          stroke={black}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        {/* Hanger Silhouette */}
        <path
          d="M100 50 L160 85 C164 87, 162 93, 156 93 L44 93 C38 93, 36 87, 40 85 Z"
          fill={black}
        />
        {/* Ribbed Knitted Draped Sleeve (Burgundy) */}
        <path
          d="M80 62 C85 70, 115 70, 120 78 C122 84, 110 92, 95 90 C80 88, 70 85, 60 95 C50 105, 45 130, 40 155 C35 156, 25 155, 25 145 C30 115, 38 85, 60 70 Z"
          fill={burgundy}
        />
        {/* Rib Knit Texture Lines */}
        <path
          d="M48 85 L35 145 M55 87 L42 148 M62 90 L48 150"
          stroke="#5a102b"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        {/* D Letter initial */}
        <text
          x="100"
          y="150"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="bold"
          fontSize="48"
          fill={black}
        >
          D
        </text>
      </svg>
    );
  }

  return (
    <div className={`inline-flex items-center select-none ${className}`}>
      <svg
        viewBox="0 0 320 220"
        className={`${heightMap[size]} w-auto transition-transform`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* 1. Hanger Hook */}
        <path
          d="M160 16 C160 6, 178 6, 178 20 C178 34, 160 36, 160 48"
          stroke={black}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* 2. Coat Hanger Triangular Body */}
        <path
          d="M160 48 L224 82 C229 84, 226 91, 220 91 L100 91 C94 91, 91 84, 96 82 Z"
          fill={black}
        />
        {/* Center hanger inner cutout */}
        <path
          d="M160 58 L206 82 L114 82 Z"
          fill={lightMode ? '#171719' : '#FFFFFF'}
          opacity="0.95"
        />

        {/* 3. Draped Knit Garment Over Hanger (Burgundy #7B173B) */}
        {/* Collar Fold */}
        <path
          d="M130 65 C145 74, 185 74, 205 82 C210 85, 202 92, 185 91 C165 90, 140 85, 126 95 C115 103, 102 125, 96 150 C92 165, 84 175, 75 174 C66 173, 64 162, 68 145 C75 116, 85 85, 112 68 Z"
          fill={burgundy}
          filter="url(#subtle-shadow)"
        />

        {/* Ribbed Knit Fine Texture Detailing */}
        <g stroke="#560f29" strokeWidth="1.2" strokeLinecap="round" opacity="0.65">
          <line x1="140" y1="74" x2="132" y2="86" />
          <line x1="150" y1="75" x2="142" y2="88" />
          <line x1="162" y1="76" x2="154" y2="89" />
          <line x1="174" y1="77" x2="166" y2="90" />
          <line x1="186" y1="79" x2="178" y2="91" />
          
          {/* Vertical Drape Ribs */}
          <line x1="118" y1="92" x2="88" y2="158" />
          <line x1="110" y1="98" x2="82" y2="162" />
          <line x1="102" y1="106" x2="76" y2="166" />
          <line x1="94" y1="116" x2="72" y2="168" />
        </g>

        {/* 4. Brand Name: DABIN (Bold Classic High-Contrast Serif) */}
        <text
          x="195"
          y="136"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="900"
          fontSize="48"
          letterSpacing="4"
          fill={black}
        >
          DABIN
        </text>

        {/* 5. Cursive Calligraphy: Fashion with sweeping bottom flourish loop */}
        {/* Flourish loop sweeping beneath on left */}
        <path
          d="M135 158 C90 152, 45 158, 48 185 C51 205, 95 208, 140 190 C165 180, 180 168, 160 162"
          stroke={burgundy}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M52 188 C70 170, 110 168, 132 176"
          stroke={burgundy}
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />

        {/* Calligraphic "Fashion" text */}
        <text
          x="215"
          y="172"
          textAnchor="middle"
          fontFamily="'Brush Script MT', 'Snell Roundhand', 'Playfair Display', cursive, serif"
          fontStyle="italic"
          fontWeight="700"
          fontSize="44"
          letterSpacing="1"
          fill={burgundy}
        >
          Fashion
        </text>

        {/* 6. Slogan: LA MODE À VOTRE PORTE / FASHION AT YOUR DOORSTEP */}
        {showSlogan && (
          <text
            x="215"
            y="202"
            textAnchor="middle"
            fontFamily="'Plus Jakarta Sans', system-ui, sans-serif"
            fontWeight="700"
            fontSize="11"
            letterSpacing="2.8"
            fill={muted}
          >
            {sloganLanguage === 'fr'
              ? 'LA MODE À VOTRE PORTE'
              : sloganLanguage === 'en'
              ? 'FASHION AT YOUR DOORSTEP'
              : 'LA MODE À VOTRE PORTE'}
          </text>
        )}
      </svg>
    </div>
  );
};
