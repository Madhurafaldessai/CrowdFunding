import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import { Plus, Trash2, ArrowLeft, Rocket } from 'lucide-react';

export default function EditCampaignPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);

  const [campaign, setCampaign] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    story: '',
    imageUrl: '',
    goalAmount: '',
    deadline: '',
  });

  const [tiers, setTiers] = useState([]);
  const [newTier, setNewTier] = useState({
    title: '',
    description: '',
    minAmount: '25',
    quantity: '',
    estimatedDelivery: 'Dec 2026',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catRes, campRes] = await Promise.all([
          api.get('/categories'),
          api.get(`/campaigns/${id}`),
        ]);
        setCategories(catRes.data.data.categories || []);
        const camp = campRes.data.data.campaign;
        setCampaign(camp);
        setFormData({
          title: camp.title || '',
          categoryId: camp.category_id?.toString() || '',
          description: camp.description || '',
          story: camp.story || '',
          imageUrl: camp.image_url || '',
          goalAmount: camp.goal_amount?.toString() || '',
          deadline: camp.deadline ? new Date(camp.deadline).toISOString().split('T')[0] : '',
        });
        setTiers(camp.reward_tiers || []);
      } catch (err) {
        toast.error('Failed to load campaign data.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/campaigns/${id}`, {
        ...formData,
        categoryId: parseInt(formData.categoryId, 10),
        goalAmount: parseFloat(formData.goalAmount),
        deadline: new Date(formData.deadline).toISOString(),
      });
      toast.success('Campaign details saved!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update campaign.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTier = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/campaigns/${id}/tiers`, {
        title: newTier.title,
        description: newTier.description,
        minAmount: parseFloat(newTier.minAmount),
        quantity: newTier.quantity ? parseInt(newTier.quantity, 10) : null,
        estimatedDelivery: newTier.estimatedDelivery,
      });
      toast.success('Tier added!');
      setTiers([...tiers, res.data.data.tier]);
      setNewTier({
        title: '',
        description: '',
        minAmount: '25',
        quantity: '',
        estimatedDelivery: 'Dec 2026',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add tier.');
    }
  };

  const handleDeleteTier = async (tierId) => {
    try {
      await api.delete(`/campaigns/${id}/tiers/${tierId}`);
      toast.success('Tier deleted.');
      setTiers(tiers.filter((t) => t.id !== tierId));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete tier.');
    }
  };

  const handleSubmitForApproval = async () => {
    if (tiers.length === 0) {
      toast.error('Must have at least one reward tier before submitting.');
      return;
    }
    try {
      await api.post(`/campaigns/${id}/submit`);
      toast.success('Submitted for admin review!');
      navigate('/creator-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit campaign.');
    }
  };

  if (loading) return <Loader text="Loading campaign editor..." />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/creator-dashboard')}
          className="flex items-center text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Creator Studio
        </button>

        {campaign?.status === 'draft' && (
          <button
            onClick={handleSubmitForApproval}
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-extrabold text-xs shadow-md flex items-center space-x-1.5"
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Submit for Review</span>
          </button>
        )}
      </div>

      {campaign?.rejection_reason && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-sm text-rose-800">
          <p className="font-bold">Administrative Feedback (Rejection Reason):</p>
          <p className="mt-1">{campaign.rejection_reason}</p>
        </div>
      )}

      {/* Campaign Details Form */}
      <form onSubmit={handleSaveDetails} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-gray-900">Campaign Information</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Category</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Goal ($)</label>
              <input
                type="number"
                min="1"
                value={formData.goalAmount}
                onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Short Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Full Story</label>
            <textarea
              rows={8}
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full p-4 rounded-2xl border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-sm transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Reward Tiers Management */}
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <h2 className="text-xl font-black text-gray-900">Manage Reward Tiers</h2>

        <div className="space-y-4">
          {tiers.map((tier) => (
            <div key={tier.id} className="p-4 rounded-2xl border border-gray-200 flex items-center justify-between">
              <div>
                <p className="font-bold text-gray-900">{tier.title} (${tier.min_amount})</p>
                <p className="text-xs text-gray-500">{tier.description}</p>
                <p className="text-[11px] text-gray-400 mt-1">Claimed: {tier.claimed_quantity} | Stock: {tier.quantity || 'Unlimited'}</p>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteTier(tier.id)}
                disabled={tier.claimed_quantity > 0}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
                title={tier.claimed_quantity > 0 ? 'Cannot delete tier with existing pledges' : 'Delete'}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new tier inline */}
        <form onSubmit={handleAddTier} className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
          <p className="text-xs font-bold text-gray-700 uppercase">Add New Tier</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Tier Title"
              value={newTier.title}
              onChange={(e) => setNewTier({ ...newTier, title: e.target.value })}
              className="p-2 text-xs rounded-xl border border-gray-200 bg-white"
              required
            />
            <input
              type="number"
              min="1"
              placeholder="Min Pledge ($)"
              value={newTier.minAmount}
              onChange={(e) => setNewTier({ ...newTier, minAmount: e.target.value })}
              className="p-2 text-xs rounded-xl border border-gray-200 bg-white"
              required
            />
          </div>
          <textarea
            rows={2}
            placeholder="Tier Description"
            value={newTier.description}
            onChange={(e) => setNewTier({ ...newTier, description: e.target.value })}
            className="w-full p-2 text-xs rounded-xl border border-gray-200 bg-white"
            required
          />
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl"
            >
              Add Tier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

