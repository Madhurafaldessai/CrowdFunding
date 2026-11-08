import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleEsc);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        <div
          className="fixed inset-0 bg-[#071015]/75 backdrop-blur-md transition-opacity"
          onClick={onClose}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`app-modal relative w-full transform overflow-hidden rounded-[28px] border border-gray-200 bg-white text-left shadow-[0_24px_80px_rgba(0,0,0,0.32)] transition-all sm:my-8 ${maxWidth}`}
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5 sm:px-8">
            <h3 id="modal-title" className="pr-5 text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">{title}</h3>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6 sm:p-8">{children}</div>
        </div>
      </div>
    </div>
  );
}

