import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-12 text-gray-600 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 border-b border-gray-100 pb-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:gap-16">
          <div className="max-w-md space-y-4">
            <Link to="/" className="inline-flex items-center gap-2.5 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Rocket className="w-5 h-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-gray-900">
                Launch<span className="text-brand-600">Pad</span>
              </span>
            </Link>
            <p className="max-w-sm text-sm leading-6 text-gray-500">
              A place for creators to bring bold ideas to life, with a community ready to help.
            </p>
          </div>

          <nav aria-label="Explore campaigns">
            <h2 className="mb-4 text-sm font-bold text-gray-900">Explore</h2>
            <ul className="space-y-3 text-sm">
              <li><Link to="/browse" className="transition-colors hover:text-brand-600">All campaigns</Link></li>
              <li><Link to="/browse?category=technology" className="transition-colors hover:text-brand-600">Technology</Link></li>
              <li><Link to="/browse?category=design-art" className="transition-colors hover:text-brand-600">Design & Art</Link></li>
            </ul>
          </nav>

          <div>
            <h2 className="mb-2 text-sm font-bold text-gray-900">Have an idea?</h2>
            <p className="mb-4 text-sm leading-6 text-gray-500">Share it with a community ready to help.</p>
            <Link to="/campaigns/new" className="inline-flex items-center rounded-full bg-brand-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500">
              Start a campaign <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-2 pt-6 text-xs text-gray-400 sm:flex-row">
          <p>© {new Date().getFullYear()} LaunchPad Crowdfunding.</p>
          <p>Made for ideas worth backing</p>
        </div>
      </div>
    </footer>
  );
}
