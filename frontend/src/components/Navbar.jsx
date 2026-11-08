import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Rocket, PlusCircle, User, ShieldCheck, Heart, LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="launchpad-nav sticky top-[14px] z-40 mx-4 rounded-full border border-white/80 bg-white/90 shadow-[0_12px_36px_rgba(27,72,56,0.10)] backdrop-blur-xl transition-all md:mx-auto md:max-w-5xl">
      <div className="px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-700 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-gray-900">
                Launch<span className="text-brand-600">Pad</span>
              </span>
            </Link>

            <div className="hidden md:flex items-center space-x-6">
              <Link
                to="/browse"
                className="rounded-full bg-brand-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-brand-600/20 hover:bg-brand-700 transition-colors"
              >
                Explore Campaigns
              </Link>
            </div>
          </div>

          {/* Right Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/campaigns/new"
              className="inline-flex items-center px-4 py-2.5 rounded-full text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 border border-gray-100 transition-colors"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              Start a Campaign
            </Link>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
                >
                  <img
                    src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full object-cover border border-brand-300"
                  />
                  <span className="text-sm font-bold text-gray-800">{user?.name}</span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Signed in as</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                    </div>

                    <Link
                      to="/my-pledges"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors"
                    >
                      <Heart className="w-4 h-4 mr-2.5 text-rose-500" />
                      My Pledges
                    </Link>

                    <Link
                      to="/creator-dashboard"
                      className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 font-medium transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 mr-2.5 text-brand-600" />
                      Creator Studio
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 font-medium transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 mr-2.5 text-amber-500" />
                        Admin Portal
                      </Link>
                    )}

                    <div className="border-t border-gray-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 font-medium transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-2.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-full text-sm font-bold text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-2.5 rounded-full text-sm font-bold text-white bg-brand-600 hover:bg-brand-700 shadow-md shadow-brand-500/25 transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/browse"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50"
          >
            Explore Campaigns
          </Link>
          <Link
            to="/campaigns/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-semibold text-brand-700 bg-brand-50"
          >
            Start a Campaign
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-pledges"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                My Pledges
              </Link>
              <Link
                to="/creator-dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-50"
              >
                Creator Studio
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-base font-semibold text-amber-700 hover:bg-amber-50"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-semibold text-red-600 hover:bg-red-50"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="pt-4 border-t border-gray-100 space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-base font-bold text-gray-700 bg-gray-50 rounded-xl"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-2 text-base font-bold text-white bg-brand-600 rounded-xl"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
