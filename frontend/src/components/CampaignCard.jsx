import React from 'react';
import { Link } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import StatusBadge from './StatusBadge';
import { Users, Clock } from 'lucide-react';

export default function CampaignCard({ campaign }) {
  const percentFunded = parseFloat(campaign.percent_funded || 0);
  const formattedRaised = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(campaign.current_amount || 0);

  const formattedGoal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(campaign.goal_amount || 0);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      <Link to={`/campaigns/${campaign.id}`} className="relative aspect-video overflow-hidden bg-gray-100">
        <img
          src={campaign.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600'}
          alt={campaign.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute top-3 left-3">
          <span className="bg-black/75 backdrop-blur-md text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            {campaign.category_name}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={campaign.status} />
        </div>
      </Link>

      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">
            by <span className="text-gray-900 font-semibold">{campaign.creator_name}</span>
          </p>
          <Link to={`/campaigns/${campaign.id}`} className="block">
            <h3 className="font-bold text-gray-900 text-lg leading-snug line-clamp-2 group-hover:text-brand-600 transition-colors">
              {campaign.title}
            </h3>
          </Link>
          <p className="mt-2 text-sm text-gray-600 line-clamp-2">
            {campaign.description}
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-gray-50">
          <ProgressBar percent={percentFunded} className="mb-3" />

          <div className="grid grid-cols-3 gap-2 text-left">
            <div>
              <p className="text-base font-extrabold text-gray-900">{formattedRaised}</p>
              <p className="text-xs text-gray-500 font-medium">{percentFunded.toFixed(0)}% of {formattedGoal}</p>
            </div>

            <div className="flex flex-col items-start justify-center">
              <div className="flex items-center text-xs text-gray-600 font-semibold">
                <Users className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span>{campaign.backer_count || 0}</span>
              </div>
              <p className="text-xs text-gray-400">backers</p>
            </div>

            <div className="flex flex-col items-start justify-center">
              <div className="flex items-center text-xs text-gray-600 font-semibold">
                <Clock className="w-3.5 h-3.5 mr-1 text-gray-400" />
                <span>{campaign.days_remaining !== undefined ? `${campaign.days_remaining}d` : '--'}</span>
              </div>
              <p className="text-xs text-gray-400">remaining</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

