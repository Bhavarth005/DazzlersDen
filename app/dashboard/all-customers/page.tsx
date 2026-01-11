'use client'

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Customer } from '../components/customers/types';
import CustomerRow from '../components/customers/customerRow';
import CustomerMobileCard from '../components/customers/mobileCard';
import EditCustomerModal from '../components/customers/editCustomerModal';
import DeleteConfirmationModal from '../components/customers/deleteConformationModal';
import { useSelection } from '../components/customers/useSelection';
import { toast } from 'sonner';

async function fetchAllCustomers(searchTerm: string): Promise<Customer[]> {
  const token = localStorage.getItem('access_token');
  if (!token) throw new Error("No token found");

  // Only pass search param, no limit/skip
  const params = new URLSearchParams();
  if (searchTerm) params.append('search', searchTerm);

  const res = await fetch(`/api/customers?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) throw new Error("Unauthorized");
  if (!res.ok) throw new Error("Failed to fetch customers");

  const json = await res.json();
  console.log(json)

  // Handle both array or object response formats safely
  const rawData = Array.isArray(json) ? json : (json.data || []);

  return rawData.map((item: any) => ({
    id: item.id.toString(),
    name: item.name,
    balance: item.currentBalance ?? 0,
    mobile: item.mobileNumber || "",
    birthdate: item.birthdate ? new Date(item.birthdate).toISOString().split('T')[0] : "",
  }));
}

export default function CustomerManagement() {
  const router = useRouter();

  // -- STATE --
  const [searchTerm, setSearchTerm] = useState('');
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // We split state into "All Data" (from DB) and "Visible Data" (for current page)
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);

  // Modals & Selection
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // -- 1. LOAD DATA (Runs on Search change only) --
  const loadData = async () => {
    setIsLoading(true);
    try {
      // We fetch EVERYTHING once
      const data = await fetchAllCustomers(searchTerm);
      setAllCustomers(data);
      setCurrentPage(1); // Reset to page 1 when new data arrives
    } catch (err: any) {
      console.error(`Error fetching data: ${err}`);
      if (err.message === "Unauthorized") router.push('/auth/login');
    } finally {
      setIsLoading(false);
    }
  }

  // Debounced Fetch Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]); // Only re-fetch if Search changes

  // -- 2. CALCULATE VISIBLE DATA (Client-Side Pagination) --
  // This runs instantly when page/size changes, without hitting API
  const visibleCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return allCustomers.slice(startIndex, endIndex);
  }, [allCustomers, currentPage, pageSize]);

  const totalPages = Math.ceil(allCustomers.length / pageSize);
  const totalItems = allCustomers.length;

  // -- SELECTION LOGIC --
  const selection = useSelection([]);
  const isPageSelected = visibleCustomers.length > 0 && visibleCustomers.every(item => selection.selectedIds.includes(item.id));

  const togglePageSelection = () => {
    const pageIds = visibleCustomers.map(item => item.id);
    if (isPageSelected) {
      selection.setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      selection.setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  // -- HELPERS --
  const getPageNumbers = () => {
    if (totalPages <= 1) return [];
    let start = Math.max(1, currentPage - 1);
    let end = Math.min(totalPages, start + 2);
    if (end === totalPages) start = Math.max(1, end - 2);

    const pages = [];
    for (let i = start; i <= end; i++) {
      if (i > 0) pages.push(i);
    }
    return pages;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1);
  };

  // -- ACTIONS (Delete/Save) --
  const handleSingleDeleteClick = (id: string) => {
    setCustomerToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    const token = localStorage.getItem('access_token');
    // Determine which IDs to delete (Single ID vs Selected Array)
    const idsToDelete = customerToDelete ? [customerToDelete] : selection.selectedIds;

    // 1. Optimistic UI Update (Remove from table immediately)
    setAllCustomers(prev => prev.filter(c => !idsToDelete.includes(c.id)));
    selection.setSelectedIds(prev => prev.filter(id => !idsToDelete.includes(id)));

    // Close modal immediately
    setIsDeleteModalOpen(false);
    setCustomerToDelete(null);

    try {
      // 2. Loop and Delete
      // We use Promise.all to run them in parallel (faster than one by one)
      const deletePromises = idsToDelete.map(id =>
        fetch(`/api/customers/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
      );

      const results = await Promise.all(deletePromises);

      // Check if any failed
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        throw new Error(`Failed to delete ${failed.length} customer(s). They might have active sessions.`);
      }

      console.log("Delete successful");
      toast.success("Selected customers successfully deleted!");
    } catch (error: any) {
      console.error("Delete failed", error);
      alert(error.message);
      // If server delete failed, reload data to show the items again
      loadData();
    }
  };

  const handleExport = async (format: 'pdf' | 'csv') => {
    console.log(selection.selectedIds.join(","));
    try {
        const params = new URLSearchParams({
          format,
          search: searchTerm,
          customer_id: selection.selectedIds.join(",")
        });
        const token = localStorage.getItem("access_token");
        const url = `/api/customers?${params.toString()}`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`, // Header is now possible
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) throw new Error("Export failed");

        // Look for: Content-Disposition: attachment; filename="transactions.csv"
        const disposition = response.headers.get('Content-Disposition');
        let filename = 'customers.csv';
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

  const handleSaveCustomer = async (updatedCustomer: Customer) => {
    const token = localStorage.getItem('access_token');

    // 1. Optimistic UI Update (Update screen immediately before API returns)
    // This makes the app feel instant. If API fails, we revert (handle in catch).
    setAllCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
    setEditingCustomer(null);

    try {
      // 2. Data Mapping (Frontend -> Backend)
      const payload = {
        name: updatedCustomer.name,
        mobile_number: updatedCustomer.mobile, // MAPPED: mobile -> mobile_number
        birthdate: updatedCustomer.birthdate ? new Date(updatedCustomer.birthdate).toISOString() : null,
        // Note: We usually don't allow editing Balance directly via Edit Profile 
        // (that should happen via Recharge/Session), so I'm omitting balance here.
      };

      // 3. API Call
      const res = await fetch(`/api/customers/${updatedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Update failed");
      }

      console.log("Customer updated successfully on server");
      toast.success("Customer Updated!")
    } catch (e: any) {
      console.error("Update failed:", e);
      alert(`Failed to save changes: ${e.message}`);
      // Revert the optimistic update (optional, but good practice)
      loadData();
    }
  };

  return (
    <>
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-4 md:p-8">
        {(isExportDropdownOpen) && (
          <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)}></div>
        )}
        <div className="max-w-350 mx-auto flex flex-col gap-6">

          {/* HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 min-h-12.5">
            {selection.selectedIds.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 justify-between  w-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 animate-in fade-in">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 p-2 text-lg">
                  <span className="font-semibold text-slate-700 dark:text-blue-100">
                    {selection.selectedIds.length} Selected
                  </span>
                </div>
              </div>
              <div className="flex flex-col lg:flex-row items-center gap-3 w-full lg:w-auto">
                <button onClick={() => selection.setSelectedIds([])} className="flex w-full items-center gap-2 p-3 text-slate-600 dark:text-slate-300 hover:bg-white/50 text-sm font-medium rounded-md  transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>Cancel
                </button>
                <button onClick={() => {setIsDeleteModalOpen(true)}} className="flex w-full items-center gap-2 p-3 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md shadow-sm transition-colors">
                  <span className="material-symbols-outlined text-[18px]">delete</span> Delete
                </button>
              </div>
            </div>
            ) : (
              // Standard Header
              <div className="flex flex-col md:flex-row w-full items-start lg:items-center gap-4 justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Customer Management</h2>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <div className="relative group w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearch}
                      className="block w-full lg:w-64 pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white sm:text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                      placeholder="Search ID, Name, Mobile..."
                    />
                  </div>

                </div>
              </div>
            )}
              {/* Export Dropdown */}
              <div className="relative z-20 flex-1 sm:flex-none">
                <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="w-full md:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-blue-600 text-white text-sm font-semibold rounded-lg shadow-sm transition-all">
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Export</span>
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                </button>
                {isExportDropdownOpen && (
                  <div className="absolute top-full mt-1 right-0 w-full md:w-40 bg-white dark:bg-[#1e2836] border border-[#e7edf4] dark:border-slate-700 rounded-lg shadow-lg flex flex-col z-50">
                    <button onClick={() => handleExport("pdf")} className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined text-red-500 text-[18px]">picture_as_pdf</span> PDF
                    </button>
                    <button onClick={() => handleExport("csv")} className="flex items-center gap-3 px-4 py-2.5 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <span className="material-symbols-outlined text-green-500 text-[18px]">table_view</span> CSV
                    </button>
                  </div>
                )}
              </div>
          </div>

          {/* --- DESKTOP TABLE --- */}
          <div className="hidden md:block bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex-col">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-800">
                  <tr>
                    <th className="px-6 py-4 w-12.5">
                      <input type="checkbox" checked={isPageSelected} onChange={togglePageSelection} className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer align-middle" />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-37.5">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Birthdate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Balance</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                  {isLoading ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-500">Loading data...</td></tr>
                  ) : visibleCustomers.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-500">No customers found.</td></tr>
                  ) : (
                    visibleCustomers.map((cust) => (
                      <CustomerRow
                        key={cust.id}
                        customer={cust}
                        isSelected={selection.selectedIds.includes(cust.id)}
                        onToggle={() => selection.toggleSelection(cust.id)}
                        onEdit={() => setEditingCustomer(cust)}
                        onDelete={() => handleSingleDeleteClick(cust.id)}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- MOBILE CARDS --- */}
          <div className="flex flex-col gap-4 md:hidden">
            {isLoading ? (
              <div className="text-center p-8 text-slate-500">Loading data...</div>
            ) : visibleCustomers.length === 0 ? (
              <div className="text-center p-8 text-slate-500">No customers found.</div>
            ) : (
              visibleCustomers.map((cust) => (
                <CustomerMobileCard
                  key={cust.id}
                  customer={cust}
                  isSelected={selection.selectedIds.includes(cust.id)}
                  onToggle={() => selection.toggleSelection(cust.id)}
                  onEdit={() => setEditingCustomer(cust)}
                  onDelete={() => handleSingleDeleteClick(cust.id)}
                />
              ))
            )}
          </div>

          {/* --- PAGINATION FOOTER --- */}
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select value={pageSize} onChange={handlePageSizeChange} className="h-8 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-md px-2">
                  <option value={5}>5</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <span>Showing {currentPage} of {totalPages || 1} pages ({totalItems} items)</span>
            </div>

            {totalItems > 0 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50">Previous</button>
                <div className="flex gap-1">
                  {getPageNumbers().map((pageNum) => (
                    <button key={pageNum} onClick={() => setCurrentPage(pageNum)} className={`w-8 h-8 flex items-center justify-center text-sm rounded border ${pageNum === currentPage ? 'bg-primary text-white' : 'hover:bg-slate-100'}`}>
                      {pageNum}
                    </button>
                  ))}
                </div>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border rounded hover:bg-slate-100 disabled:opacity-50">Next</button>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* MODALS */}
      {editingCustomer && <EditCustomerModal customer={editingCustomer} onClose={() => setEditingCustomer(null)} onSave={handleSaveCustomer} />}
      <DeleteConfirmationModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} count={customerToDelete ? 1 : selection.selectedIds.length} />
    </>
  );
}