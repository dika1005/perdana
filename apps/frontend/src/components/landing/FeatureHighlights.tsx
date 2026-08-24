import React from 'react';
import { FEATURE_HIGHLIGHTS, FeatureHighlight } from '../../data/landingData';

interface FeatureHighlightsProps {
  features?: FeatureHighlight[];
}

export const FeatureHighlights: React.FC<FeatureHighlightsProps> = React.memo(({
  features = FEATURE_HIGHLIGHTS
}) => {
  return (
    <section className="relative z-10 max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 pb-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 xl:gap-6">
        {features.map((item, idx) => (
          <div key={idx} className="glass-card glass-card-hover p-5 sm:p-6 rounded-2xl flex items-start gap-3.5 group">
            <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">{item.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
});

FeatureHighlights.displayName = 'FeatureHighlights';
