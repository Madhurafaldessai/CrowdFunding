import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
  PlusCircle,
  Edit,
  Eye,
  Rocket,
  Users,
  DollarSign,
  TrendingUp,
  MessageSquare,
  AlertCircle,
  FilePlus2,
  XCircle,
} from 'lucide-react';

export default function CreatorDashboardPage() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  // Updates form modal state
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedCampaignForUpdate, setSelectedCampaignForUpdate] = useState(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateContent, setUpdateContent] = useState('');
  const [postingUpdate, setPostingUpdate] = useState(false);

  // Backer pledges inspector modal state
  const [isPledgesModalOpen, setIsPledgesModalOpen] = useState(false);
  const [campaignPledges, setCampaignPledges] = useState([]);
  const [selectedCampaignTitle, setSelectedCampaignTitle] = useState('');
  const [loadingPledges, setLoadingPledges] = useState(false);

  const loadCreatorCampaigns = async () => {
    try {
      const res = await api.get('/creator/campaigns');
      setCampaigns(res.data.data.campaigns || []);
    } catch (err) {
      toast.error('Failed to load creator campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCreatorCampaigns();
  }, []);

  const handleOpenUpdateModal = (campaign) => {
    setSelectedCampaignForUpdate(campaign);
    setUpdateTitle('');
    setUpdateContent('');
    setIsUpdateModalOpen(true);
  };

  const handlePostUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!updateTitle || !updateContent) return;

    setPostingUpdate(true);
    try {
      await api.post(`/campaigns/${selectedCampaignForUpdate.campaign_id}/updates`, {
        title: updateTitle.trim(),
        content: updateContent.trim(),
      });
      toast.success('Campaign update published to backers!');
      setIsUpdateModalOpen(false);
      await loadCreatorCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post update.');
    } finally {
      setPostingUpdate(false);
    }
  };

  const handleViewPledges = async (campaign) => {
    setSelectedCampaignTitle(campaign.title);
    setIsPledgesModalOpen(true);
    setLoadingPledges(true);
    try {
      const res = await api.get(`/creator/campaigns/${campaign.campaign_id}/pledges`);
      setCampaignPledges(res.data.data.pledges || []);
    } catch (err) {
      toast.error('Failed to fetch pledge details.');
    } finally {
      setLoadingPledges(false);
    }
  };

  const handleSubmitForApproval = async (campaignId) => {
    try {
      await api.post(`/campaigns/${campaignId}/submit`);
      toast.success('Submitted for administrative approval!');
      await loadCreatorCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed.');
    }
  };

  if (loading) return <Loader text="Loading Creator Studio..." />;

  const totalRaised = campaigns.reduce((acc, c) => acc + parseFloat(c.current_amount || 0), 0);
  const totalBackers = campaigns.reduce((acc, c) => acc + parseInt(c.backer_count || 0, 10), 0);
  const activeCount = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Creator Studio</h1>
          <p className="text-gray-500 mt-1">Manage campaigns, monitor funding velocity, and engage with backers.</p>
        </div>
        <Link
          to="/campaigns/new"
          className="inline-flex items-center px-5 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-sm shadow-md shadow-brand-500/25 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Create New Campaign
        </Link>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Raised</p>
            <p className="text-2xl font-black text-gray-900">${totalRaised.toLocaleString()}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Backers</p>
            <p className="text-2xl font-black text-gray-900">{totalBackers}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Campaigns</p>
            <p className="text-2xl font-black text-gray-900">{activeCount}</p>
          </div>
        </div>
      </div>

      {/* Campaigns Management Table */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-black text-gray-900">Your Campaigns ({campaigns.length})</h2>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p>You haven't created any campaigns yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Campaign</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Raised / Goal</th>
                  <th className="py-4 px-6">Progress</th>
                  <th className="py-4 px-6">Backers</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {campaigns.map((c) => (
                  <tr key={c.campaign_id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="py-4 px-6 max-w-xs">
                      <p className="font-bold text-gray-900 line-clamp-1">{c.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.days_remaining !== undefined ? `${c.days_remaining} days left` : 'Finished'}
                      </p>
                    </td>

                    <td className="py-4 px-6">
                      <StatusBadge status={c.status} />
                    </td>

                    <td className="py-4 px-6">
                      <p className="font-black text-gray-900">${Number(c.current_amount).toLocaleString()}</p>
                      <p className="text-xs text-gray-400">of ${Number(c.goal_amount).toLocaleString()}</p>
                    </td>

                    <td className="py-4 px-6 w-36">
                      <p className="text-xs font-bold text-gray-700 mb-1">{c.percent_funded}%</p>
                      <ProgressBar percent={c.percent_funded} />
                    </td>

                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleViewPledges(c)}
                        className="font-bold text-brand-600 hover:text-brand-800 text-xs hover:underline"
                      >
                        {c.backer_count} backers
                      </button>
                    </td>

                    <td className="py-4 px-6 text-right space-x-2">
                      <Link
                        to={`/campaigns/${c.campaign_id}`}
                        className="inline-flex p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                        title="View Public Page"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {['draft', 'pending_approval'].includes(c.status) && (
                        <Link
                          to={`/campaigns/${c.campaign_id}/edit`}
                          className="inline-flex p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Campaign"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}

                      {c.status === 'draft' && (
                        <button
                          onClick={() => handleSubmitForApproval(c.campaign_id)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                        >
                          <Rocket className="w-3.5 h-3.5 mr-1" />
                          Submit
                        </button>
                      )}

                      {c.status === 'active' && (
                        <button
                          onClick={() => handleOpenUpdateModal(c)}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 text-xs font-bold transition-colors"
                        >
                          <FilePlus2 className="w-3.5 h-3.5 mr-1" />
                          Post Update
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Post Campaign Update Modal */}
      <Modal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        title={`Post Update: ${selectedCampaignForUpdate?.title}`}
      >
        <form onSubmit={handlePostUpdateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Update Title</label>
            <input
              type="text"
              placeholder="e.g. Prototype Rev 2 Complete!"
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Message to Backers</label>
            <textarea
              rows={6}
              placeholder="Share your manufacturing progress, milestone achievements, or photos..."
              value={updateContent}
              onChange={(e) => setUpdateContent(e.target.value)}
              className="w-full p-4 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsUpdateModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={postingUpdate}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {postingUpdate ? 'Publishing...' : 'Publish Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Backer Pledges Inspector Modal */}
      <Modal
        isOpen={isPledgesModalOpen}
        onClose={() => setIsPledgesModalOpen(false)}
        title={`Backers: ${selectedCampaignTitle}`}
        maxWidth="max-w-3xl"
      >
        {loadingPledges ? (
          <Loader text="Loading backer list..." />
        ) : campaignPledges.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No pledges received yet.</p>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-bold">
                  <th className="py-2.5 px-4">Backer</th>
                  <th className="py-2.5 px-4">Reward Tier</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {campaignPledges.map((p) => (
                  <tr key={p.pledge_id}>
                    <td className="py-2.5 px-4 font-bold text-gray-800">{p.backer_name}</td>
                    <td className="py-2.5 px-4 text-gray-600">{p.tier_title || 'Custom'}</td>
                    <td className="py-2.5 px-4 font-black text-gray-900">${Number(p.amount).toLocaleString()}</td>
                    <td className="py-2.5 px-4"><StatusBadge status={p.status} /></td>
                    <td className="py-2.5 px-4 text-gray-400">{new Date(p.pledged_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}

