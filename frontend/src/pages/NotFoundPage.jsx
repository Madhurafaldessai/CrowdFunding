import React from 'react';
import { Link } from 'react-router-dom';
import { Rocket, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-600 flex items-center justify-center mb-6">
        <Rocket className="w-8 h-8 rotate-45" />
      </div>
      <h1 className="text-6xl font-black text-gray-900 tracking-tight">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mt-2">Lost in space?</h2>
      <p className="text-gray-500 mt-2 max-w-sm">
        The page or campaign you are looking for doesn't exist or has moved.
      </p>
      <Link
        to="/"
        className="mt-6 inline-flex items-center px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md transition-all space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </Link>
    </div>
  );
}

