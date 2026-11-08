import React from 'react';

export default function ProgressBar({ current, goal, percent, className = '' }) {
  const percentage = percent !== undefined ? percent : goal > 0 ? (current / goal) * 100 : 0;
  const clamped = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            percentage >= 100 ? 'bg-emerald-500' : 'bg-brand-600'
          }`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}

