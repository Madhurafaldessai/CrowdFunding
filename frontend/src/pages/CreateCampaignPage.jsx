import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import toast from 'react-hot-toast';
import {
  Rocket,
  CheckCircle2,
  Calendar,
  Gift,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  FileText,
  DollarSign,
} from 'lucide-react';

export default function CreateCampaignPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    description: '',
    story: '',
    imageUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800',
    goalAmount: '10000',
    deadline: '',
  });

  // Reward Tiers State
  const [tiers, setTiers] = useState([
    {
      title: 'Early Supporter Patch',
      description: 'Custom embroidered backer badge and digital updates.',
      minAmount: '25',
      quantity: '100',
      estimatedDelivery: 'Dec 2026',
    },
  ]);

  useEffect(() => {
    api.get('/categories')
      .then((res) => {
        const cats = res.data.data.categories || [];
        setCategories(cats);
        if (cats.length > 0) {
          setFormData((prev) => ({ ...prev, categoryId: cats[0].id.toString() }));
        }
      })
      .catch((err) => console.error(err));

    // Default deadline 30 days from now
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setFormData((prev) => ({
      ...prev,
      deadline: d.toISOString().split('T')[0],
    }));
  }, []);

  const handleAddTier = () => {
    setTiers([
      ...tiers,
      {
        title: '',
        description: '',
        minAmount: '50',
        quantity: '',
        estimatedDelivery: 'Dec 2026',
      },
    ]);
  };

  const handleRemoveTier = (index) => {
    setTiers(tiers.filter((_, idx) => idx !== index));
  };

  const handleTierChange = (index, field, value) => {
    const updated = [...tiers];
    updated[index][field] = value;
    setTiers(updated);
  };

  const handleFinalSubmit = async (submitForApproval = false) => {
    if (!formData.title || !formData.description || !formData.story) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (tiers.length === 0) {
      toast.error('Please add at least one reward tier.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Campaign
      const campRes = await api.post('/campaigns', {
        title: formData.title,
        categoryId: parseInt(formData.categoryId, 10),
        description: formData.description,
        story: formData.story,
        imageUrl: formData.imageUrl,
        goalAmount: parseFloat(formData.goalAmount),
        deadline: new Date(formData.deadline).toISOString(),
      });

      const campaignId = campRes.data.data.campaign.id;

      // 2. Create Reward Tiers
      for (const tier of tiers) {
        if (tier.title && tier.minAmount) {
          await api.post(`/campaigns/${campaignId}/tiers`, {
            title: tier.title,
            description: tier.description,
            minAmount: parseFloat(tier.minAmount),
            quantity: tier.quantity ? parseInt(tier.quantity, 10) : null,
            estimatedDelivery: tier.estimatedDelivery,
          });
        }
      }

      // 3. If user clicked "Submit for Approval"
      if (submitForApproval) {
        await api.post(`/campaigns/${campaignId}/submit`);
        toast.success('Campaign created and submitted for administrative approval!');
      } else {
        toast.success('Campaign saved as draft!');
      }

      navigate('/creator-dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Wizard Step Progress */}
      <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Story' },
            { num: 3, label: 'Rewards' },
            { num: 4, label: 'Review' },
          ].map((s, idx) => (
            <React.Fragment key={s.num}>
              <div className="flex items-center space-x-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                    step >= s.num
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {s.num}
                </div>
                <span className={`text-xs font-bold hidden sm:inline ${step >= s.num ? 'text-gray-900' : 'text-gray-400'}`}>
                  {s.label}
                </span>
              </div>
              {idx < 3 && <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${step > s.num ? 'bg-brand-500' : 'bg-gray-100'}`} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Basics */}
      {step === 1 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Project Basics</h2>
            <p className="text-sm text-gray-500">Provide the title, category, funding goal, and duration.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Campaign Title</label>
              <input
                type="text"
                placeholder="e.g. Lumina: Solar-Powered Kinetic Lamp"
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
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Funding Goal (USD)</label>
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
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Campaign Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Short Description (Sub-header)</label>
              <textarea
                rows={2}
                placeholder="A compelling 1-2 sentence elevator pitch for your project..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-700 mb-1">Cover Image URL</label>
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
              type="button"
              onClick={() => {
                if (!formData.title || !formData.description) {
                  toast.error('Please enter a title and description.');
                  return;
                }
                setStep(2);
              }}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center space-x-2"
            >
              <span>Continue to Story</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Story */}
      {step === 2 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Project Story</h2>
            <p className="text-sm text-gray-500">
              Tell backers why this project matters, technical specs, production timeline, and risks.
            </p>
          </div>

          <div>
            <textarea
              rows={12}
              placeholder="Write your story here in detail. Explain your prototype journey, team background, and how funding will be allocated..."
              value={formData.story}
              onChange={(e) => setFormData({ ...formData, story: e.target.value })}
              className="w-full p-4 rounded-2xl border border-gray-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono"
              required
            />
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!formData.story.trim()) {
                  toast.error('Please write a campaign story.');
                  return;
                }
                setStep(3);
              }}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center space-x-2"
            >
              <span>Continue to Rewards</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Reward Tiers */}
      {step === 3 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-gray-900">Reward Tiers</h2>
              <p className="text-sm text-gray-500">Add options for backers at various pledge levels.</p>
            </div>
            <button
              type="button"
              onClick={handleAddTier}
              className="px-4 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold border border-brand-200 flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Another Tier</span>
            </button>
          </div>

          <div className="space-y-6">
            {tiers.map((tier, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-gray-200 bg-gray-50/50 space-y-4 relative">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase text-gray-500">Tier #{idx + 1}</span>
                  {tiers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTier(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Reward Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Core Hardware Kit"
                      value={tier.title}
                      onChange={(e) => handleTierChange(idx, 'title', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Min Pledge ($)</label>
                    <input
                      type="number"
                      min="1"
                      value={tier.minAmount}
                      onChange={(e) => handleTierChange(idx, 'minAmount', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">Description of items included</label>
                  <textarea
                    rows={2}
                    placeholder="Details about what backer receives..."
                    value={tier.description}
                    onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Limit Quantity (Leave empty for unlimited)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 50"
                      value={tier.quantity}
                      onChange={(e) => handleTierChange(idx, 'quantity', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 mb-1">Estimated Delivery</label>
                    <input
                      type="text"
                      placeholder="e.g. Feb 2027"
                      value={tier.estimatedDelivery}
                      onChange={(e) => handleTierChange(idx, 'estimatedDelivery', e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (tiers.length === 0 || !tiers[0].title) {
                  toast.error('Please configure at least one reward tier.');
                  return;
                }
                setStep(4);
              }}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md flex items-center space-x-2"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Review and Submit */}
      {step === 4 && (
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-md space-y-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Review and Publish</h2>
            <p className="text-sm text-gray-500">
              Confirm your project details before saving as draft or submitting for approval.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gray-50 border border-gray-200 space-y-4">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Title</p>
              <h3 className="text-xl font-black text-gray-900">{formData.title}</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Funding Goal</p>
                <p className="text-base font-extrabold text-brand-600">${Number(formData.goalAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Deadline</p>
                <p className="text-sm font-semibold text-gray-800">{formData.deadline}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase">Reward Tiers</p>
                <p className="text-sm font-semibold text-gray-800">{tiers.length} tiers</p>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 uppercase">Description</p>
              <p className="text-sm text-gray-700 mt-1">{formData.description}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 flex items-center justify-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(false)}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-extrabold text-sm transition-colors"
              >
                Save as Draft
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleFinalSubmit(true)}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold text-sm shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2"
              >
                <Rocket className="w-4 h-4" />
                <span>{submitting ? 'Submitting...' : 'Submit for Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

