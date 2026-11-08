import React, { useState, useEffect } from 'react';
import api from '../api/client';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Users,
  AlertTriangle,
  Clock,
  Layers,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' | 'analytics' | 'users'
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [topCampaigns, setTopCampaigns] = useState([]);
  const [categorySuccess, setCategorySuccess] = useState([]);
  const [monthlyTrend, setMonthlyTrend] = useState([]);
  const [repeatBackers, setRepeatBackers] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reject modal state
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingCampaignId, setRejectingCampaignId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [pendRes, topRes, catRes, monthRes, repRes, userRes] = await Promise.all([
        api.get('/admin/campaigns/pending'),
        api.get('/admin/reports/top-campaigns'),
        api.get('/admin/reports/category-success'),
        api.get('/admin/reports/monthly-trend'),
        api.get('/admin/reports/repeat-backers'),
        api.get('/admin/users'),
      ]);

      setPendingCampaigns(pendRes.data.data.campaigns || []);
      setTopCampaigns(topRes.data.data.report || []);
      setCategorySuccess(catRes.data.data.report || []);
      setMonthlyTrend(monthRes.data.data.report || []);
      setRepeatBackers(repRes.data.data.report || []);
      setUsersList(userRes.data.data.users || []);
    } catch (err) {
      toast.error('Failed to load administrative reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleApprove = async (campaignId) => {
    if (!window.confirm('Approve and activate this campaign?')) return;
    setProcessingAction(true);
    try {
      await api.post(`/admin/campaigns/${campaignId}/approve`);
      toast.success('Campaign approved and activated!');
      await loadAllAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Approval failed.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleOpenRejectModal = (campaignId) => {
    setRejectingCampaignId(campaignId);
    setRejectionReason('');
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) return;

    setProcessingAction(true);
    try {
      await api.post(`/admin/campaigns/${rejectingCampaignId}/reject`, {
        reason: rejectionReason.trim(),
      });
      toast.success('Campaign rejected and returned to draft with feedback.');
      setIsRejectModalOpen(false);
      await loadAllAdminData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User account marked as ${newStatus}.`);
      await loadAllAdminData();
    } catch (err) {
      toast.error('Failed to update user status.');
    }
  };

  if (loading) return <Loader text="Loading Admin Portal..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md shadow-amber-500/20">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Platform Administration</h1>
          <p className="text-gray-500 text-sm">Review campaign submissions, analyze database reports, and moderate users.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 space-x-8">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Pending Approvals ({pendingCampaigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Platform Reports & SQL Analytics</span>
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 text-sm font-bold flex items-center space-x-2 border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-amber-600 text-amber-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Moderation ({usersList.length})</span>
        </button>
      </div>

      {/* Tab 1: Pending Approvals */}
      {activeTab === 'pending' && (
        <div className="space-y-6">
          {pendingCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-16 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-gray-800">All caught up!</h3>
              <p className="text-sm text-gray-500">There are no pending campaigns requiring administrative review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {pendingCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start justify-between"
                >
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full">
                        {camp.category_name}
                      </span>
                      <StatusBadge status={camp.status} />
                    </div>

                    <h3 className="text-xl font-bold text-gray-900">{camp.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{camp.description}</p>

                    <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-gray-500 font-semibold">
                      <span>Creator: <strong className="text-gray-800">{camp.creator_name}</strong> ({camp.creator_email})</span>
                      <span>Goal: <strong className="text-gray-800">${Number(camp.goal_amount).toLocaleString()}</strong></span>
                      <span>Deadline: <strong className="text-gray-800">{new Date(camp.deadline).toLocaleDateString()}</strong></span>
                    </div>
                  </div>

                  <div className="flex sm:flex-col gap-2 w-full md:w-auto self-stretch md:self-auto justify-end">
                    <button
                      onClick={() => handleApprove(camp.id)}
                      disabled={processingAction}
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-sm transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Activate</span>
                    </button>

                    <button
                      onClick={() => handleOpenRejectModal(camp.id)}
                      disabled={processingAction}
                      className="flex-1 md:flex-initial px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject with Reason</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Analytics & Reports */}
      {activeTab === 'analytics' && (
        <div className="space-y-10">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Category Success Rate */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2 text-brand-600" />
                Category Success Rate (%)
              </h3>
              <p className="text-xs text-gray-500">Calculated from completed campaigns in each category.</p>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categorySuccess}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="category_name" tick={{ fontSize: 11 }} />
                    <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Success Rate']} />
                    <Bar dataKey="success_rate_pct" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Funding Trend (CTE Query) */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h3 className="text-base font-black text-gray-900 flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                Monthly Funding Trends (CTE Moving Average)
              </h3>
              <p className="text-xs text-gray-500">Monthly pledges & moving average generated via SQL Common Table Expressions.</p>
              <div className="h-64 w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month_period" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Funding']} />
                    <Line type="monotone" dataKey="total_pledged" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="moving_avg_funding" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Ranked Campaigns Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-6">
            <h3 className="text-base font-black text-gray-900 flex items-center">
              <Layers className="w-4 h-4 mr-2 text-brand-600" />
              Top Campaigns Ranked by Funding (Window Function: RANK())
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-bold">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Campaign Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Raised Amount</th>
                    <th className="py-3 px-4">Goal Amount</th>
                    <th className="py-3 px-4">% Goal</th>
                    <th className="py-3 px-4">Backers</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {topCampaigns.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-black text-brand-600">#{row.funding_rank}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">{row.title}</td>
                      <td className="py-3 px-4 text-gray-600">{row.category_name}</td>
                      <td className="py-3 px-4 font-black text-gray-900">${Number(row.current_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-500">${Number(row.goal_amount).toLocaleString()}</td>
                      <td className="py-3 px-4 font-bold text-emerald-600">{row.percent_funded}%</td>
                      <td className="py-3 px-4">{row.backer_count}</td>
                      <td className="py-3 px-4"><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repeat Backers Analysis Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden space-y-4 p-6">
            <h3 className="text-base font-black text-gray-900 flex items-center">
              <Users className="w-4 h-4 mr-2 text-purple-600" />
              Repeat Backers Analysis
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 uppercase text-gray-400 font-bold">
                    <th className="py-3 px-4">Backer Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Projects Supported</th>
                    <th className="py-3 px-4">Total Pledges</th>
                    <th className="py-3 px-4">Total Committed ($)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {repeatBackers.map((b) => (
                    <tr key={b.user_id} className="hover:bg-gray-50/60">
                      <td className="py-3 px-4 font-bold text-gray-900">{b.name}</td>
                      <td className="py-3 px-4 text-gray-500">{b.email}</td>
                      <td className="py-3 px-4 font-bold text-purple-600">{b.campaigns_supported} projects</td>
                      <td className="py-3 px-4">{b.total_pledges}</td>
                      <td className="py-3 px-4 font-black text-gray-900">${Number(b.total_spent).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: User Moderation */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900">Registered Platform Users</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-6">Role</th>
                  <th className="py-4 px-6">Campaigns</th>
                  <th className="py-4 px-6">Pledges</th>
                  <th className="py-4 px-6">Account Status</th>
                  <th className="py-4 px-6 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/60">
                    <td className="py-4 px-6">
                      <p className="font-bold text-gray-900">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold">{u.campaigns_created} created</td>
                    <td className="py-4 px-6 font-semibold">{u.pledges_made} backed</td>

                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        u.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {u.status}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleToggleUserStatus(u.id, u.status)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            u.status === 'active'
                              ? 'border border-red-200 text-red-600 hover:bg-red-50'
                              : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {u.status === 'active' ? 'Suspend User' : 'Reactivate User'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Campaign Rejection Feedback Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Reject Campaign"
      >
        <form onSubmit={handleRejectSubmit} className="space-y-4">
          <p className="text-xs text-gray-500">
            Explain to the creator why the campaign cannot be approved in its current state. The campaign will return to draft so they can revise and resubmit.
          </p>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-700 mb-1">
              Rejection Reason & Required Changes
            </label>
            <textarea
              rows={4}
              placeholder="e.g. Please clarify your manufacturing timeline and add a detailed prototype budget breakdown in the story section..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-3.5 rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRejectModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={processingAction || !rejectionReason.trim()}
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
            >
              {processingAction ? 'Processing...' : 'Confirm Rejection'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

