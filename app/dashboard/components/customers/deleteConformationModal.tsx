// components/customers/DeleteConfirmationModal.tsx
import React from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
};

export default function DeleteConfirmationModal({ isOpen, onClose, onConfirm, count }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-2xl">warning</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete {count > 1 ? 'Customers' : 'Customer'}?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-slate-300">{count} {count > 1 ? 'items' : 'item'}</span>? This action cannot be undone and data will be permanently removed.
          </p>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold shadow-md shadow-red-500/20 transition-all active:scale-95"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}