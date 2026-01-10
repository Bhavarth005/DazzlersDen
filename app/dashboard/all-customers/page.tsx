'use client'

import { useEffect, useState } from 'react';
import { Customer } from '../components/customers/types';
import CustomerRow from '../components/customers/customerRow';
import CustomerMobileCard from '../components/customers/mobileCard';
import EditCustomerModal from '../components/customers/editCustomerModal';
import DeleteConfirmationModal from '../components/customers/deleteConformationModal';
import { useSelection } from '../components/customers/useSelection';
import BulkActionHeader from '../components/customers/bulkActionHeader';

type Response = {
  data: Customer[];
  totalPages: number;
  totalItems: number;
}

// Mock API
// Now accepts 'limit' (pageSize)
async function fetchCustomers(
  currentPage: number,
  searchTerm: string,
  limit: number 
): Promise<Response> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const res: Customer[] = [];
      let TOTAL_DB_ITEMS = 55; // Fake total count to demonstrate pagination math

      if(searchTerm) {
        TOTAL_DB_ITEMS = 5;
      }

      // Calculate how many items to return for this specific page
      // e.g. if we are on page 6 with size 10, we only return 5 items (51-55)
      const start = (currentPage - 1) * limit;
      const remaining = TOTAL_DB_ITEMS - start;
      const actualLimit = remaining < limit ? remaining : limit;

      if (remaining > 0) {
        for (let i = 0; i < actualLimit; i++) {
          res.push({
            id: (start + i).toString(),
            name: `Customer ${start + i} (${searchTerm})`,
            balance: Math.random() * 1000,
            birthdate: "2000-01-01",
            mobile: "+91 12345 12345",
          });
        }
      }

      resolve({
        data: res,
        totalPages: Math.ceil(TOTAL_DB_ITEMS / limit),
        totalItems: TOTAL_DB_ITEMS
      });
    }, 600); // reduced latency slightly for better UX
  });
}

