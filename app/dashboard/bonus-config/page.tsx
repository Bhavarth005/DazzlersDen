'use client'

import { useState } from 'react';

// Type definition for a single bonus rule
type BonusRule = {
  id: number;
  rechargeAmount: string;
  bonusAmount: string;
};

export default function BonusConfiguration() {
  // --- State ---
  // Start with one empty row or some default data
  const [rows, setRows] = useState<BonusRule[]>([
    { id: 1, rechargeAmount: '500', bonusAmount: '50' },
    { id: 2, rechargeAmount: '1000', bonusAmount: '150' },
  ]);

  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- Handlers ---

  // Add a new empty row
  const handleAddRow = () => {
    const newId = rows.length > 0 ? Math.max(...rows.map(r => r.id)) + 1 : 1;
    setRows([...rows, { id: newId, rechargeAmount: '', bonusAmount: '' }]);
  };

  // Remove a row
  const handleDeleteRow = (id: number) => {
    setRows(rows.filter(row => row.id !== id));
  };

  // Update input values
  const handleChange = (id: number, field: keyof BonusRule, value: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // Confirm Save Logic
  const handleConfirmSave = () => {
    setIsLoading(true);
    // Simulate API Call
    setTimeout(() => {
      console.log("Saving Rules:", rows);
      console.log("Password used:", password);
      setIsLoading(false);
      setIsSaveModalOpen(false);
      setPassword('');
      // You could add a toast notification here
    }, 1000);
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
        <div className="max-w-2xl mx-auto flex flex-col gap-6">
          
          {/* Page Header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Bonus Configuration
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Set automatic bonus credits based on recharge amounts.
            </p>
          </div>

          {/* Configuration Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* Table Header (Visual) */}
            <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
              <div className="col-span-5">Recharge Amount (₹)</div>
              <div className="col-span-5">Bonus Credit (₹)</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {/* Rows */}
            <div className="p-6 flex flex-col gap-4">
              {rows.map((row) => (
                <div key={row.id} className="grid grid-cols-12 gap-4 items-center animate-in fade-in slide-in-from-top-2">
                  
                  {/* Recharge Input */}
                  <div className="col-span-5 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={row.rechargeAmount}
                      onChange={(e) => handleChange(row.id, 'rechargeAmount', e.target.value)}
                      className="w-full pl-7 pr-3 h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium"
                    />
                  </div>

                  {/* Bonus Input */}
                  <div className="col-span-5 relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">₹</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={row.bonusAmount}
                      onChange={(e) => handleChange(row.id, 'bonusAmount', e.target.value)}
                      className="w-full pl-7 pr-3 h-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-green-600 dark:text-green-400 focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all font-bold"
                    />
                  </div>

                  {/* Delete Action */}
                  <div className="col-span-2 text-right">
                    <button 
                      onClick={() => handleDeleteRow(row.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Remove Row"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </div>
              ))}

              {rows.length === 0 && (
                <div className="text-center py-8 text-slate-500 italic">
                  No bonus rules configured. Add a row to start.
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 border-t border-slate-200 dark:border-slate-700">
               <button 
                  onClick={handleAddRow}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
               >
                  <span className="material-symbols-outlined">add</span>
                  Add New Offer
               </button>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-2">
            <button 
              onClick={() => setIsSaveModalOpen(true)}
              className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <span className="material-symbols-outlined">save</span>
              Save Changes
            </button>
          </div>

        </div>
      </main>

      {/* --- PASSWORD CONFIRMATION MODAL --- */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()} 
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-gray-700 bg-slate-50/50 dark:bg-gray-800/50">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security Check</h3>
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 flex flex-col gap-4">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg text-sm flex gap-3 items-start border border-yellow-100 dark:border-yellow-900/50">
                <span className="material-symbols-outlined text-[20px] shrink-0">lock</span>
                <p>These changes will affect how customer bonuses are calculated instantly. Please confirm your identity.</p>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Admin Password</label>
                <div className="relative">
                   <input 
                      autoFocus
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 h-12 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="Enter password..."
                   />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-gray-800/50 border-t border-slate-100 dark:border-gray-700 flex gap-3">
              <button 
                onClick={() => setIsSaveModalOpen(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleConfirmSave}
                disabled={!password || isLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                    <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                ) : (
                    "Continue"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}