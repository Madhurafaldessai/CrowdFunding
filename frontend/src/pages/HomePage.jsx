import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import CampaignCard from '../components/CampaignCard';
import Loader from '../components/Loader';
import { Rocket, ArrowRight, ArrowUpRight, Plus, Cpu, Gamepad2, Palette, Film, Music, BookOpen } from 'lucide-react';

const defaultCategories = [
  { id: 'design-art', name: 'Design & Art', slug: 'design-art', icon: 'Palette' },
  { id: 'film-video', name: 'Film & Video', slug: 'film-video', icon: 'Film' },
  { id: 'games', name: 'Games', slug: 'games', icon: 'Gamepad2' },
  { id: 'music-audio', name: 'Music & Audio', slug: 'music-audio', icon: 'Music' },
  { id: 'publishing', name: 'Publishing', slug: 'publishing', icon: 'BookOpen' },
  { id: 'technology', name: 'Technology', slug: 'technology', icon: 'Cpu' },
];

const iconMap = {
  Cpu,
  Gamepad2,
  Palette,
  Film,
  Music,
  BookOpen,
};

export default function HomePage() {
  const [categories, setCategories] = useState([]);
  const [trending, setTrending] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catRes, campRes] = await Promise.all([
          api.get('/categories'),
          api.get('/campaigns?status=active&sort=trending&limit=7'),
        ]);

        setCategories(catRes.data.data.categories || []);
        const campaigns = campRes.data.data.campaigns || [];
        if (campaigns.length > 0) {
          setFeatured(campaigns[0]);
          setTrending(campaigns.slice(1, 7));
        }
      } catch (err) {
        console.error('Failed to load homepage data', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  if (loading) {
    return <Loader text="Loading featured campaigns..." />;
  }

  return (
    <div className="pb-20">
      <section className="launchpad-hero relative isolate flex min-h-[460px] items-center justify-center overflow-hidden border-b border-gray-100 px-4 py-14 sm:px-6">
        <div className="hero-orb hero-orb-left" aria-hidden="true" />
        <div className="hero-orb hero-orb-right" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-4xl translate-y-3 text-center">
          <h1 className="text-4xl font-black leading-[1.07] tracking-[-0.055em] text-slate-950 sm:text-5xl md:text-[60px]">
            Bring creative and<br className="hidden sm:block" /> technological<br className="hidden sm:block" /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500">breakthroughs</span> to life.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            Directly fund independent creators, artists, and innovators.<br className="hidden sm:block" />
            Real ideas. Real people. Real impact.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/browse"
              className="flex w-full items-center justify-center rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-bold text-white shadow-[0_12px_24px_rgba(5,150,105,0.22)] transition-all hover:-translate-y-0.5 hover:bg-emerald-700 sm:w-auto sm:text-base"
            >
              Explore Campaigns
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/campaigns/new"
              className="flex w-full items-center justify-center rounded-full border border-gray-100 bg-white px-7 py-3.5 text-sm font-bold text-slate-800 shadow-[0_8px_24px_rgba(20,35,48,0.07)] transition-all hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto sm:text-base"
            >
              <Plus className="mr-3 h-5 w-5" />
              Start a Campaign
            </Link>
          </div>
        </div>
      </section>

      <section className="launchpad-category-section mt-[154px] border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white py-8 sm:py-9">
        <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black tracking-tight text-slate-900 sm:text-2xl">Browse by Category</h2>
          <Link to="/browse" className="flex items-center text-sm font-bold text-emerald-600 transition-colors hover:text-emerald-700">
            View All Categories <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6 lg:gap-6">
          {(categories.length ? categories : defaultCategories).map((cat, index) => {
            const IconComponent = iconMap[cat.icon] || Rocket;
            return (
              <Link
                key={cat.id}
                to={`/browse?category=${cat.slug}`}
                className="group flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-white bg-white px-4 py-8 text-center shadow-[0_8px_28px_rgba(22,42,55,0.045)] transition-all hover:-translate-y-1 hover:border-emerald-100 hover:shadow-[0_14px_32px_rgba(22,42,55,0.09)]"
              >
                <div className={`mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-[22px] ${['bg-rose-100 text-rose-600', 'bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-700', 'bg-purple-100 text-purple-700', 'bg-amber-100 text-amber-700', 'bg-teal-100 text-teal-700'][index % 6]} transition-transform group-hover:scale-105`}>
                  <IconComponent className="h-9 w-9" strokeWidth={2.2} />
                </div>
                <h3 className="font-bold text-sm text-slate-800 transition-colors group-hover:text-emerald-700">
                  {cat.name}
                </h3>
                <span className="mt-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-all group-hover:bg-emerald-600 group-hover:text-white">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </Link>
            );
          })}
        </div>
        </div>
      </section>

      {/* Featured Spotlight */}
      {featured && (
        <section className="mx-auto mt-24 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Spotlight</span>
            <h2 className="text-2xl font-black text-gray-900 mt-0.5">Featured Project</h2>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 lg:p-8">
            <Link to={`/campaigns/${featured.id}`} className="lg:col-span-7 aspect-video rounded-2xl overflow-hidden bg-gray-100">
              <img
                src={featured.image_url}
                alt={featured.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </Link>

            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div>
                <span className="inline-block bg-brand-100 text-brand-800 text-xs font-extrabold px-3 py-1 rounded-full mb-3">
                  {featured.category_name}
                </span>
                <Link to={`/campaigns/${featured.id}`}>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-snug hover:text-brand-600 transition-colors">
                    {featured.title}
                  </h3>
                </Link>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed line-clamp-3">
                  {featured.description}
                </p>
                <p className="mt-3 text-xs text-gray-500 font-semibold">
                  Created by <span className="text-gray-900 font-bold">{featured.creator_name}</span>
                </p>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-4">
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-brand-600 transition-all duration-500"
                    style={{ width: `${Math.min(featured.percent_funded, 100)}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 text-left">
                  <div>
                    <p className="text-xl font-black text-gray-900">${Number(featured.current_amount).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{featured.percent_funded}% of ${Number(featured.goal_amount).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{featured.backer_count}</p>
                    <p className="text-xs text-gray-500">backers</p>
                  </div>
                  <div>
                    <p className="text-xl font-black text-gray-900">{featured.days_remaining}d</p>
                    <p className="text-xs text-gray-500">remaining</p>
                  </div>
                </div>

                <Link
                  to={`/campaigns/${featured.id}`}
                  className="block text-center w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all"
                >
                  View Campaign & Back
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Campaigns Grid */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-brand-600 uppercase tracking-wider">Popular Now</span>
            <h2 className="text-2xl font-black text-gray-900 mt-0.5">Trending Campaigns</h2>
          </div>
          <Link
            to="/browse"
            className="text-sm font-bold text-brand-600 hover:text-brand-700 flex items-center"
          >
            Explore all <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {trending.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      </section>
    </div>
  );
}