export default function CustomerManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // New State for Page Size
  const [pageSize, setPageSize] = useState(10);
  
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const loadData = async () => {
      setIsLoading(true);
      try {
        // Pass pageSize to the API
        const resp = await fetchCustomers(currentPage, searchTerm, pageSize);
        setCustomers(resp.data);
        setTotalPages(resp.totalPages);
      } catch(err) {
        console.error(`Error while fetching data: ${err}`)
      } finally {
        setIsLoading(false);
      }
    }

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, currentPage, pageSize]);


  // const selection = useSelection(customers.map(c => c.id));
  const selection = useSelection([]);

  // Pagination logic
  const isPageSelected = customers.length > 0 && customers.every(item => selection.selectedIds.includes(item.id));
  const togglePageSelection = () => {
    const pageIds = customers.map(item => item.id);

    if (isPageSelected) {
      selection.setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      selection.setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const getPageNumbers = () => {
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end === totalPages) start = Math.max(1, end - 2);
    
    // Safety check if totalPages is 0 or 1
    if (end <= 0) return [];
    
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };


  // Deletion Logic
  const handleSingleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const handleBulkDelete = () => {
    selection.setSelectedIds([]);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      setCustomers(prev => prev.filter(c => c.id !== customerToDelete));
      selection.setSelectedIds(prev => prev.filter(id => id !== customerToDelete));
      console.log("Deleting single customer")
    } else {
      setCustomers(prev => prev.filter(c => !selection.selectedIds.includes(c.id)));
      console.log("Deleting " + selection.selectedIds)
      selection.setSelectedIds([]);
    }
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);
  };


  const handleSaveCustomer = (updatedCustomer: Customer) => {
    setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setEditingCustomer(null);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }

  // Handle Page Size Change
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to page 1 to avoid being out of bounds
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
        {(isExportDropdownOpen) && (
          <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)}></div>
        )}
        <div className="max-w-350 mx-auto flex flex-col gap-6">

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-12.5">
            {selection.selectedIds.length > 0 ? (
                <div className="w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-3">
                          <span className="font-semibold text-slate-700 dark:text-blue-100">
                              {selection.selectedIds.length} Selected
                          </span>
                      </div>
                  </div>
                  <div className="flex items-center gap-3">
                      <button
                          onClick={() => selection.setSelectedIds([])}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-white/50 rounded-md transition-colors"
                      >
                          Cancel
                      </button>
                      <button
                          onClick={() => setIsDeleteModalOpen(true)}
                          className="flex items-center gap-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors"
                      >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                          Delete
                      </button>
                  </div>
              </div>
            ) : (
                /* --- Standard Header --- */
                <>
                  <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                      Customer Management
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                      View and manage all registered customers.
                  </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                      </div>
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={handleSearch}
                        className="block w-full sm:w-64 pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm transition-all"
                        placeholder="Search ID, Name, Mobile..."
                      />
                  </div>
                  <button className="inline-flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-primary hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors whitespace-nowrap">
                      <span className="material-symbols-outlined mr-2" style={{ fontSize: '20px' }}>add</span>
                      Add Customer
                  </button>
                  
                  <div className="relative z-20 flex-1 sm:flex-none">
                    <button 
                      onClick={() => { setIsExportDropdownOpen(!isExportDropdownOpen); }}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm shadow-blue-500/30 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">download</span>
                      <span>Export</span>
                      <span className="material-symbols-outlined text-[18px]">expand_more</span>
                    </button>
                    {isExportDropdownOpen && (
                      <div className="absolute top-full mt-1 right-0 w-full sm:w-40 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100 z-50">
                        <button className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span> PDF
                        </button>
                        <button className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <span className="material-symbols-outlined text-green-500 text-[18px]">table_view</span> CSV
                        </button>
                      </div>
                    )}
                  </div>

                  </div>
              </>
            )}
          </div>

          {/* --- DESKTOP TABLE --- */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    {/* Page Checkbox */}
                    <th className="px-6 py-4 w-12.5">
                        <input 
                            type="checkbox" 
                            checked={isPageSelected}
                            onChange={togglePageSelection}
                            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer align-middle"
                        />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-37.5">Customer ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Birthdate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading 
                  ? <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex justify-center items-center gap-2 text-slate-500">
                          <span className="material-symbols-outlined animate-spin">progress_activity</span>
                          Loading data...
                        </div>
                      </td>
                    </tr>
                  : customers.map((cust) => (
                    <CustomerRow 
                      key={cust.id} 
                      customer={cust} 
                      isSelected={selection.selectedIds.includes(cust.id)}
                      onToggle={() => selection.toggleSelection(cust.id)}
                      onEdit={() => setEditingCustomer(cust)} 
                      onDelete={() => handleSingleDeleteClick(cust.id)}
                    />
                  ))}
                  {!isLoading && customers.length === 0 && (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No customers found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- MOBILE CARDS --- */}
          <div className="flex flex-col gap-4 md:hidden">
            {isLoading
            ? <div className="flex justify-center items-center gap-2 text-slate-500">
                <span className="material-symbols-outlined animate-spin">progress_activity</span>
                Loading data...
              </div>
            : customers.map((cust) => (
              <CustomerMobileCard 
                key={cust.id} 
                customer={cust} 
                isSelected={selection.selectedIds.includes(cust.id)}
                onToggle={() => selection.toggleSelection(cust.id)}
                onEdit={() => setEditingCustomer(cust)} 
                onDelete={() => handleSingleDeleteClick(cust.id)}
              />
            ))}
            {!isLoading && customers.length === 0 && (
              <div className="text-center p-8 text-slate-500">No customers found.</div>
            )}
          </div>

          {/* --- PAGINATION FOOTER --- */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2">
            
            {/* LEFT SIDE: Items Per Page + Showing Text */}
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select 
                  value={pageSize} 
                  onChange={handlePageSizeChange}
                  className="h-8 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-2 py-0 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <span>
                 Showing {currentPage} of {totalPages || 1} pages
              </span>
            </div>

            {/* RIGHT SIDE: Pagination Buttons */}
            {customers.length > 0 && (
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

      {/* --- EDIT CUSTOMER MODAL --- */}
      {editingCustomer && (
        <EditCustomerModal 
          customer={editingCustomer} 
          onClose={() => setEditingCustomer(null)} 
          onSave={handleSaveCustomer} 
        />
      )}

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        count={customerToDelete ? 1 : selection.selectedIds.length}
      />
    </>
  );
}