import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
  Users,
  Clock,
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  FileText,
  Gift,
  CreditCard,
  Lock,
} from 'lucide-react';

export default function CampaignDetailsPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [updates, setUpdates] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('story'); // 'story' | 'updates' | 'comments'

  // Pledge modal state
  const [isPledgeModalOpen, setIsPledgeModalOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [forcedOutcome, setForcedOutcome] = useState('SUCCESS');
  const [submittingPledge, setSubmittingPledge] = useState(false);

  // Comment post state
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const loadCampaign = async () => {
    try {
      const res = await api.get(`/campaigns/${id}`);
      setCampaign(res.data.data.campaign);
    } catch (err) {
      toast.error('Failed to load campaign.');
    }
  };

  const loadUpdates = async () => {
    try {
      const res = await api.get(`/campaigns/${id}/updates`);
      setUpdates(res.data.data.updates || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadComments = async () => {
    try {
      const res = await api.get(`/campaigns/${id}/comments`);
      setComments(res.data.data.comments || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadCampaign(), loadUpdates(), loadComments()]).finally(() => {
      setLoading(false);
    });
  }, [id]);

  const handleOpenPledgeModal = (tier = null) => {
    if (!isAuthenticated) {
      toast('Please log in to back this project.', { icon: '🔐' });
      navigate('/login');
      return;
    }
    if (user?.id === campaign?.creator_id) {
      toast.error('Creators cannot pledge to their own campaigns.');
      return;
    }
    setSelectedTier(tier);
    setPledgeAmount(tier ? tier.min_amount.toString() : '25');
    setForcedOutcome('SUCCESS');
    setIsPledgeModalOpen(true);
  };

  const handlePledgeSubmit = async (e) => {
    e.preventDefault();
    const amountNum = parseFloat(pledgeAmount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid pledge amount.');
      return;
    }

    if (selectedTier && amountNum < parseFloat(selectedTier.min_amount)) {
      toast.error(`Pledge must be at least $${selectedTier.min_amount} for this tier.`);
      return;
    }

    setSubmittingPledge(true);
    try {
      const res = await api.post(`/campaigns/${id}/pledges`, {
        amount: amountNum,
        tierId: selectedTier ? selectedTier.id : null,
        forcedPaymentOutcome: forcedOutcome,
      });

      toast.success(res.data.message || 'Pledge confirmed successfully!');
      setIsPledgeModalOpen(false);
      // Refresh campaign progress immediately without full reload
      await loadCampaign();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Pledge processing failed.';
      toast.error(msg);
    } finally {
      setSubmittingPledge(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      const res = await api.post(`/campaigns/${id}/comments`, {
        comment: newComment.trim(),
      });
      toast.success('Comment posted!');
      setNewComment('');
      setComments([res.data.data.comment, ...comments]);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post comment.');
    } finally {
      setSubmittingComment(false);
    }
  };

  if (loading) {
    return <Loader text="Loading campaign details..." />;
  }

  if (!campaign) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800">Campaign not found</h2>
        <Link to="/browse" className="mt-4 inline-block text-brand-600 font-semibold">
          Return to browse
        </Link>
      </div>
    );
  }

  const percentFunded = parseFloat(campaign.percent_funded || 0);
  const isCreator = user?.id === campaign.creator_id;
  const isActive = campaign.status === 'active';

  return (
    <div className="w-full max-w-none mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10 lg:py-14 space-y-10 lg:space-y-12">
      {/* Top Header */}
      <div className="space-y-4 max-w-5xl">
        <div className="flex items-center space-x-3">
          <Link
            to={`/browse?category=${campaign.category_slug}`}
            className="text-xs font-bold uppercase tracking-wider text-brand-600 bg-brand-50 hover:bg-brand-100 px-3 py-1 rounded-full transition-colors"
          >
            {campaign.category_name}
          </Link>
          <StatusBadge status={campaign.status} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-gray-900 tracking-tight leading-tight">
          {campaign.title}
        </h1>

        <p className="text-lg text-gray-600 leading-relaxed">
          {campaign.description}
        </p>

        <div className="flex items-center space-x-3 pt-2">
          <img
            src={campaign.creator_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
            alt={campaign.creator_name}
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          <div>
            <p className="text-xs text-gray-500 font-medium">Campaign Creator</p>
            <p className="text-sm font-bold text-gray-900">{campaign.creator_name}</p>
          </div>
        </div>
      </div>

      {/* Hero Media + Funding Stats Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_480px] 2xl:grid-cols-[minmax(0,1fr)_520px] gap-8 xl:gap-12 items-start">
        {/* Main Image */}
        <div className="aspect-video lg:aspect-auto lg:h-[clamp(300px,27vw,440px)] rounded-3xl overflow-hidden bg-gray-100 shadow-md">
          <img
            src={campaign.image_url || 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1000'}
            alt={campaign.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Funding Stats Box */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xl space-y-6">
          <ProgressBar percent={percentFunded} className="h-3" />

          <div className="space-y-5">
            <div>
              <p className="text-4xl sm:text-5xl font-black text-brand-600 tracking-tight">
                ${Number(campaign.current_amount).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500 font-semibold mt-1">
                pledged of <strong className="text-gray-900">${Number(campaign.goal_amount).toLocaleString()}</strong> goal
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
              <div>
                <p className="text-2xl font-black text-gray-900">{campaign.backer_count}</p>
                <p className="text-xs text-gray-500 font-semibold">Backers</p>
              </div>

              <div>
                <p className="text-2xl font-black text-gray-900">{campaign.days_remaining}</p>
                <p className="text-xs text-gray-500 font-semibold">Days to go</p>
              </div>
            </div>

            {/* All or nothing disclaimer */}
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-start space-x-3 text-xs text-gray-600">
              <Sparkles className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>All or nothing.</strong> This project will only be funded if it reaches its goal by {new Date(campaign.deadline).toLocaleDateString()}.
              </span>
            </div>

            {/* Back this project CTA */}
            {isActive ? (
              isCreator ? (
                <div className="p-4 rounded-xl bg-amber-50 text-amber-800 text-sm font-semibold text-center border border-amber-200">
                  You are the creator of this campaign.
                </div>
              ) : (
                <button
                  onClick={() => handleOpenPledgeModal(null)}
                  className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-base shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2"
                >
                  <Gift className="w-5 h-5" />
                  <span>Back this project</span>
                </button>
              )
            ) : (
              <div className="p-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold text-center">
                This campaign is {campaign.status}. Pledges are closed.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Tabs & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_480px] 2xl:grid-cols-[minmax(0,1fr)_520px] gap-8 xl:gap-12 items-start">
        {/* Left Column: Tabs Content */}
        <div className="space-y-8">
          {/* Tabs navigation */}
          <div className="flex border-b border-gray-200 space-x-8">
            <button
              onClick={() => setActiveTab('story')}
              className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'story'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Story</span>
            </button>

            <button
              onClick={() => setActiveTab('updates')}
              className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'updates'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Updates ({updates.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
                activeTab === 'comments'
                  ? 'border-brand-600 text-brand-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Community ({comments.length})</span>
            </button>
          </div>

          {/* Tab 1: Story */}
          {activeTab === 'story' && (
            <div className="prose prose-emerald max-w-none bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-xl font-black text-gray-900">About the Project</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line text-base">
                {campaign.story || campaign.description}
              </p>
            </div>
          )}

          {/* Tab 2: Updates */}
          {activeTab === 'updates' && (
            <div className="space-y-6">
              {updates.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl border border-gray-100 text-center text-gray-500">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold">No updates posted yet.</p>
                </div>
              ) : (
                updates.map((u) => (
                  <div key={u.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-brand-600 bg-brand-50 px-2.5 py-1 rounded-full">
                        Creator Update
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900">{u.title}</h4>
                    <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
                      {u.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 3: Comments */}
          {activeTab === 'comments' && (
            <div className="space-y-8">
              {/* Comment Post Box */}
              {isAuthenticated ? (
                <form onSubmit={handleCommentSubmit} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
                  <label className="block text-sm font-bold text-gray-900">Leave a comment or question</label>
                  <textarea
                    rows={3}
                    placeholder="Ask the creator about specs, delivery, or share your thoughts..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="w-full p-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={submittingComment || !newComment.trim()}
                      className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                    >
                      {submittingComment ? 'Posting...' : 'Post Comment'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-center text-sm text-gray-600">
                  <Link to="/login" className="text-brand-600 font-bold hover:underline">
                    Log in
                  </Link>{' '}
                  to join the conversation and leave a comment.
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4">
                {comments.length === 0 ? (
                  <p className="text-center text-gray-400 py-8 text-sm">No comments yet. Be the first to start the discussion!</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 space-y-2">
                      <div className="flex items-center space-x-3">
                        <img
                          src={c.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                          alt={c.author_name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-sm font-bold text-gray-900">{c.author_name}</p>
                          <p className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 pl-11">{c.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Reward Tiers Sidebar */}
        <div className="space-y-6">
          <h3 className="text-xl sm:text-2xl font-black text-gray-900">Select a Reward Tier</h3>

          {/* Custom pledge tier (no reward) */}
          {isActive && !isCreator && (
            <div className="bg-white p-6 rounded-3xl border border-gray-200 hover:border-brand-500 transition-all shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 text-base">Make a custom pledge</h4>
              <p className="text-xs text-gray-600">
                Pledge any amount to support this project without selecting a physical reward tier.
              </p>
              <button
                onClick={() => handleOpenPledgeModal(null)}
                className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-bold transition-colors"
              >
                Pledge Without Reward
              </button>
            </div>
          )}

          {/* Reward Tiers List */}
          {campaign.reward_tiers?.map((tier) => {
            const isSoldOut = tier.quantity !== null && tier.claimed_quantity >= tier.quantity;

            return (
              <div
                key={tier.id}
                className={`bg-white p-6 rounded-3xl border transition-all shadow-sm space-y-4 ${
                  isSoldOut ? 'border-gray-100 opacity-60' : 'border-gray-200 hover:border-brand-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-gray-900">
                    ${Number(tier.min_amount).toLocaleString()}
                  </span>
                  {tier.quantity ? (
                    <span
                      className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${
                        isSoldOut
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isSoldOut ? 'Sold Out' : `${tier.remaining_quantity} left of ${tier.quantity}`}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                      Unlimited
                    </span>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 text-base">{tier.title}</h4>
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed">{tier.description}</p>
                </div>

                {tier.estimated_delivery && (
                  <div className="flex items-center text-xs text-gray-500 font-medium">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    <span>Estimated delivery: <strong>{tier.estimated_delivery}</strong></span>
                  </div>
                )}

                <div className="pt-2">
                  {isActive && !isCreator && (
                    <button
                      onClick={() => handleOpenPledgeModal(tier)}
                      disabled={isSoldOut}
                      className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold transition-colors"
                    >
                      {isSoldOut ? 'Sold Out' : 'Select This Reward'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pledge Modal */}
      <Modal
        isOpen={isPledgeModalOpen}
        onClose={() => setIsPledgeModalOpen(false)}
        title={selectedTier ? `Back with ${selectedTier.title}` : 'Back this Project'}
      >
        <form onSubmit={handlePledgeSubmit} className="space-y-6">
          {selectedTier && (
            <div className="p-5 rounded-2xl bg-brand-50 border border-brand-200">
              <p className="text-xs font-bold text-brand-700 uppercase">Selected Reward</p>
              <h4 className="font-bold text-gray-900 text-sm mt-0.5">{selectedTier.title}</h4>
              <p className="text-xs text-gray-600 mt-1">{selectedTier.description}</p>
              <p className="text-xs text-gray-500 font-semibold mt-2">
                Minimum pledge: <strong>${selectedTier.min_amount}</strong>
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-800 mb-1">Pledge Amount (USD)</label>
            <div className="relative rounded-2xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="text-gray-500 font-bold text-lg">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min={selectedTier ? selectedTier.min_amount : 1}
                value={pledgeAmount}
                onChange={(e) => setPledgeAmount(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 pl-8 pr-4 py-3 text-lg font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          {/* Deterministic Mock Gateway Selector (for QA & testing) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 flex items-center">
                <CreditCard className="w-3.5 h-3.5 mr-1.5 text-gray-500" />
                Simulated Payment Gateway
              </span>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                Test Mode
              </span>
            </div>
            <select
              value={forcedOutcome}
              onChange={(e) => setForcedOutcome(e.target.value)}
              className="w-full rounded-xl border border-gray-300 p-2 text-xs font-semibold text-gray-800 bg-white"
            >
              <option value="SUCCESS">Simulate Payment APPROVED (Normal)</option>
              <option value="FAILURE">Simulate Payment DECLINED (Forced Failure Test)</option>
            </select>
            <p className="text-[11px] text-gray-500">
              Payments are simulated safely with fake transaction tokens and atomic database rollbacks.
            </p>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsPledgeModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingPledge}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center space-x-2"
            >
              <Lock className="w-4 h-4" />
              <span>{submittingPledge ? 'Authorizing...' : `Confirm $${pledgeAmount || 0} Pledge`}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

