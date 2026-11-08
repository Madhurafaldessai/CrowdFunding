import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { Heart, AlertCircle, RefreshCw, XCircle, ArrowUpRight } from 'lucide-react';

export default function MyPledgesPage() {
  const [pledges, setPledges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState(null);

  const loadPledges = async () => {
    try {
      const res = await api.get('/pledges/mine');
      setPledges(res.data.data.pledges || []);
    } catch (err) {
      toast.error('Failed to load pledge history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPledges();
  }, []);

  const handleCancelPledge = async (pledgeId) => {
    if (!window.confirm('Are you sure you want to cancel this pledge? A refund will be issued immediately.')) {
      return;
    }

    setCancellingId(pledgeId);
    try {
      const res = await api.post(`/pledges/${pledgeId}/cancel`);
      toast.success(res.data.message || 'Pledge cancelled and refund issued.');
      await loadPledges();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancellation failed.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return <Loader text="Loading your pledge history..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Pledges</h1>
        <p className="text-gray-500 mt-1">Review your backed projects, transaction records, and cancellation status.</p>
      </div>

      {pledges.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-16 text-center space-y-4">
          <Heart className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-lg font-bold text-gray-800">No pledges yet</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            You haven't backed any campaigns yet. Explore exciting creative projects and support independent creators.
          </p>
          <Link
            to="/browse"
            className="inline-block px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm"
          >
            Explore Projects
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Campaign</th>
                  <th className="py-4 px-6">Reward Tier</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">References</th>
                  <th className="py-4 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {pledges.map((p) => (
                  <tr key={p.pledge_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/campaigns/${p.campaign_id}`}
                        className="font-bold text-gray-900 hover:text-brand-600 transition-colors flex items-center space-x-1"
                      >
                        <span className="line-clamp-1">{p.campaign_title}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                      </Link>
                      <span className="text-xs text-gray-400">
                        Backed on {new Date(p.pledged_at).toLocaleDateString()}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-xs font-semibold text-gray-800">
                        {p.tier_title || 'No Reward (Custom Pledge)'}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="text-base font-black text-gray-900">
                        ${Number(p.amount).toLocaleString()}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={p.pledge_status} />
                    </td>

                    <td className="py-4 px-6 space-y-1">
                      {p.transaction_ref && (
                        <p className="text-[11px] text-gray-500 font-mono">
                          Txn: {p.transaction_ref}
                        </p>
                      )}
                      {p.refund_ref && (
                        <p className="text-[11px] text-purple-600 font-mono font-bold">
                          Refund: {p.refund_ref}
                        </p>
                      )}
                    </td>

                    <td className="py-4 px-6 text-right">
                      {p.is_cancellable ? (
                        <button
                          onClick={() => handleCancelPledge(p.pledge_id)}
                          disabled={cancellingId === p.pledge_id}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {cancellingId === p.pledge_id ? 'Cancelling...' : 'Cancel & Refund'}
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400 font-normal">
                          {p.pledge_status === 'confirmed' ? 'Past Deadline' : 'Settled'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

