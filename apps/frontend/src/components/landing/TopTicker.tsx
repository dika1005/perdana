import React from 'react';
import { MARQUEE_ITEMS } from '../../data/landingData';

interface TopTickerProps {
  items?: string[];
}

export const TopTicker: React.FC<TopTickerProps> = React.memo(({ items = MARQUEE_ITEMS }) => {
  const displayItems = [...items, ...items, ...items];

  return (
    <div className="relative z-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white py-2 overflow-hidden shadow-sm">
      <div className="animate-neo-marquee font-bold text-xs tracking-wider uppercase flex items-center gap-10">
        {displayItems.map((item, index) => (
          <div key={index} className="flex items-center gap-8">
            <span>{item}</span>
            <span className="inline-block w-1.5 h-1.5 bg-white/70 rounded-full"></span>
          </div>
        ))}
      </div>
    </div>
  );
});

TopTicker.displayName = 'TopTicker';
