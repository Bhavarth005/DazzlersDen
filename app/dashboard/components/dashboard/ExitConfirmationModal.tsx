import React from 'react';
import { Loader2 } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isOverdue?: boolean;
  isLoading?: boolean;
};

export default function ExitConfirmationModal({ isOpen, onClose, onConfirm, isOverdue, isLoading }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          {/* Icon - Yellow for Standard, Red for Overdue */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${isOverdue ? 'bg-red-100 dark:bg-red-900/20' : 'bg-yellow-100 dark:bg-yellow-900/20'}`}>
            <span className={`material-symbols-outlined text-2xl ${isOverdue ? 'text-red-600 dark:text-red-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
              {isOverdue ? 'warning' : 'logout'}
            </span>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
            {isOverdue ? 'End Overdue Session?' : 'Confirm Exit?'}
          </h3>
          
          <div className="text-slate-500 dark:text-slate-400 text-sm mb-6 space-y-2">
            <p>Are you sure you want to mark this session as completed?</p>
            {isOverdue && (
              <p className="font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded-lg border border-red-100 dark:border-red-900/20">
                ⚠️ This session is marked as OVERDUE.
              </p>
            )}
            {!isOverdue && <p>This will calculate the final duration and stop the timer.</p>}
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 px-4 py-2.5 rounded-lg text-white font-semibold shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed
                ${isOverdue 
                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20' 
                    : 'bg-primary hover:bg-primary/90 shadow-blue-500/20'}`}
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? 'Processing...' : 'Confirm Exit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}