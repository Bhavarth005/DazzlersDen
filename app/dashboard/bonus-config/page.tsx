'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Type definition for a single bonus rule
type BonusRule = {
  id: number;
  rechargeAmount: string;
  bonusAmount: string;
};

export default function BonusConfiguration() {
  const [rows, setRows] = useState<BonusRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const fetchOffers = async () => {
    try {
      const res = await fetch('/api/admin/offers', {
        headers: { 'Content-Type': 'application/json' }
      });

      if (res.ok) {
        const data = await res.json();
        const mappedRows = data.map((offer: any) => ({
          id: offer.id,
          rechargeAmount: offer.triggerAmount.toString(),
          bonusAmount: offer.bonusAmount.toString()
        }));
        setRows(mappedRows);
      } else {
        console.error("Failed to fetch offers");
        toast.error("Could not load existing offers");
      }
    } catch (error) {
      console.error("Error loading offers:", error);
    } finally {
      setIsFetching(false);
    }
  };
  
  useEffect(() => {
    fetchOffers();
  }, []);

  // 2. Add Row (Use negative ID for local-only rows)
  const handleAddRow = () => {
    const tempId = -Date.now(); 
    setRows([...rows, { id: tempId, rechargeAmount: '', bonusAmount: '' }]);
  };

  // 3. Delete Row (API Integration Added)
  const handleDeleteRow = async (id: number) => {
    // Case A: Row is local-only (unsaved) -> Just remove from state
    if (id < 0) {
        setRows(rows.filter(row => row.id !== id));
        return;
    }

    // Case B: Row exists in DB -> Confirm & Call API
    if (!window.confirm("Are you sure you want to delete this offer?")) return;

    try {
        // We assume the backend accepts DELETE requests with an ID query param
        const res = await fetch(`/api/admin/offers?id=${id}`, { method: 'DELETE', });

        if (res.ok) {
            setRows(rows.filter(row => row.id !== id));
            toast.success("Offer deleted successfully");
        } else {
            const err = await res.json();
            toast.error(err.detail || "Failed to delete offer");
        }
    } catch (error) {
        console.error("Delete error:", error);
        toast.error("Network error. Could not delete.");
    }
  };

  // Update input values
  const handleChange = (id: number, field: keyof BonusRule, value: string) => {
    setRows(prev => prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ));
  };

  // 4. Save Logic (POST/PUT)
  const handleSave = async () => {
    setIsLoading(true);

    try {
      const savePromises = rows.map(async (row) => {
        if (!row.rechargeAmount || !row.bonusAmount) return null;

        const payload: any = {
          triggerAmount: Number(row.rechargeAmount),
          bonusAmount: Number(row.bonusAmount),
          isActive: true
        };

        if (row.id > 0) {
          payload.id = row.id;
        }

        const res = await fetch('/api/admin/offers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Failed to save row ${row.id}`);
        return await res.json();
      });

      await Promise.all(savePromises);
      
      // Reload to ensure we get fresh IDs for any newly created rows
      toast.success("All changes saved!");
      fetchOffers();
      // window.location.reload(); 

    } catch (error) {
      console.error("Save failed:", error);
      toast.error("Failed to save changes.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-2 md:p-2">
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
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
            <div className="col-span-5">Recharge (₹)</div>
            <div className="col-span-5">Bonus (₹)</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {/* Rows */}
          <div className="p-6 flex flex-col gap-4">
            {isFetching ? (
                <div className="flex justify-center py-8">
                    <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
                </div>
            ) : (
                <>
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
                </>
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
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
               <span className="material-symbols-outlined animate-spin">progress_activity</span>
            ) : (
               <span className="material-symbols-outlined">save</span>
            )}
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>

      </div>
    </main>
  );
}