'use client'

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import BirthdayRow from '../components/birthdays/birthdayRow';
import BirthdayMobileCard from '../components/birthdays/birthdayMobileCard';
import { BirthdayCustomer } from '../components/birthdays/types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function Birthdays() {
  
  // --- State ---
  const [customers, setCustomers] = useState<BirthdayCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Default to current month
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(new Date().getMonth());
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); 
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  // --- API Call ---
  const loadData = async () => {
    setIsLoading(true);
    try {
      const skip = (currentPage - 1) * pageSize;
      
      // Construct params: month (1-12), search, pagination
      const params = new URLSearchParams({
        skip: skip.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        month: (selectedMonthIndex + 1).toString() 
      });

      // Replace with your actual endpoint, e.g., /api/customers/birthdays
      const res = await fetch(`/api/customers/birthdays?${params.toString()}`);
      
      if (!res.ok) throw new Error("Failed to fetch birthdays");

      const json = await res.json();

      // Map Backend -> Frontend
      const mappedData: BirthdayCustomer[] = (json.data || []).map((item: any) => ({
        id: item.id,
        name: item.name,
        phoneNumber: item.mobileNumber,
        birthDate: item.birthDate,
        formattedBirthDate: new Date(item.birthDate).toLocaleString('en-IN', {
            day: '2-digit', month: 'short'
        })
      }));

      setCustomers(mappedData);
      setTotalPages(Math.ceil((json.pagination?.total || 0) / pageSize));
      setTotalItems(json.pagination?.total || 0);

    } catch (error) {
      console.error("Failed to load birthdays", error);
      setCustomers([]); 
      toast.error("Failed to load birthdays");
    } finally {
      setIsLoading(false);
    }
  };

  // --- Effects ---
  useEffect(() => {
    const timer = setTimeout(() => loadData(), 500);
    return () => clearTimeout(timer);
  }, [currentPage, searchTerm, pageSize, selectedMonthIndex]);

  // --- Handlers ---
  const handleSendMessage = async (id: number) => {
    try {
      // 1. Optimistic UI / Loading Feedback
      toast.info(`Sending birthday message`);

      // 2. Call Backend
      const res = await fetch('/api/messages/send-birthday', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: id }), 
      });

      if (!res.ok) throw new Error("Failed to send message");

      // 3. Success Feedback
      toast.success(`Message sent successfully to ${name}!`);
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message. Please try again.");
    }
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
      {isMonthDropdownOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setIsMonthDropdownOpen(false)}></div>
      )}
      
      <div className="max-w-350 mx-auto flex flex-col gap-6">

        {/* --- HEADER --- */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 min-h-12.5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Birthdays</h2>
            
            <div className="flex flex-col sm:flex-row gap-3 flex-1 xl:justify-end">
                
                {/* Search */}
                <div className="relative group min-w-62.5">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-slate-400">search</span>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Search Name..."
                />
                </div>

                {/* Month Filter Dropdown */}
                <div className="relative z-50">
                <button
                    onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                    className="w-full sm:w-45 flex items-center justify-between pl-3 pr-3 py-2.5 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg text-sm text-[#0d141c] dark:text-white focus:outline-none focus:ring-1 focus:ring-primary transition-all shadow-sm"
                >
                    <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400">cake</span>
                    <span>{MONTHS[selectedMonthIndex]}</span>
                    </div>
                    <span className="material-symbols-outlined text-slate-400 text-sm">expand_more</span>
                </button>
                
                {isMonthDropdownOpen && (
                    <div className="absolute top-full mt-1 right-0 w-full sm:w-45 max-h-60 overflow-y-auto bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg flex flex-col animate-in fade-in zoom-in-95 duration-100 z-50">
                    {MONTHS.map((month, index) => (
                        <button 
                            key={month} 
                            onClick={() => { setSelectedMonthIndex(index); setIsMonthDropdownOpen(false); setCurrentPage(1); }} 
                            className={`px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${selectedMonthIndex === index ? 'text-primary font-medium bg-primary/5' : 'text-slate-700 dark:text-slate-200'}`}
                        >
                        {month}
                        </button>
                    ))}
                    </div>
                )}
                </div>
            </div>
        </div>

        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-col">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Customer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Birthdate</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {isLoading ? (
                   <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Loading...</td></tr>
                ) : customers.map((customer) => (
                  <BirthdayRow 
                    key={customer.id} 
                    customer={customer}
                    onSendMessage={() => handleSendMessage(customer.id)}
                  />
                ))}
                {!isLoading && customers.length === 0 && (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">No birthdays found for {MONTHS[selectedMonthIndex]}.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MOBILE CARDS --- */}
        <div className="flex flex-col gap-4 md:hidden">
          {isLoading ? (
             <div className="px-6 py-12 text-center text-slate-500">Loading...</div>
          ) : customers.map((customer) => (
            <BirthdayMobileCard 
                key={customer.id} 
                customer={customer} 
                onSendMessage={() => handleSendMessage(customer.id)}
            />
          ))}

          {!isLoading && customers.length === 0 && (
            <div className="px-6 py-8 text-center text-slate-500">No birthdays found for {MONTHS[selectedMonthIndex]}.</div>
          )}
        </div>

        {/* --- FOOTER --- */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows:</span>
                <select 
                  value={pageSize} 
                  onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                  className="h-8 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-2 py-0 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              
              <span>
                 Showing {currentPage} of {totalPages || 1} pages ({totalItems} items)
              </span>
            </div>

            {customers.length > 0 && (
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
        </div>
      </div>
    </main>
  );
}