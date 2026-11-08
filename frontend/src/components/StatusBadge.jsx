import React from 'react';

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  successful: 'bg-blue-50 text-blue-700 border-blue-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  pending_approval: 'bg-amber-50 text-amber-700 border-amber-200',
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  cancelled: 'bg-slate-100 text-slate-600 border-slate-300',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  refunded: 'bg-purple-50 text-purple-700 border-purple-200',
};

const statusLabels = {
  active: 'Active',
  successful: 'Funded',
  failed: 'Unsuccessful',
  pending_approval: 'In Review',
  draft: 'Draft',
  cancelled: 'Cancelled',
  confirmed: 'Confirmed',
  refunded: 'Refunded',
};

export default function StatusBadge({ status, className = '' }) {
  const normalized = (status || '').toLowerCase();
  const style = statusStyles[normalized] || 'bg-gray-50 text-gray-600 border-gray-200';
  const label = statusLabels[normalized] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {label}
    </span>
  );
}

