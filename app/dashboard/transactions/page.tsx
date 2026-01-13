'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Transaction } from '../components/recharge/types';
import { useSelection } from '../components/customers/useSelection';
import TransactionRow from '../components/recharge/transactionRow';
import TransactionMobileCard from '../components/recharge/transactionMobileCard';
import DashboardCard from '../components/dashboard/Card';
import { IndianRupee } from 'lucide-react';
import { toast } from 'sonner';

// --- HELPER: Date Range Calculator ---
const getDateRange = (filter: string, customStart: string, customEnd: string) => {
  const now = new Date();
  let start = "";
  let end = "";

  if (filter === 'Today') {
    start = now.toISOString().split('T')[0];
    end = start;
  } else if (filter === 'This Month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    start = firstDay.toISOString().split('T')[0];
    end = lastDay.toISOString().split('T')[0];
  } else if (filter === 'Last Month') {
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    start = firstDay.toISOString().split('T')[0];
    end = lastDay.toISOString().split('T')[0];
  } else if (filter === 'Custom') {
    start = customStart;
    end = customEnd;
  }

  return { start, end };
};

export default function Transactions() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Stats State
  const [stats, setStats] = useState({ cash: "0", upi: "0", total: "0" });

  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);

  const [dateFilter, setDateFilter] = useState('This Month');
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const [paymentFilter, setPaymentFilter] = useState('All');
  const [isPaymentDropdownOpen, setIsPaymentDropdownOpen] = useState(false);

  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const selection = useSelection([]);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const { start, end } = getDateRange(dateFilter, customDates.start, customDates.end);
      // 1. Base Query Params (Common Filters)
      const baseParams = new URLSearchParams({
        customer_name: searchTerm,
        start_date: start,
        end_date: end,
        payment_mode: paymentFilter == 'All' ? "" : paymentFilter
      });

      // 2. Params for List (Add Pagination)
      const listParams = new URLSearchParams(baseParams);
      listParams.append('page', currentPage.toString());
      listParams.append('limit', pageSize.toString());

      // 3. Params for Stats (Add Stats Flag)
      const statsParams = new URLSearchParams(baseParams);
      statsParams.append('stats', 'true');

      // 4. Execute Parallel Requests
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/transactions?${listParams.toString()}`),
        fetch(`/api/transactions?${statsParams.toString()}`)
      ]);

      if (listRes.status === 401 || statsRes.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!listRes.ok || !statsRes.ok) throw new Error("Failed to fetch data");

      const listJson = await listRes.json();
      const statsJson = await statsRes.json();

      // --- Process List Data ---
      const mappedData = (listJson.data || []).map((t: any) => ({
        id: t.id.toString(),
        customerId: t.customerId,
        customerName: t.customer?.name || "Unknown",
        customerMobile: t.customer?.mobileNumber || "N/A",
        amount: t.amount,
        type: t.transactionType,
        date: new Date(t.date).toLocaleDateString(),
        time: new Date(t.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        paymentMode: t.paymentMode || "-"
      }));

      setTransactions(mappedData);
      setTotalPages(Math.ceil((listJson.pagination?.total || 0) / pageSize));

      // --- Process Stats Data ---
      // statsJson is now the direct object: { TOTAL: 8990, CASH: 7500, ... }
      setStats({
        cash: (statsJson.CASH || 0).toLocaleString('en-IN'),
        upi: (statsJson.UPI || 0).toLocaleString('en-IN'),
        total: (statsJson.CASH + statsJson.UPI || 0).toLocaleString('en-IN')
      });

    } catch (error) {
      console.error("Failed to fetch", error);
      toast.error("Could not load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => loadData(), 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, pageSize, paymentFilter, dateFilter, customDates]);


  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
      const { start, end } = getDateRange(dateFilter, customDates.start, customDates.end);
      const params = new URLSearchParams({
        format,
        customer_name: searchTerm,
        payment_mode: paymentFilter == 'All' ? "" : paymentFilter,
        start_date: start,
        end_date: end
      });
      const url = `/api/transactions?${params.toString()}`;

      // 1. Fetch the data with the Header
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error("Export failed");

      // 2. Get the filename from headers (Optional, but recommended)
      // Look for: Content-Disposition: attachment; filename="transactions.csv"
      const disposition = response.headers.get('Content-Disposition');
      let filename = 'transactions.csv';
      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      // 3. Convert response to a Blob
      const blob = await response.blob();

      // 4. Create a temporary URL for the Blob
      const downloadUrl = window.URL.createObjectURL(blob);

      // 5. Create an invisible link and click it
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename; // Set the filename
      document.body.appendChild(link);
      link.click();

      // 6. Cleanup
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);

    } catch (error) {
      console.error("Download failed", error);
      alert("Failed to download export.");
    }
  };

  // --- BULK DELETE IMPLEMENTATION ---
  const handleBulkDelete = async () => {
    // 1. Confirm Intent
    const count = selection.selectedIds.length;
    if (!confirm(`Are you sure you want to delete ${count} transaction(s)? This will affect your Income Stats.`)) return;

    setIsLoading(true);

    try {
      // 2. Map selected IDs to Fetch Promises
      const deletePromises = selection.selectedIds.map(id =>
        fetch(`/api/transactions/${id}`, { method: 'DELETE', })
      );

      // 3. Execute all requests in parallel
      const results = await Promise.all(deletePromises);

      // 4. Check for failures
      const failed = results.filter(r => !r.ok);

      if (failed.length > 0) {
        // If all failed
        if (failed.length === results.length) {
          throw new Error("Failed to delete records. Check server logs.");
        }
        // If some failed
        toast.warning(`Completed with errors. ${failed.length} records could not be deleted.`);
      } else {
        toast.success(`${count} records deleted successfully.`);
      }

      // 5. Cleanup
      selection.setSelectedIds([]); // Clear checkboxes
      await loadData(); // Reload data to update Table AND Stats (Cash/UPI totals)

    } catch (error: any) {
      console.error("Bulk delete failed", error);
      toast.error(error.message || "Failed to delete transactions");
    } finally {
      setIsLoading(false);
    }
  };


  // --- SELECTION LOGIC ---
  const isPageSelected = transactions.length > 0 && transactions.every(t => selection.selectedIds.includes(t.id));

  const togglePageSelection = () => {
    const pageIds = transactions.map(t => t.id);
    if (isPageSelected) {
      selection.setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      selection.setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  const closeAllDropdowns = () => {
    setIsDateDropdownOpen(false);
    setIsExportDropdownOpen(false);
  };

  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end === totalPages) start = Math.max(1, end - 2);
    const pages = [];
    for (let i = start; i <= end; i++) { if (i > 0) pages.push(i); }
    return pages;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
      {(isDateDropdownOpen || isExportDropdownOpen) && (
        <div className="fixed inset-0 z-10" onClick={closeAllDropdowns}></div>
      )}

      <div className="max-w-350 mx-auto flex flex-col gap-6">

        {/* --- HEADER (CONDITIONAL RENDERING RESTORED) --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">

          {selection.selectedIds.length > 0 ? (
              <div className="flex flex-row items-center gap-4 justify-between  w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-2 animate-in fade-in">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 p-2 ml-2 text-lg">
                    <span className="font-semibold text-slate-700 dark:text-blue-100">
                      {selection.selectedIds.length} Selected
                    </span>
                  </div>
                </div>
                <div className="flex flex-row items-center gap-3 w-auto">
                  <button onClick={() => selection.setSelectedIds([])} className="flex w-full items-center gap-2 p-4 lg:py-2 lg:px-4 text-slate-600 dark:text-slate-300 hover:bg-white/50 text-sm font-bold rounded-md  transition-colors">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span className="hidden lg:flex">Cancel</span>
                  </button>
                  <button onClick={handleBulkDelete} className="flex w-full items-center gap-2 p-4 lg:py-2 lg:px-4 bg-red-500 hover:bg-red-600 text-white text-sm font-bold rounded-md shadow-sm transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    <span className="hidden lg:flex">Delete</span>
                  </button>
                </div>
              </div>
          ) : (
            // --- STANDARD HEADER ---
            <div className="flex flex-col gap-4 lg:flex-row w-full justify-between items-start lg:items-center">
              <h2 className="text-2xl font-bold text-[#0d141c] dark:text-white">Transactions</h2>

              <div className="flex flex-col lg:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
                {/* Search */}
                <div className="relative group w-full flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                    <span className="material-symbols-outlined">search</span>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="block w-full pl-10 pr-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    placeholder="Search by customer name..."
                  />
                </div>

                {/* Payment Mode Dropdown - ADDED THIS SECTION */}
                <div className="relative z-50 w-full lg:w-auto">
                  <button
                    onClick={() => {
                      setIsPaymentDropdownOpen(!isPaymentDropdownOpen);
                      setIsDateDropdownOpen(false);
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full lg:w-40 flex items-center justify-between pl-3 pr-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">payments</span>
                      <span>{paymentFilter === "" ? "All Modes" : paymentFilter}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                  </button>

                  {isPaymentDropdownOpen && (
                    <div className="absolute top-full mt-1 left-0 w-full bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100">
                      {['All', 'CASH', 'UPI'].map((option) => (
                        <button
                          key={option}
                          onClick={() => {
                            setPaymentFilter(option === 'All' ? "" : option);
                            setIsPaymentDropdownOpen(false);
                            setCurrentPage(1); // Reset page on filter change
                          }}
                          className="px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          {option === 'All' ? 'All Modes' : option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Date Dropdown */}
                <div className="relative z-40 w-full lg:w-auto">
                  <button
                    onClick={() => {
                      setIsDateDropdownOpen(!isDateDropdownOpen);
                      setIsPaymentDropdownOpen(false); // Close payment dropdown
                      setIsExportDropdownOpen(false);
                    }}
                    className="w-full lg:w-45 flex items-center justify-between pl-3 pr-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                      <span>{dateFilter}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                  </button>
                  {isDateDropdownOpen && (
                    <div className="absolute top-full mt-1 left-0 w-full lg:w-45 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col z-50">
                      {['Today', 'This Month', 'Last Month', 'Custom'].map((option) => (
                        <button key={option} onClick={() => { setDateFilter(option); setIsDateDropdownOpen(false); }} className="px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          {option}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Date Inputs */}
                {dateFilter === 'Custom' && (
                  <div className="flex flex-col sm:flex-row gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
                    <input type="date" value={customDates.start} onChange={(e) => setCustomDates({ ...customDates, start: e.target.value })} className="px-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm" />
                    <input
                      type="date"
                      value={customDates.end}
                      onChange={(e) => setCustomDates({ ...customDates, end: e.target.value })}
                      className="px-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>
                )}
                {/* Export Dropdown */}
                  <div className="relative z-20 flex-1 sm:flex-none">
                    <button
                      onClick={() => {
                        setIsExportDropdownOpen(!isExportDropdownOpen);
                        setIsDateDropdownOpen(false);
                        setIsPaymentDropdownOpen(false); // Close payment dropdown
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      <span>Export</span>
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                    {isExportDropdownOpen && (
                      <div className="absolute top-full mt-1 right-0 w-full sm:w-40 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 z-50">
                        <button onClick={() => handleExport('pdf')} className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span> PDF
                        </button>
                        <button onClick={() => handleExport('csv')} className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <span className="material-symbols-outlined text-green-500 text-[18px]">table_view</span> CSV
                        </button>
                      </div>
                    )}
                  </div>
              </div>
            </div>
          )}
        </div>

        {/* --- STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DashboardCard
            title="Cash Income"
            mainText={`₹ ${stats.cash}`}
            cardIcon={IndianRupee}
          />
          <DashboardCard
            title="UPI Income"
            mainText={`₹ ${stats.upi}`}
            cardIcon={IndianRupee}
          />
          <DashboardCard
            title="Total Income"
            mainText={`₹ ${stats.total}`}
            cardIcon={IndianRupee}
          />
        </div>

        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block bg-white dark:bg-[#1e2836] rounded-xl shadow-sm border border-[#e7edf4] dark:border-slate-700 overflow-hidden flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-[#e7edf4] dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 w-12.5">
                    <input
                      type="checkbox"
                      checked={isPageSelected}
                      onChange={togglePageSelection}
                      className="w-4 h-4 rounded border-gray-300 text-primary cursor-pointer"
                    />
                  </th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Txn. ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Customer</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Payment Mode</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">Type</th>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">Amount</th>
                  <th className="px-6 py-4 w-15"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e7edf4] dark:divide-slate-700 text-sm">
                {isLoading ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">Loading...</td></tr>
                ) : transactions.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-slate-500">No records found.</td></tr>
                ) : (
                  transactions.map((txn) => (
                    <TransactionRow
                      key={txn.id}
                      txn={txn}
                      isSelected={selection.selectedIds.includes(txn.id)}
                      onToggle={() => selection.toggleSelection(txn.id)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MOBILE CARDS --- */}
        <div className="flex flex-col gap-4 md:hidden">
          {isLoading ? <div className="p-8 text-center text-slate-500">Loading...</div> : transactions.map((txn) => (
            <TransactionMobileCard
              key={txn.id}
              txn={txn}
              isSelected={selection.selectedIds.includes(txn.id)}
              onToggle={() => selection.toggleSelection(txn.id)}
            />
          ))}
        </div>

        {/* --- PAGINATION FOOTER --- */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={handlePageSizeChange}
                className="border rounded bg-white dark:bg-slate-800 p-1"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
            <span>Showing {currentPage} of {totalPages || 1} pages</span>
          </div>

          {transactions.length > 0 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"
              >
                Previous
              </button>
              <div className="flex gap-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`
                        w-8 h-8 flex items-center justify-center text-sm rounded border transition-colors
                        ${pageNum === currentPage
                        ? 'bg-primary text-white border-primary'
                        : 'border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}
                      `}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1 text-sm border border-slate-300 dark:border-slate-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}