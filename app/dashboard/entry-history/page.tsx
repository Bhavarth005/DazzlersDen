'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Entry } from '../components/entry-history/types';
import EntryRow from '../components/entry-history/entryRow';
import EntryMobileCard from '../components/entry-history/entryMobileCard';
import { useSelection } from '../components/customers/useSelection';
import { toast } from 'sonner';
import EntryDetailsModal from '../components/entry-history/entryDetailsModal';

// --- HELPER: Date Range Calculator (Same as Transactions) ---
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

export default function EntryHistory() {
  const router = useRouter();
  
  // --- Data & Pagination State ---
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); 
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // --- Filter States ---
  const [dateFilter, setDateFilter] = useState('This Month');
  const [isDateDropdownOpen, setIsDateDropdownOpen] = useState(false);
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [customDates, setCustomDates] = useState({ start: '', end: '' });

  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null); // New State

  // --- API CALL: Load Sessions ---
  const loadData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('access_token');

    try {
      // 1. Calculate Date Range
      const { start, end } = getDateRange(dateFilter, customDates.start, customDates.end);
      
      // 2. Build Query Params
      const skip = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        start_date: start,
        end_date: end
      });

      // 3. Fetch
      // We point to /api/sessions because "Entries" are essentially "Sessions"
      const res = await fetch(`/api/sessions?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.status === 401) { router.push('/auth/login'); return; }
      if (!res.ok) throw new Error("Failed to fetch entries");

      const json = await res.json();
      console.log(json);

      // 4. Map Backend (Session) -> Frontend (Entry)
      const mappedData: Entry[] = (json.data || []).map((item: any) => ({
        id: item.id.toString(),
        customerName: item.customer?.name || "Unknown",
        phoneNumber: item.customer?.mobileNumber,
        children: item.children,
        adults: item.adults,
        actualCost: item.actualCost,
        discountPercentage: item.discountPercentage,
        discountReason: item.discountReason,
        // Format ISO date to readable string
        startTime: new Date(item.startTime).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }),
        expectedEndTime: new Date(item.expectedEndTime).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
        }),
        endTime: item.status === 'COMPLETED' && item.actualEndTime 
            ? new Date(item.actualEndTime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) 
            : '-',
        duration: `${item.durationHr} hrs`,
        status: item.status, // "ACTIVE" or "COMPLETED"
      }));

      setEntries(mappedData);
      setTotalPages(Math.ceil((json.pagination?.total || 0) / pageSize));
      setTotalItems(json.pagination?.total || 0);

    } catch (error) {
      console.error("Failed to load entries", error);
      toast.error("Failed to load history");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => loadData(), 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, pageSize, dateFilter, customDates]);


  // --- HANDLERS ---
  
  // 1. Export
  // const handleExport = (format: 'pdf' | 'csv') => {
  //   const { start, end } = getDateRange(dateFilter, customDates.start, customDates.end);
  //   const params = new URLSearchParams({
  //       format,
  //       search: searchTerm,
  //       start_date: start,
  //       end_date: end
  //   });
  //   // Assuming you will create /api/export/sessions later. 
  //   // For now, if you want to reuse transaction export, point there, 
  //   // but ideally, you need a specific route for session export.
  //   window.open(`/api/export/sessions?${params.toString()}`, '_blank');
  // };

  const handleExport = async (format: 'pdf' | 'csv') => {
    try {
        const { start, end } = getDateRange(dateFilter, customDates.start, customDates.end);
        const params = new URLSearchParams({
          format,
          search: searchTerm,
          start_date: start,
          end_date: end
        });
        const token = localStorage.getItem("access_token");
        const url = `/api/export/sessions?${params.toString()}`;

        // 1. Fetch the data with the Header
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Header is now possible
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error("Export failed");

        // 2. Get the filename from headers (Optional, but recommended)
        // Look for: Content-Disposition: attachment; filename="transactions.csv"
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'sessions.csv';
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

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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
    for (let i = start; i <= end; i++) { if(i>0) pages.push(i); }
    return pages;
  };

  return (
    <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
      {(isDateDropdownOpen || isExportDropdownOpen) && (
        <div className="fixed inset-0 z-10" onClick={closeAllDropdowns}></div>
      )}
      
      <div className="max-w-350 mx-auto flex flex-col gap-6">

        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-h-12.5">
            
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Entry History</h2>
              
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  
                  {/* Search */}
                  <div className="relative group min-w-62.5">
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearch}
                      className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Search Entry ID or Name..."
                    />
                  </div>

                  {/* Date Filter Dropdown */}
                  <div className="relative z-50">
                    <button
                      onClick={() => { setIsDateDropdownOpen(!isDateDropdownOpen); setIsExportDropdownOpen(false); }}
                      className="w-full sm:w-45 flex items-center justify-between pl-3 pr-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-slate-400">calendar_today</span>
                        <span>{dateFilter}</span>
                      </div>
                      <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                    </button>
                    
                    {isDateDropdownOpen && (
                      <div className="absolute top-full mt-1 left-0 w-full sm:w-45 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 z-50">
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
                      <input type="date" value={customDates.start} onChange={(e) => setCustomDates({...customDates, start: e.target.value})} className="px-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"/>
                      <input type="date" value={customDates.end} onChange={(e) => setCustomDates({...customDates, end: e.target.value})} className="px-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-1 focus:ring-primary shadow-sm"/>
                  </div>
                  )}

                  {/* Export Button */}
                  <div className="relative z-20 flex-1 sm:flex-none">
                    <button 
                      onClick={() => { setIsExportDropdownOpen(!isExportDropdownOpen); setIsDateDropdownOpen(false); }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all active:scale-95"
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
          
        </div>

        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Entry ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Start Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">End Time</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Status</th>
                  <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                   <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : entries.map((entry) => (
                  <EntryRow 
                    key={entry.id} 
                    entry={entry}
                    onView={() => setViewingEntry(entry)}
                  />
                ))}
                {!isLoading && entries.length === 0 && (
                  <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-500">No entries found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MOBILE CARDS --- */}
        <div className="flex flex-col gap-4 md:hidden">
          {isLoading ? (
             <div className="px-6 py-12 text-center text-slate-500">Loading...</div>
          ) : entries.map((entry) => (
            <EntryMobileCard 
                key={entry.id} 
                entry={entry} 
                onTap={() => setViewingEntry(entry)}
            />
          ))}

          {!isLoading && entries.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500">No entries found.</div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows:</span>
                <select 
                  value={pageSize} 
                  onChange={handlePageSizeChange}
                  className="h-8 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-2 py-0 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <span>
                 Showing {currentPage} of {totalPages || 1} pages ({totalItems} items)
              </span>
            </div>

            {entries.length > 0 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">Previous</button>
              <div className="flex gap-1">
                {getPageNumbers().map((pageNum) => (
                  <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center text-sm rounded border transition-colors ${pageNum === currentPage ? 'bg-primary text-white border-primary' : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>{pageNum}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors">Next</button>
            </div>
            )}

            {viewingEntry && (
                <EntryDetailsModal 
                    entry={viewingEntry} 
                    onClose={() => setViewingEntry(null)} 
                />
            )}
        </div>
      </div>
    </main>
  );
}